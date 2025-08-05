'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  MessageCircle,
  Users,
  Bookmark,
  PlayCircle,
  Camera,
  Bell,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useSocket } from '@/lib/context/SocketContext';
import { cn, getInitials, generateAvatar } from '@/lib/utils';
import Image from 'next/image';

const sidebarItems = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageCircle, badge: true },
  { name: 'Discover', href: '/dashboard/discover', icon: Search },
  { name: 'Reels', href: '/dashboard/reels', icon: PlayCircle },
  { name: 'Stories', href: '/dashboard/stories', icon: Camera },
  { name: 'Friends', href: '/dashboard/friends', icon: Users },
  { name: 'Saved', href: '/dashboard/saved', icon: Bookmark },
  { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, badge: true },
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { isConnected, onlineUsers } = useSocket();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={cn(
          'fixed lg:relative inset-y-0 left-0 z-50 bg-white border-r border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-80'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">vC</span>
                </div>
                <h1 className="text-xl font-bold text-gradient">vChat</h1>
              </motion.div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isCollapsed ? <Menu size={20} /> : <X size={20} />}
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold',
                    generateAvatar(user.name || user.username)
                  )}>
                    {getInitials(user.name || user.username)}
                  </div>
                )}
                <div className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                  isConnected ? 'bg-green-500' : 'bg-gray-400'
                )} />
              </div>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {user.name || user.username}
                  </p>
                  <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Create Post Button */}
          <div className="p-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'w-full btn-primary flex items-center justify-center space-x-2',
                isCollapsed ? 'p-3' : 'px-4 py-3'
              )}
            >
              <Plus size={20} />
              {!isCollapsed && <span>Create Post</span>}
            </motion.button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.name} href={item.href}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 relative',
                      isActive
                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon size={20} />
                    {!isCollapsed && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                    {item.badge && !isCollapsed && (
                      <div className="w-2 h-2 bg-red-500 rounded-full ml-auto" />
                    )}
                    {item.badge && isCollapsed && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          {/* Online Users */}
          {!isCollapsed && onlineUsers.length > 0 && (
            <div className="px-4 py-2 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Online ({onlineUsers.length})
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {onlineUsers.slice(0, 5).map((userId) => (
                  <div key={userId} className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    </div>
                    <span className="text-xs text-gray-600">User {userId.slice(-4)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-1">
            <Link href="/dashboard/settings">
              <motion.div
                whileHover={{ x: 4 }}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors',
                  pathname === '/dashboard/settings' && 'bg-primary-50 text-primary-600'
                )}
              >
                <Settings size={18} />
                {!isCollapsed && <span className="text-sm">Settings</span>}
              </motion.div>
            </Link>
            <motion.button
              whileHover={{ x: 4 }}
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              {!isCollapsed && <span className="text-sm">Logout</span>}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}