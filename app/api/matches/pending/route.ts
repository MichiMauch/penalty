import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('Pending matches API called');
  
  if (!db) {
    console.log('Database not configured');
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  console.log('Checking session...');
  const session = await getUserSession(request);
  console.log('Session result:', session ? { userId: session.user.id, email: session.user.email } : 'null');
  
  if (!session) {
    console.log('No session found - returning 401');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    console.log('Fetching pending matches for user:', session.user.email);
    
    // Find matches where the user is invited as player_b but hasn't joined yet
    const pendingMatches = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username,
          player_a_avatar,
          player_b_email,
          player_b,
          player_b_moves,
          status,
          created_at
        FROM matches 
        WHERE player_b_email = ? 
          AND (player_b IS NULL OR player_b_moves IS NULL)
          AND status = 'waiting'
        ORDER BY created_at DESC
      `,
      args: [session.user.email]
    });
    
    console.log('Found pending matches:', pendingMatches.rows.length);
    pendingMatches.rows.forEach((match: any) => {
      console.log('Match:', {
        id: match.id,
        player_b: match.player_b,
        player_b_email: match.player_b_email,
        player_b_moves: match.player_b_moves,
        status: match.status
      });
    });
    
    const challenges = pendingMatches.rows.map((match: any) => ({
      id: match.id,
      challengerEmail: match.player_a_email,
      challengerUsername: match.player_a_username,
      challengerAvatar: match.player_a_avatar,
      createdAt: match.created_at,
      type: match.player_b ? 'active' : 'invitation' as const
    }));
    
    return NextResponse.json({
      challenges
    });
  } catch (error) {
    console.error('Error fetching pending matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending matches' },
      { status: 500 }
    );
  }
}