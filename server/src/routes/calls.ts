import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get call history
router.get('/',
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isIn(['AUDIO', 'VIDEO']),
    query('status').optional().isIn(['PENDING', 'ACCEPTED', 'DECLINED', 'MISSED', 'ENDED'])
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
      const { type, status } = req.query;
      const userId = req.user!.id;

      const whereClause: any = {
        OR: [
          { senderId: userId },
          { receiverId: userId }
        ]
      };

      if (type) {
        whereClause.type = type;
      }

      if (status) {
        whereClause.status = status;
      }

      const calls = await prisma.call.findMany({
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
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.call.count({ where: whereClause });

      // Add additional metadata for each call
      const callsWithMetadata = calls.map(call => ({
        ...call,
        isIncoming: call.receiverId === userId,
        isOutgoing: call.senderId === userId,
        otherUser: call.senderId === userId ? call.receiver : call.sender
      }));

      res.json({
        calls: callsWithMetadata,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get calls error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get specific call
router.get('/:callId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;
      const userId = req.user!.id;

      const call = await prisma.call.findFirst({
        where: {
          id: callId,
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
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
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      if (!call) {
        return res.status(404).json({ message: 'Call not found' });
      }

      const callWithMetadata = {
        ...call,
        isIncoming: call.receiverId === userId,
        isOutgoing: call.senderId === userId,
        otherUser: call.senderId === userId ? call.receiver : call.sender
      };

      res.json(callWithMetadata);
    } catch (error) {
      console.error('Get call error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Initiate call (handled by Socket.io, but can also be done via REST)
router.post('/initiate',
  authenticateToken,
  [
    body('receiverId').isString().notEmpty(),
    body('type').isIn(['AUDIO', 'VIDEO'])
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { receiverId, type } = req.body;
      const senderId = req.user!.id;

      if (senderId === receiverId) {
        return res.status(400).json({ message: 'Cannot call yourself' });
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId }
      });

      if (!receiver) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if there's already an active call between these users
      const activeCall = await prisma.call.findFirst({
        where: {
          OR: [
            { senderId, receiverId, status: 'PENDING' },
            { senderId, receiverId, status: 'ACCEPTED' },
            { senderId: receiverId, receiverId: senderId, status: 'PENDING' },
            { senderId: receiverId, receiverId: senderId, status: 'ACCEPTED' }
          ]
        }
      });

      if (activeCall) {
        return res.status(400).json({ message: 'There is already an active call between these users' });
      }

      const call = await prisma.call.create({
        data: {
          senderId,
          receiverId,
          type,
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
          },
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      res.status(201).json(call);
    } catch (error) {
      console.error('Initiate call error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Accept call
router.post('/:callId/accept',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;
      const userId = req.user!.id;

      const call = await prisma.call.findFirst({
        where: {
          id: callId,
          receiverId: userId,
          status: 'PENDING'
        }
      });

      if (!call) {
        return res.status(404).json({ message: 'Call not found or not pending' });
      }

      const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'ACCEPTED',
          startedAt: new Date()
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
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      res.json(updatedCall);
    } catch (error) {
      console.error('Accept call error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Decline call
router.post('/:callId/decline',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;
      const userId = req.user!.id;

      const call = await prisma.call.findFirst({
        where: {
          id: callId,
          receiverId: userId,
          status: 'PENDING'
        }
      });

      if (!call) {
        return res.status(404).json({ message: 'Call not found or not pending' });
      }

      const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'DECLINED',
          endedAt: new Date()
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
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      res.json(updatedCall);
    } catch (error) {
      console.error('Decline call error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// End call
router.post('/:callId/end',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { callId } = req.params;
      const userId = req.user!.id;

      const call = await prisma.call.findFirst({
        where: {
          id: callId,
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: { in: ['PENDING', 'ACCEPTED'] }
        }
      });

      if (!call) {
        return res.status(404).json({ message: 'Call not found or already ended' });
      }

      let duration = null;
      if (call.startedAt) {
        duration = Math.floor((Date.now() - call.startedAt.getTime()) / 1000);
      }

      const updatedCall = await prisma.call.update({
        where: { id: callId },
        data: {
          status: 'ENDED',
          endedAt: new Date(),
          ...(duration && { duration })
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
          receiver: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true
            }
          }
        }
      });

      res.json(updatedCall);
    } catch (error) {
      console.error('End call error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get call statistics
router.get('/stats/summary',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      const stats = await prisma.call.groupBy({
        by: ['status', 'type'],
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ]
        },
        _count: {
          id: true
        },
        _sum: {
          duration: true
        }
      });

      // Calculate total call time
      const totalDuration = await prisma.call.aggregate({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: 'ENDED',
          duration: { not: null }
        },
        _sum: {
          duration: true
        }
      });

      const summary = {
        totalCalls: stats.reduce((sum, stat) => sum + stat._count.id, 0),
        totalDuration: totalDuration._sum.duration || 0,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: stats.reduce((acc, stat) => {
          acc[stat.type] = (acc[stat.type] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>)
      };

      res.json(summary);
    } catch (error) {
      console.error('Get call stats error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;