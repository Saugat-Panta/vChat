import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'vChat - Connect, Share, Discover',
  description: 'A modern social media and messaging platform with all the features you love.',
  keywords: ['social media', 'messaging', 'chat', 'video calls', 'stories', 'reels'],
  authors: [{ name: 'vChat Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              className: 'bg-white border border-gray-200 text-gray-900',
              duration: 4000,
            }}
          />
        </Providers>
      </body>
    </html>
  );
}