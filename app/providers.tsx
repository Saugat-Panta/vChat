'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/lib/context/AuthContext';
import { SocketProvider } from '@/lib/context/SocketContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </AuthProvider>
  );
}