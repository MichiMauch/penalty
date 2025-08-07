import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  try {
    // Get all non-finished matches with full details
    const openMatches = await db.execute({
      sql: `
        SELECT 
          id,
          player_a,
          player_a_email,
          player_a_username,
          player_a_avatar,
          player_a_moves,
          player_b,
          player_b_email,
          player_b_username,
          player_b_avatar,
          player_b_moves,
          status,
          created_at,
          winner
        FROM matches 
        WHERE status != 'finished'
        ORDER BY created_at DESC
        LIMIT 100
      `
    });

    // Get statistics
    const stats = await db.execute({
      sql: `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'waiting' THEN 1 END) as waiting,
          COUNT(CASE WHEN status = 'ready' THEN 1 END) as ready,
          MIN(created_at) as oldest_match
        FROM matches 
        WHERE status != 'finished'
      `
    });

    return NextResponse.json({
      matches: openMatches.rows,
      stats: stats.rows[0],
      count: openMatches.rows.length
    });
  } catch (error) {
    console.error('Error fetching admin matches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    );
  }
}