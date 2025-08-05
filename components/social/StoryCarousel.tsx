'use client';

import { motion } from 'framer-motion';
import { Plus, User } from 'lucide-react';
import { cn, getInitials, generateAvatar } from '@/lib/utils';
import Image from 'next/image';

interface Story {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  thumbnail: string;
  hasNew: boolean;
}

// Mock stories data
const mockStories: Story[] = [
  {
    id: '1',
    author: {
      id: '1',
      name: 'Alex Johnson',
      username: 'alexj',
      avatar: null,
    },
    thumbnail: '',
    hasNew: true,
  },
  {
    id: '2',
    author: {
      id: '2',
      name: 'Sarah Wilson',
      username: 'sarahw',
      avatar: null,
    },
    thumbnail: '',
    hasNew: true,
  },
  {
    id: '3',
    author: {
      id: '3',
      name: 'Mike Brown',
      username: 'mikeb',
      avatar: null,
    },
    thumbnail: '',
    hasNew: false,
  },
];

export default function StoryCarousel() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Stories</h2>
        <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
          See all
        </button>
      </div>

      <div className="flex space-x-4 overflow-x-auto scrollbar-hide pb-2">
        {/* Add Story */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex-shrink-0 cursor-pointer"
        >
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
              <Plus size={24} className="text-gray-500" />
            </div>
          </div>
          <p className="text-xs text-center mt-2 text-gray-600 max-w-[64px] truncate">
            Your story
          </p>
        </motion.div>

        {/* Stories */}
        {mockStories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0 cursor-pointer"
          >
            <div className="relative">
              <div className={cn(
                'w-16 h-16 rounded-full p-0.5',
                story.hasNew
                  ? 'bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500'
                  : 'bg-gray-300'
              )}>
                <div className="w-full h-full bg-white rounded-full p-0.5">
                  {story.author.avatar ? (
                    <Image
                      src={story.author.avatar}
                      alt={story.author.name}
                      width={56}
                      height={56}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className={cn(
                      'w-full h-full rounded-full flex items-center justify-center text-white font-semibold text-sm',
                      generateAvatar(story.author.name)
                    )}>
                      {getInitials(story.author.name)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-center mt-2 text-gray-600 max-w-[64px] truncate">
              {story.author.name.split(' ')[0]}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}