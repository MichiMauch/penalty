import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateLevel, getNextLevel, calculateProgress, getPointsToNextLevel } from '@/lib/levels';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { userId } = await params;

    // Get user stats
    const statsResult = await db.execute({
      sql: `
        SELECT 
          u.id,
          u.username,
          u.avatar,
          u.email,
          COALESCE(s.total_points, 0) as total_points,
          COALESCE(s.games_played, 0) as games_played,
          COALESCE(s.games_won, 0) as games_won,
          COALESCE(s.games_lost, 0) as games_lost,
          COALESCE(s.games_drawn, 0) as games_drawn,
          COALESCE(s.goals_scored, 0) as goals_scored,
          COALESCE(s.saves_made, 0) as saves_made,
          COALESCE(s.current_streak, 0) as current_streak,
          COALESCE(s.best_streak, 0) as best_streak,
          COALESCE(s.perfect_games, 0) as perfect_games
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE u.id = ?
      `,
      args: [userId]
    });

    if (statsResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userStats = statsResult.rows[0];
    const totalPoints = Number(userStats.total_points);

    // Calculate level and progress
    const currentLevel = calculateLevel(totalPoints);
    const nextLevel = getNextLevel(currentLevel);
    const progress = calculateProgress(totalPoints, currentLevel);
    const pointsToNext = getPointsToNextLevel(totalPoints, currentLevel);

    // Calculate rank - only if user has played games
    let rank = null;
    if (Number(userStats.games_played) > 0) {
      const rankResult = await db.execute({
        sql: `
          SELECT COUNT(*) + 1 as rank
          FROM user_stats
          WHERE total_points > (
            SELECT COALESCE(total_points, 0) FROM user_stats WHERE user_id = ?
          )
        `,
        args: [userId]
      });
      
      rank = rankResult.rows[0]?.rank || 1;
    }

    // Get points for previous and next rank
    let pointsToPrevRank = null;
    let pointsToNextRank = null;

    if (rank && rank > 1) {
      const prevRankResult = await db.execute({
        sql: `
          SELECT total_points
          FROM user_stats
          WHERE total_points > ?
          ORDER BY total_points ASC
          LIMIT 1
        `,
        args: [totalPoints]
      });
      
      if (prevRankResult.rows.length > 0) {
        pointsToPrevRank = Number(prevRankResult.rows[0].total_points) - totalPoints;
      }
    }

    const nextRankResult = await db.execute({
      sql: `
        SELECT total_points
        FROM user_stats
        WHERE total_points < ?
        ORDER BY total_points DESC
        LIMIT 1
      `,
      args: [totalPoints]
    });
    
    if (nextRankResult.rows.length > 0) {
      pointsToNextRank = totalPoints - Number(nextRankResult.rows[0].total_points);
    }

    const response = {
      user: {
        id: userStats.id as string,
        username: userStats.username as string,
        avatar: userStats.avatar as string,
        email: userStats.email as string
      },
      stats: {
        totalPoints,
        gamesPlayed: Number(userStats.games_played),
        gamesWon: Number(userStats.games_won),
        gamesLost: Number(userStats.games_lost),
        gamesDrawn: Number(userStats.games_drawn),
        winRate: Number(userStats.games_played) > 0 
          ? Math.round((Number(userStats.games_won) / Number(userStats.games_played)) * 100 * 10) / 10
          : 0,
        goalsScored: Number(userStats.goals_scored),
        savesMade: Number(userStats.saves_made),
        currentStreak: Number(userStats.current_streak),
        bestStreak: Number(userStats.best_streak),
        perfectGames: Number(userStats.perfect_games),
        rank: rank ? Number(rank) : null,
        pointsToPrevRank,
        pointsToNextRank
      },
      level: {
        current: {
          id: currentLevel.id,
          name: currentLevel.name,
          icon: currentLevel.icon,
          minPoints: currentLevel.minPoints,
          maxPoints: currentLevel.maxPoints
        },
        next: nextLevel ? {
          id: nextLevel.id,
          name: nextLevel.name,
          icon: nextLevel.icon,
          minPoints: nextLevel.minPoints,
          maxPoints: nextLevel.maxPoints
        } : null,
        progress,
        pointsToNext
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}