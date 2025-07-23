import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createSession } from '@/lib/auth';
import { initDB } from '@/lib/db';
import { RegisterData } from '@/lib/types';
import { getAvatar } from '@/lib/avatars';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    
    const body: RegisterData = await request.json();
    const { email, password, username, avatar } = body;
    
    // Validation
    if (!email || !password || !username || !avatar) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      );
    }
    
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }
    
    if (username.length < 2) {
      return NextResponse.json(
        { error: 'Benutzername muss mindestens 2 Zeichen lang sein' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }
    
    // Validate avatar
    const avatarObj = getAvatar(avatar);
    if (!avatarObj) {
      return NextResponse.json(
        { error: 'Ungültiger Avatar' },
        { status: 400 }
      );
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 409 }
      );
    }
    
    // Create user
    const user = await createUser(email, password, username, avatar);
    
    // Create session
    const sessionId = await createSession(user.id);
    
    // Set session cookie
    const response = NextResponse.json({
      user,
      message: 'Registrierung erfolgreich'
    });
    
    response.cookies.set('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 // 30 days
    });
    
    return response;
    
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Registrierung' },
      { status: 500 }
    );
  }
}