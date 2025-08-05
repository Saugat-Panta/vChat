'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share,
  Bookmark,
  MoreHorizontal,
  User,
} from 'lucide-react';
import { formatTime, getInitials, generateAvatar, cn } from '@/lib/utils';
import Image from 'next/image';

interface Author {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  images: string[];
  videos: string[];
  createdAt: Date;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface FeedPostProps {
  post: Post;
}

export default function FeedPost({ post }: FeedPostProps) {
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {post.author.avatar ? (
            <Image
              src={post.author.avatar}
              alt={post.author.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
              generateAvatar(post.author.name)
            )}>
              {getInitials(post.author.name)}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{post.author.name}</p>
            <p className="text-sm text-gray-500">
              @{post.author.username} • {formatTime(post.createdAt)}
            </p>
          </div>
        </div>
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreHorizontal size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <p className="text-gray-900 leading-relaxed">{post.content}</p>
      </div>

      {/* Post Media */}
      {post.images.length > 0 && (
        <div className="mb-4 rounded-xl overflow-hidden">
          {post.images.length === 1 ? (
            <Image
              src={post.images[0]}
              alt="Post image"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
            />
          ) : (
            <div className="grid grid-cols-2 gap-1">
              {post.images.slice(0, 4).map((image, index) => (
                <div key={index} className="relative">
                  <Image
                    src={image}
                    alt={`Post image ${index + 1}`}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover"
                  />
                  {index === 3 && post.images.length > 4 && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <span className="text-white font-semibold text-lg">
                        +{post.images.length - 4}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-6">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLike}
            className="flex items-center space-x-2 group"
          >
            <Heart
              size={20}
              className={cn(
                'transition-colors',
                isLiked
                  ? 'text-red-500 fill-red-500'
                  : 'text-gray-500 group-hover:text-red-500'
              )}
            />
            <span className={cn(
              'text-sm font-medium',
              isLiked ? 'text-red-500' : 'text-gray-500'
            )}>
              {likeCount}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center space-x-2 group"
          >
            <MessageCircle
              size={20}
              className="text-gray-500 group-hover:text-blue-500 transition-colors"
            />
            <span className="text-sm font-medium text-gray-500">
              {post.comments}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex items-center space-x-2 group"
          >
            <Share
              size={20}
              className="text-gray-500 group-hover:text-green-500 transition-colors"
            />
          </motion.button>
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleBookmark}
          className="group"
        >
          <Bookmark
            size={20}
            className={cn(
              'transition-colors',
              isBookmarked
                ? 'text-blue-500 fill-blue-500'
                : 'text-gray-500 group-hover:text-blue-500'
            )}
          />
        </motion.button>
      </div>

      {/* Quick Comment */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-600" />
          </div>
          <input
            type="text"
            placeholder="Write a comment..."
            className="flex-1 py-2 px-3 bg-gray-50 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
        </div>
      </div>
    </motion.div>
  );
}