import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get user's conversations
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId: req.user!.id,
              leftAt: null
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            },
            where: { leftAt: null }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
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
          _count: {
            select: {
              messages: {
                where: {
                  readBy: {
                    none: {
                      userId: req.user!.id
                    }
                  },
                  senderId: {
                    not: req.user!.id
                  }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.conversation.count({
        where: {
          participants: {
            some: {
              userId: req.user!.id,
              leftAt: null
            }
          }
        }
      });

      res.json({
        conversations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get conversations error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get specific conversation
router.get('/:conversationId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;

      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId: req.user!.id,
              leftAt: null
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            },
            where: { leftAt: null }
          }
        }
      });

      if (!conversation) {
        return res.status(404).json({ message: 'Conversation not found' });
      }

      res.json(conversation);
    } catch (error) {
      console.error('Get conversation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create direct conversation
router.post('/direct',
  authenticateToken,
  [body('userId').isString().notEmpty()],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { userId } = req.body;
      const currentUserId = req.user!.id;

      if (userId === currentUserId) {
        return res.status(400).json({ message: 'Cannot create conversation with yourself' });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [currentUserId, userId]
              },
              leftAt: null
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      if (existingConversation && existingConversation.participants.length === 2) {
        return res.json(existingConversation);
      }

      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId: currentUserId, role: 'MEMBER' },
              { userId, role: 'MEMBER' }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create direct conversation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create group conversation
router.post('/group',
  authenticateToken,
  [
    body('name').isString().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('participantIds').isArray().isLength({ min: 1, max: 99 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, participantIds } = req.body;
      const currentUserId = req.user!.id;

      // Verify all participants exist
      const users = await prisma.user.findMany({
        where: {
          id: {
            in: [...participantIds, currentUserId]
          }
        }
      });

      if (users.length !== participantIds.length + 1) {
        return res.status(400).json({ message: 'Some users not found' });
      }

      // Create group conversation
      const conversation = await prisma.conversation.create({
        data: {
          type: 'GROUP',
          name,
          description,
          isGroup: true,
          participants: {
            create: [
              { userId: currentUserId, role: 'ADMIN' },
              ...participantIds.map((id: string) => ({
                userId: id,
                role: 'MEMBER' as const
              }))
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      res.status(201).json(conversation);
    } catch (error) {
      console.error('Create group conversation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Update conversation (name, description, avatar)
router.put('/:conversationId',
  authenticateToken,
  [
    body('name').optional().isString().isLength({ min: 1, max: 100 }),
    body('description').optional().isString().isLength({ max: 500 }),
    body('avatar').optional().isString()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const { name, description, avatar } = req.body;

      // Verify user is admin or moderator
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: req.user!.id,
          role: {
            in: ['ADMIN', 'MODERATOR']
          },
          leftAt: null
        }
      });

      if (!participant) {
        return res.status(403).json({ message: 'Not authorized to update this conversation' });
      }

      const conversation = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
          ...(avatar && { avatar })
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            }
          }
        }
      });

      res.json(conversation);
    } catch (error) {
      console.error('Update conversation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Add participants to group
router.post('/:conversationId/participants',
  authenticateToken,
  [body('userIds').isArray().isLength({ min: 1, max: 20 })],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { conversationId } = req.params;
      const { userIds } = req.body;

      // Verify user is admin or moderator
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: req.user!.id,
          role: {
            in: ['ADMIN', 'MODERATOR']
          },
          leftAt: null
        }
      });

      if (!participant) {
        return res.status(403).json({ message: 'Not authorized to add participants' });
      }

      // Add participants
      await prisma.conversationParticipant.createMany({
        data: userIds.map((userId: string) => ({
          conversationId,
          userId,
          role: 'MEMBER'
        })),
        skipDuplicates: true
      });

      const updatedConversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true,
                  isOnline: true,
                  lastSeen: true
                }
              }
            },
            where: { leftAt: null }
          }
        }
      });

      res.json(updatedConversation);
    } catch (error) {
      console.error('Add participants error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Leave conversation
router.post('/:conversationId/leave',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { conversationId } = req.params;

      await prisma.conversationParticipant.updateMany({
        where: {
          conversationId,
          userId: req.user!.id,
          leftAt: null
        },
        data: {
          leftAt: new Date()
        }
      });

      res.json({ message: 'Left conversation successfully' });
    } catch (error) {
      console.error('Leave conversation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;