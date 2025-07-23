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
    
    // Find matches where the user is invited as player_b but hasn't joined yet OR submitted moves
    const pendingAsPlayerB = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username, 
          player_a_avatar,
          player_b_email,
          player_b,
          player_b_moves,
          player_a_moves,
          status,
          created_at,
          'invited' as match_type
        FROM matches 
        WHERE player_b_email = ? 
          AND (player_b IS NULL OR player_b_moves IS NULL)
          AND status = 'waiting'
        ORDER BY created_at DESC
      `,
      args: [session.user.email]
    });
    
    // Find matches where the user is player_a and player_b has joined but hasn't submitted moves
    const pendingAsPlayerA = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username,
          player_a_avatar,
          player_b_email,
          player_b_username,
          player_b_avatar,
          player_b,
          player_b_moves,
          player_a_moves,
          status,
          created_at,
          'challenger' as match_type
        FROM matches 
        WHERE player_a_email = ? 
          AND player_b IS NOT NULL
          AND player_b_moves IS NULL
          AND player_a_moves IS NOT NULL
          AND status = 'waiting'
        ORDER BY created_at DESC
      `,
      args: [session.user.email]
    });

    // Find recently finished matches where the user was player_a (challenger) - so they can see the result
    const recentlyFinished = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username,
          player_a_avatar,
          player_b_email,
          player_b_username,
          player_b_avatar,
          player_b,
          player_b_moves,
          player_a_moves,
          status,
          created_at,
          winner,
          'finished_recent' as match_type
        FROM matches 
        WHERE player_a_email = ? 
          AND player_b IS NOT NULL
          AND player_b_moves IS NOT NULL
          AND player_a_moves IS NOT NULL
          AND status = 'finished'
          AND datetime(created_at) > datetime('now', '-24 hours')
        ORDER BY created_at DESC
        LIMIT 5
      `,
      args: [session.user.email]
    });
    
    // Find matches where the user is player_a and no one has joined yet (can be cancelled)
    const cancelableMatches = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username,
          player_a_avatar,
          player_b_email,
          player_b,
          player_b_moves,
          player_a_moves,
          status,
          created_at,
          'cancelable' as match_type
        FROM matches 
        WHERE player_a_email = ? 
          AND (player_b IS NULL OR (player_b IS NOT NULL AND player_b_moves IS NULL))
          AND player_a_moves IS NOT NULL
          AND status = 'waiting'
        ORDER BY created_at DESC
      `,
      args: [session.user.email]
    });
    
    console.log('Found pending matches as player B:', pendingAsPlayerB.rows.length);
    console.log('Found pending matches as player A:', pendingAsPlayerA.rows.length);
    console.log('Found recently finished matches:', recentlyFinished.rows.length);
    console.log('Found cancelable matches:', cancelableMatches.rows.length);
    
    const challengesAsPlayerB = pendingAsPlayerB.rows.map((match: any) => ({
      id: match.id,
      challengerEmail: match.player_a_email,
      challengerUsername: match.player_a_username,
      challengerAvatar: match.player_a_avatar,
      createdAt: match.created_at,
      type: match.player_b ? 'active' : 'invitation' as const,
      role: 'defender' as const
    }));
    
    const challengesAsPlayerA = pendingAsPlayerA.rows.map((match: any) => ({
      id: match.id,
      challengerEmail: match.player_b_email,
      challengerUsername: match.player_b_username,
      challengerAvatar: match.player_b_avatar,
      createdAt: match.created_at,
      type: 'waiting_for_opponent' as const,
      role: 'challenger' as const
    }));
    
    const finishedRecentMatches = recentlyFinished.rows.map((match: any) => ({
      id: match.id,
      challengerEmail: match.player_b_email,
      challengerUsername: match.player_b_username,
      challengerAvatar: match.player_b_avatar,
      createdAt: match.created_at,
      type: 'finished_recent' as const,
      role: 'challenger' as const,
      winner: match.winner
    }));
    
    const cancelableChallenges = cancelableMatches.rows.map((match: any) => ({
      id: match.id,
      challengerEmail: match.player_b_email || 'Unbekannt',
      challengerUsername: match.player_b_username || (match.player_b_email || 'Wartend'),
      challengerAvatar: match.player_b_avatar || 'player1',
      createdAt: match.created_at,
      type: 'cancelable' as const,
      role: 'challenger' as const
    }));
    
    return NextResponse.json({
      challenges: [...challengesAsPlayerB, ...challengesAsPlayerA, ...finishedRecentMatches, ...cancelableChallenges]
    });
  } catch (error) {
    console.error('Error fetching pending matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pending matches' },
      { status: 500 }
    );
  }
}