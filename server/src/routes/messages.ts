import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get messages for a conversation
router.get('/conversation/:conversationId', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      // Verify user is participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: req.user!.id,
          leftAt: null
        }
      });

      if (!participant) {
        return res.status(403).json({ message: 'Not authorized to view messages' });
      }

      const messages = await prisma.message.findMany({
        where: { 
          conversationId,
          isDeleted: false
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
          },
          readBy: {
            select: {
              userId: true,
              readAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const totalMessages = await prisma.message.count({
        where: { 
          conversationId,
          isDeleted: false 
        }
      });

      res.json({
        messages: messages.reverse(),
        pagination: {
          page,
          limit,
          total: totalMessages,
          totalPages: Math.ceil(totalMessages / limit)
        }
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Search messages
router.get('/search',
  authenticateToken,
  [
    query('q').notEmpty().isLength({ min: 1, max: 100 }),
    query('conversationId').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { q, conversationId } = req.query;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause: any = {
        content: {
          contains: q as string,
          mode: 'insensitive'
        },
        isDeleted: false,
        conversation: {
          participants: {
            some: {
              userId: req.user!.id,
              leftAt: null
            }
          }
        }
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      const messages = await prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          },
          conversation: {
            select: {
              id: true,
              type: true,
              name: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.message.count({ where: whereClause });

      res.json({
        messages,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Search messages error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Edit message
router.put('/:messageId',
  authenticateToken,
  [body('content').notEmpty().isLength({ max: 4000 })],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { messageId } = req.params;
      const { content } = req.body;

      // Verify message belongs to user
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: req.user!.id,
          isDeleted: false
        }
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      // Check if message is too old to edit (15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      if (message.createdAt < fifteenMinutesAgo) {
        return res.status(400).json({ message: 'Message too old to edit' });
      }

      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content,
          isEdited: true,
          updatedAt: new Date()
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
          attachments: true
        }
      });

      res.json(updatedMessage);
    } catch (error) {
      console.error('Edit message error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete message
router.delete('/:messageId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { messageId } = req.params;

      // Verify message belongs to user
      const message = await prisma.message.findFirst({
        where: {
          id: messageId,
          senderId: req.user!.id,
          isDeleted: false
        }
      });

      if (!message) {
        return res.status(404).json({ message: 'Message not found' });
      }

      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: null,
          updatedAt: new Date()
        }
      });

      res.json({ message: 'Message deleted successfully' });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Mark message as read
router.post('/:messageId/read',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { messageId } = req.params;

      await prisma.messageRead.upsert({
        where: {
          messageId_userId: {
            messageId,
            userId: req.user!.id
          }
        },
        update: { readAt: new Date() },
        create: {
          messageId,
          userId: req.user!.id,
          readAt: new Date()
        }
      });

      res.json({ message: 'Message marked as read' });
    } catch (error) {
      console.error('Mark read error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;