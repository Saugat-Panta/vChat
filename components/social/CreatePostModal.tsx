'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Image as ImageIcon,
  Video,
  Smile,
  MapPin,
  Users,
  Globe,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { cn, getInitials, generateAvatar } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onClose();
      setContent('');
      setSelectedFiles([]);
    }, 2000);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const privacyOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Anyone can see' },
    { value: 'friends', label: 'Friends', icon: Users, description: 'Friends only' },
    { value: 'private', label: 'Only me', icon: Lock, description: 'Only you can see' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg mx-4 bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Create Post</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-3 p-4 border-b border-gray-100">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name || 'User'}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                  generateAvatar(user?.name || user?.username || 'User')
                )}>
                  {getInitials(user?.name || user?.username || 'User')}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{user?.name || user?.username}</p>
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as any)}
                  className="text-sm text-gray-500 bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  {privacyOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'there'}?`}
                className="w-full h-32 resize-none border-none focus:outline-none text-gray-900 placeholder-gray-500"
                maxLength={500}
              />

              {/* Selected Files */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video size={24} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Character Count */}
              <div className="flex justify-end mt-2">
                <span className={cn(
                  'text-xs',
                  content.length > 450 ? 'text-red-500' : 'text-gray-400'
                )}>
                  {content.length}/500
                </span>
              </div>
            </div>

            {/* Media Options */}
            <div className="px-4 py-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <ImageIcon size={20} className="text-green-500" />
                    <span className="text-sm text-gray-700">Photo</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <Video size={20} className="text-blue-500" />
                    <span className="text-sm text-gray-700">Video</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Smile size={20} className="text-yellow-500" />
                    <span className="text-sm text-gray-700">Emoji</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <MapPin size={20} className="text-red-500" />
                    <span className="text-sm text-gray-700">Location</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSubmit}
                disabled={(!content.trim() && selectedFiles.length === 0) || isLoading}
                className="w-full btn-primary h-11 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="small" className="mr-2" />
                    Posting...
                  </div>
                ) : (
                  'Post'
                )}
              </motion.button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}