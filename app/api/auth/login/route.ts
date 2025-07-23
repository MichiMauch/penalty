import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmailWithPassword, verifyPassword, createSession } from '@/lib/auth';
import { initDB } from '@/lib/db';
import { LoginCredentials } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    
    const body: LoginCredentials = await request.json();
    const { email, password } = body;
    
    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Get user with password
    const userWithPassword = await getUserByEmailWithPassword(email);
    if (!userWithPassword) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }
    
    // Verify password
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }
    
    // Create session
    const sessionId = await createSession(userWithPassword.user.id);
    
    // Set session cookie
    const response = NextResponse.json({
      user: userWithPassword.user,
      message: 'Anmeldung erfolgreich'
    });
    
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Anmeldung' },
      { status: 500 }
    );
  }
}