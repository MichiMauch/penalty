import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  const session = await getUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get ALL matches where the user is involved (either player_a or player_b)
    const allMatches = await db.execute({
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
          player_a_moves,
          player_b_moves,
          status,
          created_at,
          winner
        FROM matches 
        WHERE player_a_email = ? OR player_b_email = ?
        ORDER BY created_at DESC
        LIMIT 20
      `,
      args: [session.user.email, session.user.email]
    });

    console.log(`=== DEBUG: Found ${allMatches.rows.length} total matches for ${session.user.email} ===`);
    
    return NextResponse.json({
      matches: allMatches.rows,
      userEmail: session.user.email
    });
  } catch (error) {
    console.error('Error fetching debug matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}