import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { nanoid } from '@/lib/utils';
import { getUserSession } from '@/lib/auth';
import { sendChallengeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  // Check authentication
  const session = await getUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { invitedEmail, challengerEmail, challengerUsername, challengerAvatar } = await request.json();
    
    // Validation
    if (!invitedEmail || !challengerEmail || !challengerUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Ensure user cannot invite themselves
    if (invitedEmail.toLowerCase() === challengerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }
    
    // Check if invited user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [invitedEmail.toLowerCase()]
    });
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Generate unique IDs
    const matchId = nanoid();
    const playerAId = nanoid(); // Challenger (existing user)
    const invitationToken = nanoid(); // Unique token for invitation
    
    // Create match with invitation status
    await db.execute({
      sql: `INSERT INTO matches (
        id, 
        player_a, 
        player_a_email, 
        player_a_username, 
        player_a_avatar,
        invited_email,
        invitation_token,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        matchId,
        playerAId,
        challengerEmail,
        challengerUsername,
        challengerAvatar,
        invitedEmail.toLowerCase(),
        invitationToken,
        'invitation_pending'
      ]
    });
    
    // Email will be sent after the challenger submits their shots
    // This prevents the race condition where invited user registers before shots exist
    
    return NextResponse.json({ 
      success: true,
      matchId,
      invitationToken,
      message: 'Invitation prepared - now take your shots!'
    });
    
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}