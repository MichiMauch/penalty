import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  const { searchParams } = new URL(request.url);
  const playerA = searchParams.get('playerA');
  const playerB = searchParams.get('playerB');
  
  if (!playerA || !playerB) {
    return NextResponse.json({ error: 'Both player emails required' }, { status: 400 });
  }
  
  try {
    // Check for any pending matches between these players (in either direction)
    const result = await db.execute({
      sql: `
        SELECT id, player_a_email, player_b_email, status, created_at
        FROM matches 
        WHERE (
          (player_a_email = ? AND player_b_email = ?) OR 
          (player_a_email = ? AND player_b_email = ?)
        ) 
        AND status != 'finished'
        AND (
          player_a_moves IS NULL OR 
          player_b_moves IS NULL OR
          player_b IS NULL
        )
        ORDER BY created_at DESC
        LIMIT 1
      `,
      args: [playerA, playerB, playerB, playerA]
    });
    
    const hasPendingChallenge = result.rows.length > 0;
    const pendingMatch = hasPendingChallenge ? result.rows[0] : null;
    
    return NextResponse.json({ 
      hasPendingChallenge,
      pendingMatch: pendingMatch ? {
        id: pendingMatch.id,
        challenger: pendingMatch.player_a_email,
        challenged: pendingMatch.player_b_email,
        status: pendingMatch.status,
        createdAt: pendingMatch.created_at
      } : null
    });
  } catch (error) {
    console.error('Error checking for existing challenges:', error);
    return NextResponse.json({ error: 'Failed to check existing challenges' }, { status: 500 });
  }
}