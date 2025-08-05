import { Server, Socket } from 'socket.io';
import { prisma } from '../index';
import { AuthenticatedSocket } from '../middleware/auth';

interface OnlineUser {
  userId: string;
  socketId: string;
  username: string;
  avatar?: string;
}

// Store online users
const onlineUsers = new Map<string, OnlineUser>();

export const setupSocketHandlers = (io: Server) => {
  io.on('connection', async (socket: AuthenticatedSocket) => {
    if (!socket.user) return;

    const userId = socket.user.id;
    console.log(`User ${socket.user.username} connected`);

    // Add user to online users
    onlineUsers.set(userId, {
      userId,
      socketId: socket.id,
      username: socket.user.username,
      avatar: undefined // Will be set when user data is fetched
    });

    // Update user online status
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true }
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);

    // Join user to their conversation rooms
    const conversations = await prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true }
    });

    conversations.forEach(conv => {
      socket.join(`conversation:${conv.conversationId}`);
    });

    // Emit online status to contacts
    socket.broadcast.emit('user:online', { userId, username: socket.user.username });

    // Handle joining conversations
    socket.on('conversation:join', async (conversationId: string) => {
      try {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId,
            userId,
            leftAt: null
          }
        });

        if (participant) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('conversation:joined', { conversationId });
        } else {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversations
    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      socket.emit('conversation:left', { conversationId });
    });

    // Handle sending messages
    socket.on('message:send', async (data: {
      conversationId: string;
      content?: string;
      type: string;
      attachments?: any[];
      replyToId?: string;
    }) => {
      try {
        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: data.conversationId,
            userId,
            leftAt: null
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'Not authorized to send messages to this conversation' });
          return;
        }

        // Create message
        const message = await prisma.message.create({
          data: {
            conversationId: data.conversationId,
            senderId: userId,
            content: data.content,
            type: data.type as any,
            replyToId: data.replyToId,
            attachments: data.attachments ? {
              create: data.attachments.map(att => ({
                type: att.type,
                url: att.url,
                filename: att.filename,
                size: att.size,
                duration: att.duration
              }))
            } : undefined
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            },
            attachments: true,
            replyTo: {
              include: {
                sender: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true
                  }
                }
              }
            }
          }
        });

        // Update conversation's updatedAt
        await prisma.conversation.update({
          where: { id: data.conversationId },
          data: { updatedAt: new Date() }
        });

        // Emit message to conversation participants
        io.to(`conversation:${data.conversationId}`).emit('message:received', message);

        // Send push notifications to offline users (placeholder)
        // In a real implementation, you would send push notifications here

      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle message read status
    socket.on('message:read', async (data: { messageId: string }) => {
      try {
        await prisma.messageRead.upsert({
          where: {
            messageId_userId: {
              messageId: data.messageId,
              userId
            }
          },
          update: { readAt: new Date() },
          create: {
            messageId: data.messageId,
            userId,
            readAt: new Date()
          }
        });

        // Get message details to notify sender
        const message = await prisma.message.findUnique({
          where: { id: data.messageId },
          select: { senderId: true, conversationId: true }
        });

        if (message && message.senderId !== userId) {
          io.to(`user:${message.senderId}`).emit('message:read', {
            messageId: data.messageId,
            readBy: userId,
            conversationId: message.conversationId
          });
        }
      } catch (error) {
        console.error('Message read error:', error);
      }
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', {
        userId,
        username: socket.user.username,
        conversationId: data.conversationId
      });
    });

    socket.on('typing:stop', (data: { conversationId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', {
        userId,
        conversationId: data.conversationId
      });
    });

    // Handle video calls
    socket.on('call:initiate', async (data: {
      receiverId: string;
      type: 'AUDIO' | 'VIDEO';
    }) => {
      try {
        // Create call record
        const call = await prisma.call.create({
          data: {
            senderId: userId,
            receiverId: data.receiverId,
            type: data.type,
            status: 'PENDING'
          },
          include: {
            sender: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true
              }
            }
          }
        });

        // Notify receiver
        io.to(`user:${data.receiverId}`).emit('call:incoming', {
          call,
          offer: null // WebRTC offer will be sent separately
        });

        socket.emit('call:initiated', { call });
      } catch (error) {
        console.error('Call initiate error:', error);
        socket.emit('error', { message: 'Failed to initiate call' });
      }
    });

    socket.on('call:accept', async (data: { callId: string }) => {
      try {
        const call = await prisma.call.update({
          where: { id: data.callId },
          data: {
            status: 'ACCEPTED',
            startedAt: new Date()
          },
          include: {
            sender: true,
            receiver: true
          }
        });

        // Notify caller
        io.to(`user:${call.senderId}`).emit('call:accepted', { call });
        socket.emit('call:accepted', { call });
      } catch (error) {
        console.error('Call accept error:', error);
      }
    });

    socket.on('call:decline', async (data: { callId: string }) => {
      try {
        const call = await prisma.call.update({
          where: { id: data.callId },
          data: {
            status: 'DECLINED',
            endedAt: new Date()
          }
        });

        // Notify caller
        const callData = await prisma.call.findUnique({
          where: { id: data.callId },
          include: { sender: true, receiver: true }
        });

        if (callData) {
          io.to(`user:${callData.senderId}`).emit('call:declined', { call: callData });
        }
      } catch (error) {
        console.error('Call decline error:', error);
      }
    });

    socket.on('call:end', async (data: { callId: string }) => {
      try {
        const existingCall = await prisma.call.findUnique({
          where: { id: data.callId }
        });

        if (existingCall && existingCall.startedAt) {
          const duration = Math.floor((Date.now() - existingCall.startedAt.getTime()) / 1000);
          
          const call = await prisma.call.update({
            where: { id: data.callId },
            data: {
              status: 'ENDED',
              endedAt: new Date(),
              duration
            },
            include: {
              sender: true,
              receiver: true
            }
          });

          // Notify both participants
          io.to(`user:${call.senderId}`).emit('call:ended', { call });
          io.to(`user:${call.receiverId}`).emit('call:ended', { call });
        }
      } catch (error) {
        console.error('Call end error:', error);
      }
    });

    // WebRTC signaling
    socket.on('webrtc:offer', (data: { callId: string; offer: any; receiverId: string }) => {
      io.to(`user:${data.receiverId}`).emit('webrtc:offer', {
        callId: data.callId,
        offer: data.offer,
        senderId: userId
      });
    });

    socket.on('webrtc:answer', (data: { callId: string; answer: any; senderId: string }) => {
      io.to(`user:${data.senderId}`).emit('webrtc:answer', {
        callId: data.callId,
        answer: data.answer,
        receiverId: userId
      });
    });

    socket.on('webrtc:ice-candidate', (data: { candidate: any; targetId: string }) => {
      io.to(`user:${data.targetId}`).emit('webrtc:ice-candidate', {
        candidate: data.candidate,
        senderId: userId
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected`);
      
      // Remove from online users
      onlineUsers.delete(userId);

      // Update user offline status
      await prisma.user.update({
        where: { id: userId },
        data: {
          isOnline: false,
          lastSeen: new Date()
        }
      });

      // Notify contacts about offline status
      socket.broadcast.emit('user:offline', { userId });
    });
  });
};