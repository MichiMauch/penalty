import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get active players from last 30 days with their current points
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await db.execute({
      sql: `
        SELECT 
          u.id,
          u.username,
          u.avatar,
          u.created_at,
          COALESCE(s.total_points, 0) as total_points,
          COALESCE(s.games_played, 0) as total_games,
          COALESCE(s.games_won, 0) as wins,
          CASE 
            WHEN s.games_played > 0 
            THEN ROUND(CAST(s.games_won AS FLOAT) / CAST(s.games_played AS FLOAT) * 100, 1)
            ELSE 0 
          END as win_rate,
          s.last_updated as last_game
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE (s.last_updated >= ? AND s.games_played > 0) 
           OR (s.last_updated IS NULL AND u.created_at >= ?)
        ORDER BY s.total_points DESC, s.last_updated DESC NULLS LAST
        LIMIT 20
      `,
      args: [thirtyDaysAgo.toISOString(), thirtyDaysAgo.toISOString()]
    });

    const players = result.rows.map(row => ({
      id: row.id as string,
      username: row.username as string,
      avatar: row.avatar as string,
      stats: {
        totalPoints: Number(row.total_points) || 0,
        totalGames: Number(row.total_games) || 0,
        wins: Number(row.wins) || 0,
        winRate: Number(row.win_rate) || 0,
        lastGame: row.last_game as string | null,
      },
      joinedAt: row.created_at as string
    }));

    return NextResponse.json({ players });
  } catch (error) {
    console.error('Error fetching active players:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active players' },
      { status: 500 }
    );
  }
}