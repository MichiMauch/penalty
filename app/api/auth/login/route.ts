import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmailWithPassword, verifyPassword, createSession } from '@/lib/auth';
import { initDB } from '@/lib/db';
import { LoginCredentials } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Login attempt started');
    console.log('Environment check:', {
      hasDbUrl: !!process.env.TURSO_DATABASE_URL,
      hasAuthToken: !!process.env.TURSO_AUTH_TOKEN,
      nodeEnv: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL
    });
    
    await initDB();
    console.log('✅ Database initialized');
    
    const body: LoginCredentials = await request.json();
    const { email, password } = body;
    
    console.log('📝 Login data:', { email: email, hasPassword: !!password });
    
    // Validation
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Get user with password
    console.log('🔍 Looking up user by email...');
    const userWithPassword = await getUserByEmailWithPassword(email);
    if (!userWithPassword) {
      console.log('❌ User not found for email:', email);
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }
    console.log('✅ User found:', userWithPassword.user.username);
    
    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash);
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }
    console.log('✅ Password verified');
    
    // Create session
    console.log('🎫 Creating session...');
    const sessionId = await createSession(userWithPassword.user.id);
    console.log('✅ Session created:', sessionId);
    
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
    
    console.log('🎉 Login successful for:', userWithPassword.user.username);
    return response;
    
  } catch (error) {
    console.error('💥 Login error:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { error: 'Fehler bei der Anmeldung', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}