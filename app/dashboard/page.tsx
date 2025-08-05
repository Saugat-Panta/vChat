'use client';

import { motion } from 'framer-motion';
import { Plus, Camera, Video, Smile } from 'lucide-react';
import FeedPost from '@/components/social/FeedPost';
import StoryCarousel from '@/components/social/StoryCarousel';
import CreatePostModal from '@/components/social/CreatePostModal';
import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';

// Mock data for now
const mockPosts = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'John Doe',
      username: 'johndoe',
      avatar: null,
    },
    content: 'Just launched my new project! Excited to share it with everyone 🚀',
    images: [],
    videos: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    likes: 42,
    comments: 8,
    isLiked: false,
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Jane Smith',
      username: 'janesmith',
      avatar: null,
    },
    content: 'Beautiful sunset today! Nature never fails to amaze me ✨',
    images: [],
    videos: [],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    likes: 156,
    comments: 23,
    isLiked: true,
  },
];

export default function DashboardPage() {
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Home</h1>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreatePostOpen(true)}
              className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
            >
              <Plus size={20} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        {/* Stories */}
        <div className="mb-8">
          <StoryCarousel />
        </div>

        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card mb-6"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <button
              onClick={() => setIsCreatePostOpen(true)}
              className="flex-1 text-left py-3 px-4 bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"
            >
              What's on your mind, {user?.name?.split(' ')[0] || 'there'}?
            </button>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Camera className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Photo</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Video className="w-5 h-5 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">Video</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Smile className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Feeling</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Feed */}
        <div className="space-y-6">
          {mockPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FeedPost post={post} />
            </motion.div>
          ))}
        </div>

        {/* Load more */}
        <div className="text-center py-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700 transition-colors"
          >
            Load More Posts
          </motion.button>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isCreatePostOpen}
        onClose={() => setIsCreatePostOpen(false)}
      />
    </div>
  );
}