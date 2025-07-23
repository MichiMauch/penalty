import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateLevel } from '@/lib/levels';

export async function GET() {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get top 10 players by total points
    const result = await db.execute({
      sql: `
        SELECT 
          u.id,
          u.username,
          u.avatar,
          u.email,
          s.total_points,
          s.games_played,
          s.games_won,
          s.goals_scored,
          s.saves_made,
          s.best_streak,
          s.perfect_games,
          CASE 
            WHEN s.games_played > 0 
            THEN ROUND(CAST(s.games_won AS FLOAT) / CAST(s.games_played AS FLOAT) * 100, 1)
            ELSE 0 
          END as win_rate
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE s.games_played > 0
        ORDER BY s.total_points DESC
        LIMIT 10
      `
    });

    const leaderboard = result.rows.map((row: any, index: number) => {
      const totalPoints = Number(row.total_points) || 0;
      const level = calculateLevel(totalPoints);
      
      return {
        rank: index + 1,
        id: row.id as string,
        username: row.username as string,
        avatar: row.avatar as string,
        stats: {
          totalPoints,
          gamesPlayed: Number(row.games_played) || 0,
          gamesWon: Number(row.games_won) || 0,
          winRate: Number(row.win_rate) || 0,
          goalsScored: Number(row.goals_scored) || 0,
          savesMade: Number(row.saves_made) || 0,
          bestStreak: Number(row.best_streak) || 0,
          perfectGames: Number(row.perfect_games) || 0
        },
        level: {
          id: level.id,
          name: level.name,
          icon: level.icon
        }
      };
    });

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}