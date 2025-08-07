import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { initDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    
    const { email } = await request.json();
    
    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail ist erforderlich' },
        { status: 400 }
      );
    }
    
    // Rate limiting check (simple in-memory store - in production use Redis)
    // For now, we'll rely on the 15-minute token expiry
    
    // Get user by email
    const user = await getUserByEmail(email);
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        message: 'Falls ein Account mit dieser E-Mail existiert, haben wir eine Passwort-Reset E-Mail gesendet.'
      });
    }
    
    // Create password reset token
    const resetToken = await createPasswordResetToken(user.id);
    
    // Send password reset email
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      resetToken,
      username: user.username
    });
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        { error: 'Fehler beim Senden der E-Mail' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: 'Falls ein Account mit dieser E-Mail existiert, haben wir eine Passwort-Reset E-Mail gesendet.'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Verarbeiten der Anfrage' },
      { status: 500 }
    );
  }
}