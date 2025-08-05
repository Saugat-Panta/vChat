import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        isVerified: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            posts: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search users
router.get('/', [
  query('q').optional().isString().isLength({ min: 1, max: 50 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { q } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const whereClause = q ? {
      OR: [
        { username: { contains: q as string, mode: 'insensitive' } },
        { displayName: { contains: q as string, mode: 'insensitive' } }
      ]
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        isOnline: true,
        isVerified: true,
        _count: {
          select: {
            followers: true,
            posts: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.user.count({ where: whereClause });

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('displayName').optional().isString().isLength({ min: 1, max: 50 }),
    body('bio').optional().isString().isLength({ max: 500 }),
    body('avatar').optional().isString()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { displayName, bio, avatar } = req.body;
      const userId = req.user!.id;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(displayName && { displayName }),
          ...(bio !== undefined && { bio }),
          ...(avatar && { avatar })
        },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatar: true,
          bio: true,
          phone: true,
          isOnline: true,
          lastSeen: true,
          isVerified: true,
          createdAt: true
        }
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Follow user
router.post('/:userId/follow',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.user!.id;

      if (userId === followerId) {
        return res.status(400).json({ message: 'Cannot follow yourself' });
      }

      // Check if user exists
      const targetUser = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Check if already following
      const existingFollow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: userId
          }
        }
      });

      if (existingFollow) {
        return res.status(400).json({ message: 'Already following this user' });
      }

      await prisma.follow.create({
        data: {
          followerId,
          followingId: userId
        }
      });

      res.json({ message: 'User followed successfully' });
    } catch (error) {
      console.error('Follow user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Unfollow user
router.delete('/:userId/follow',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.user!.id;

      await prisma.follow.deleteMany({
        where: {
          followerId,
          followingId: userId
        }
      });

      res.json({ message: 'User unfollowed successfully' });
    } catch (error) {
      console.error('Unfollow user error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get user followers
router.get('/:userId/followers',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const followers = await prisma.follow.findMany({
        where: { followingId: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.follow.count({
        where: { followingId: userId }
      });

      res.json({
        followers: followers.map(f => f.follower),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get followers error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get user following
router.get('/:userId/following',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 })
  ],
  async (req, res) => {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.follow.count({
        where: { followerId: userId }
      });

      res.json({
        following: following.map(f => f.following),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get following error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;