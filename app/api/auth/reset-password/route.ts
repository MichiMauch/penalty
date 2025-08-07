import { NextRequest, NextResponse } from 'next/server';
import { resetUserPassword, cleanExpiredPasswordResetTokens } from '@/lib/auth';
import { initDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    
    const { token, password } = await request.json();
    
    // Validation
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token und neues Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      );
    }
    
    // Clean expired tokens before processing
    await cleanExpiredPasswordResetTokens();
    
    // Reset password
    const success = await resetUserPassword(token, password);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Token' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      message: 'Passwort wurde erfolgreich zurückgesetzt'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Zurücksetzen des Passworts' },
      { status: 500 }
    );
  }
}