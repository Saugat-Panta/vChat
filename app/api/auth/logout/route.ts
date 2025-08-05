import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('token')?.value;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        // Update user offline status
        await prisma.user.update({
          where: { id: decoded.userId },
          data: { 
            isOnline: false,
            lastSeen: new Date(),
          },
        });
      }
    }

    // Clear the token cookie
    cookies().set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
    });

    return NextResponse.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}