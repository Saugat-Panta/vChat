'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import AuthTabs from '@/components/auth/AuthTabs';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-purple-50">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (user) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-pink-50">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          {/* Logo and branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-2xl font-bold text-white">vC</span>
            </div>
            <h1 className="text-4xl font-bold text-gradient mb-2">vChat</h1>
            <p className="text-gray-600 text-lg">
              Connect, Share, Discover
            </p>
            <p className="text-gray-500 text-sm mt-1">
              The ultimate social platform with messaging, stories, reels, and more
            </p>
          </div>

          {/* Authentication tabs */}
          <div className="glass-card rounded-2xl p-6 shadow-xl">
            <AuthTabs />
          </div>

          {/* Features highlight */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 text-sm mb-4">What makes vChat special?</p>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="text-center">
                <div className="w-8 h-8 bg-primary-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  💬
                </div>
                <span className="text-gray-600">Real-time Chat</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-purple-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  📱
                </div>
                <span className="text-gray-600">Stories & Reels</span>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-pink-100 rounded-lg mx-auto mb-2 flex items-center justify-center">
                  📞
                </div>
                <span className="text-gray-600">Video Calls</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add CSS for blob animation
const styles = `
@keyframes blob {
  0% {
    transform: translate(0px, 0px) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
  100% {
    transform: translate(0px, 0px) scale(1);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}
`;

if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}