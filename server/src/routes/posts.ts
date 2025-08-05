import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import { authenticateToken, AuthenticatedRequest, optionalAuth } from '../middleware/auth';

const router = express.Router();

// Get posts feed
router.get('/',
  optionalAuth,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('userId').optional().isString(),
    query('type').optional().isIn(['REGULAR', 'REEL'])
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
      const { userId, type } = req.query;

      const whereClause: any = {
        isPublic: true
      };

      if (userId) {
        whereClause.userId = userId;
      }

      if (type) {
        whereClause.type = type;
      }

      const posts = await prisma.post.findMany({
        where: whereClause,
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
          attachments: true,
          likes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true }
          } : false,
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.post.count({ where: whereClause });

      const postsWithLikeStatus = posts.map(post => ({
        ...post,
        isLiked: req.user ? post.likes.length > 0 : false,
        likes: undefined // Remove the likes array, keep only the count
      }));

      res.json({
        posts: postsWithLikeStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get posts error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Create post
router.post('/',
  authenticateToken,
  [
    body('content').optional().isString().isLength({ max: 2000 }),
    body('type').optional().isIn(['REGULAR', 'REEL']),
    body('attachments').optional().isArray(),
    body('isPublic').optional().isBoolean()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { content, type = 'REGULAR', attachments = [], isPublic = true } = req.body;
      const userId = req.user!.id;

      if (!content && attachments.length === 0) {
        return res.status(400).json({ message: 'Post must have content or attachments' });
      }

      const post = await prisma.post.create({
        data: {
          userId,
          content,
          type,
          isPublic,
          attachments: attachments.length > 0 ? {
            create: attachments.map((att: any) => ({
              type: att.type,
              url: att.url,
              filename: att.filename,
              size: att.size,
              duration: att.duration
            }))
          } : undefined
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
          attachments: true,
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });

      res.status(201).json(post);
    } catch (error) {
      console.error('Create post error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get specific post
router.get('/:postId',
  optionalAuth,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { postId } = req.params;

      const post = await prisma.post.findUnique({
        where: { id: postId },
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
          attachments: true,
          likes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true }
          } : false,
          _count: {
            select: {
              likes: true,
              comments: true
            }
          }
        }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      if (!post.isPublic && (!req.user || post.userId !== req.user.id)) {
        return res.status(403).json({ message: 'Post is private' });
      }

      const postWithLikeStatus = {
        ...post,
        isLiked: req.user ? post.likes.length > 0 : false,
        likes: undefined
      };

      res.json(postWithLikeStatus);
    } catch (error) {
      console.error('Get post error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Like/unlike post
router.post('/:postId/like',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check if already liked
      const existingLike = await prisma.like.findUnique({
        where: {
          userId_postId: {
            userId,
            postId
          }
        }
      });

      if (existingLike) {
        // Unlike
        await prisma.like.delete({
          where: { id: existingLike.id }
        });
        res.json({ message: 'Post unliked', isLiked: false });
      } else {
        // Like
        await prisma.like.create({
          data: {
            userId,
            postId
          }
        });
        res.json({ message: 'Post liked', isLiked: true });
      }
    } catch (error) {
      console.error('Like post error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Get post comments
router.get('/:postId/comments',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  async (req, res) => {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const comments = await prisma.comment.findMany({
        where: {
          postId,
          parentId: null // Only top-level comments
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
          replies: {
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
                select: { likes: true }
              }
            },
            orderBy: { createdAt: 'asc' },
            take: 3 // Limit replies shown initially
          },
          _count: {
            select: {
              likes: true,
              replies: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      const total = await prisma.comment.count({
        where: { postId, parentId: null }
      });

      res.json({
        comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get comments error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Add comment to post
router.post('/:postId/comments',
  authenticateToken,
  [
    body('content').isString().isLength({ min: 1, max: 1000 }),
    body('parentId').optional().isString()
  ],
  async (req: AuthenticatedRequest, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { postId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user!.id;

      // Check if post exists
      const post = await prisma.post.findUnique({
        where: { id: postId }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // If replying to a comment, check if parent comment exists
      if (parentId) {
        const parentComment = await prisma.comment.findUnique({
          where: { id: parentId }
        });

        if (!parentComment || parentComment.postId !== postId) {
          return res.status(404).json({ message: 'Parent comment not found' });
        }
      }

      const comment = await prisma.comment.create({
        data: {
          postId,
          userId,
          content,
          parentId
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
            select: {
              likes: true,
              replies: true
            }
          }
        }
      });

      res.status(201).json(comment);
    } catch (error) {
      console.error('Add comment error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

// Delete post
router.delete('/:postId',
  authenticateToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const { postId } = req.params;
      const userId = req.user!.id;

      const post = await prisma.post.findFirst({
        where: {
          id: postId,
          userId
        }
      });

      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      await prisma.post.delete({
        where: { id: postId }
      });

      res.json({ message: 'Post deleted successfully' });
    } catch (error) {
      console.error('Delete post error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

export default router;