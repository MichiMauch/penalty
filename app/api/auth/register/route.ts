import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail, createSession } from '@/lib/auth';
import { initDB, db } from '@/lib/db';
import { RegisterData } from '@/lib/types';
import { getAvatar } from '@/lib/avatars';

export async function POST(request: NextRequest) {
  try {
    await initDB();
    
    const body = await request.json();
    const { email, password, username, avatar, invitationToken, matchId } = body;
    
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
    
    // Validate avatar - accept any playerX format
    if (!avatar || typeof avatar !== 'string' || !avatar.match(/^player\d+$/)) {
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
    
    // Handle invitation token if present
    if (invitationToken && matchId && db) {
      try {
        // Verify invitation exists and update match with new user
        const matchResult = await db.execute({
          sql: 'SELECT * FROM matches WHERE id = ? AND invitation_token = ? AND status = "invitation_pending"',
          args: [matchId, invitationToken]
        });
        
        if (matchResult.rows.length > 0) {
          // Update match with the new user as player_b
          await db.execute({
            sql: `UPDATE matches SET 
                    player_b = ?, 
                    player_b_email = ?, 
                    player_b_username = ?, 
                    player_b_avatar = ?, 
                    status = "waiting" 
                  WHERE id = ? AND invitation_token = ?`,
            args: [user.id, email, username, avatar, matchId, invitationToken]
          });
        }
      } catch (inviteError) {
        console.error('Error handling invitation during registration:', inviteError);
        // Don't fail registration if invitation update fails
      }
    }
    
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