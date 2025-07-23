import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('session')?.value;
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Nicht angemeldet' },
        { status: 401 }
      );
    }
    
    const session = await getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Ungültige Session' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      user: session.user
    });
    
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Authentifizierung' },
      { status: 500 }
    );
  }
}