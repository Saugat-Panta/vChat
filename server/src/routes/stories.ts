import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get stories (current user's following + own stories)
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
      const userId = req.user!.id;

      // Get IDs of users the current user follows + their own ID
      const following = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });

      const userIds = [userId, ...following.map(f => f.followingId)];

      // Get active stories (not expired)
      const stories = await prisma.story.findMany({
        where: {
          userId: { in: userIds },
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          },
          views: userId ? {
            where: { userId },
            select: { id: true, viewedAt: true }
          } : false,
          _count: {
            select: { views: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      // Group stories by user
      const storiesByUser = stories.reduce((acc, story) => {
        const userKey = story.userId;
        if (!acc[userKey]) {
          acc[userKey] = {
            user: story.user,
            stories: [],
            hasUnviewedStories: false
          };
        }
        
        const isViewed = story.views.length > 0;
        acc[userKey].stories.push({
          ...story,
          isViewed,
          views: undefined // Remove views array, keep only count
        });

        if (!isViewed) {
          acc[userKey].hasUnviewedStories = true;
        }

        return acc;
      }, {} as any);

      // Convert to array and sort (own stories first, then by latest story)
      const groupedStories = Object.values(storiesByUser).sort((a: any, b: any) => {
        if (a.user.id === userId) return -1;
        if (b.user.id === userId) return 1;
        
        // Sort by unviewed first, then by latest story
        if (a.hasUnviewedStories && !b.hasUnviewedStories) return -1;
        if (!a.hasUnviewedStories && b.hasUnviewedStories) return 1;
        
        const latestA = Math.max(...a.stories.map((s: any) => new Date(s.createdAt).getTime()));
        const latestB = Math.max(...b.stories.map((s: any) => new Date(s.createdAt).getTime()));
        
        return latestB - latestA;
      });

      res.json({
        stories: groupedStories,
        pagination: {
          page,
          limit,
          total: groupedStories.length,
          totalPages: Math.ceil(groupedStories.length / limit)
        }
      });
    } catch (error) {
      console.error('Get stories error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get user's own stories
router.get('/my',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;

      const stories = await prisma.story.findMany({
        where: {
          userId,
          expiresAt: { gt: new Date() }
        },
        include: {
          views: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  displayName: true,
                  avatar: true
                }
              }
            },
            orderBy: { viewedAt: 'desc' }
          },
          _count: {
            select: { views: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(stories);
    } catch (error) {
      console.error('Get my stories error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create story
router.post('/',
  authenticateToken,
  [
    body('type').isIn(['IMAGE', 'VIDEO']),
    body('url').isString().notEmpty(),
    body('content').optional().isString().isLength({ max: 500 })
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { type, url, content } = req.body;
      const userId = req.user!.id;

      // Stories expire after 24 hours
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const story = await prisma.story.create({
        data: {
          userId,
          type,
          url,
          content,
          expiresAt
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          },
          _count: {
            select: { views: true }
          }
        }
      });

      res.status(201).json(story);
    } catch (error) {
      console.error('Create story error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// View story
router.post('/:storyId/view',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.id;

      // Check if story exists and is not expired
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          expiresAt: { gt: new Date() }
        }
      });

      if (!story) {
        return res.status(404).json({ message: 'Story not found or expired' });
      }

      // Don't record view for own story
      if (story.userId === userId) {
        return res.json({ message: 'Cannot view own story' });
      }

      // Create or update view record
      await prisma.storyView.upsert({
        where: {
          storyId_userId: {
            storyId,
            userId
          }
        },
        update: {
          viewedAt: new Date()
        },
        create: {
          storyId,
          userId,
          viewedAt: new Date()
        }
      });

      res.json({ message: 'Story viewed' });
    } catch (error) {
      console.error('View story error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get story views (for story owner)
router.get('/:storyId/views',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.id;

      // Verify story belongs to user
      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          userId
        }
      });

      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }

      const views = await prisma.storyView.findMany({
        where: { storyId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
              isVerified: true
            }
          }
        },
        orderBy: { viewedAt: 'desc' }
      });

      res.json(views);
    } catch (error) {
      console.error('Get story views error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete story
router.delete('/:storyId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { storyId } = req.params;
      const userId = req.user!.id;

      const story = await prisma.story.findFirst({
        where: {
          id: storyId,
          userId
        }
      });

      if (!story) {
        return res.status(404).json({ message: 'Story not found' });
      }

      await prisma.story.delete({
        where: { id: storyId }
      });

      res.json({ message: 'Story deleted successfully' });
    } catch (error) {
      console.error('Delete story error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Cleanup expired stories (can be called by a cron job)
router.delete('/cleanup/expired',
  async (req, res) => {
    try {
      const result = await prisma.story.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      res.json({ 
        message: 'Expired stories cleaned up',
        deletedCount: result.count
      });
    } catch (error) {
      console.error('Cleanup expired stories error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;