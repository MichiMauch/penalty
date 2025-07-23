import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (sessionId) {
      await deleteSession(sessionId);
    }
    
    const response = NextResponse.json({
      message: 'Erfolgreich abgemeldet'
    });
    
    // Clear session cookie
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0
    });
    
    return response;
    
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Abmeldung' },
      { status: 500 }
    );
  }
}