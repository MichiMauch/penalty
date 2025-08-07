import { db } from './db';
import { GameResult } from './types';
import { calculateLevel } from './levels';

interface PointsCalculation {
  basePoints: number;
  bonusPoints: number;
  streakMultiplier: number;
  totalPoints: number;
}

export async function calculateAndUpdateStats(
  matchId: string,
  playerAId: string,
  playerBId: string,
  result: GameResult
) {
  if (!db) return;

  try {
    // Calculate points for both players
    const playerAPoints = calculatePoints(result, 'player_a');
    const playerBPoints = calculatePoints(result, 'player_b');

    // Get current stats for both players
    const [statsA, statsB] = await Promise.all([
      getOrCreateUserStats(playerAId),
      getOrCreateUserStats(playerBId)
    ]);

    // Calculate level-up bonuses
    let playerALevelBonus = 0;
    let playerBLevelBonus = 0;

    // Check if Player A levels up
    const oldLevelA = calculateLevel(statsA.total_points);
    const newLevelA = calculateLevel(statsA.total_points + playerAPoints.totalPoints);
    if (newLevelA.id > oldLevelA.id) {
      playerALevelBonus = 10;
    }

    // Check if Player B levels up
    const oldLevelB = calculateLevel(statsB.total_points);
    const newLevelB = calculateLevel(statsB.total_points + playerBPoints.totalPoints);
    if (newLevelB.id > oldLevelB.id) {
      playerBLevelBonus = 10;
    }

    // Update stats for Player A
    const newStatsA = {
      total_points: statsA.total_points + playerAPoints.totalPoints + playerALevelBonus,
      current_level: newLevelA.id,
      goals_scored: statsA.goals_scored + result.rounds.filter(r => r.shooter === 'player_a' && r.goal).length,
      saves_made: statsA.saves_made + result.rounds.filter(r => r.shooter === 'player_b' && !r.goal).length,
      games_played: statsA.games_played + 1,
      games_won: statsA.games_won + (result.winner === 'player_a' ? 1 : 0),
      games_lost: statsA.games_lost + (result.winner === 'player_b' ? 1 : 0),
      games_drawn: statsA.games_drawn,
      current_streak: result.winner === 'player_a' ? statsA.current_streak + 1 : 0,
      best_streak: Math.max(
        statsA.best_streak,
        result.winner === 'player_a' ? statsA.current_streak + 1 : statsA.current_streak
      ),
      perfect_games: statsA.perfect_games + (
        result.rounds.filter(r => r.shooter === 'player_a' && r.goal).length === 5 ? 1 : 0
      )
    };

    // Update stats for Player B
    const newStatsB = {
      total_points: statsB.total_points + playerBPoints.totalPoints + playerBLevelBonus,
      current_level: newLevelB.id,
      goals_scored: statsB.goals_scored + result.rounds.filter(r => r.shooter === 'player_b' && r.goal).length,
      saves_made: statsB.saves_made + result.rounds.filter(r => r.shooter === 'player_a' && !r.goal).length,
      games_played: statsB.games_played + 1,
      games_won: statsB.games_won + (result.winner === 'player_b' ? 1 : 0),
      games_lost: statsB.games_lost + (result.winner === 'player_a' ? 1 : 0),
      games_drawn: statsB.games_drawn,
      current_streak: result.winner === 'player_b' ? statsB.current_streak + 1 : 0,
      best_streak: Math.max(
        statsB.best_streak,
        result.winner === 'player_b' ? statsB.current_streak + 1 : statsB.current_streak
      ),
      perfect_games: statsB.perfect_games + (
        result.rounds.filter(r => r.shooter === 'player_b' && r.goal).length === 5 ? 1 : 0
      )
    };

    // Update database
    await Promise.all([
      updateUserStats(playerAId, newStatsA),
      updateUserStats(playerBId, newStatsB)
    ]);

  } catch (error) {
    console.error('Error updating stats:', error);
  }
}

function calculatePoints(result: GameResult, player: 'player_a' | 'player_b'): PointsCalculation {
  let basePoints = 0;
  let bonusPoints = 0;

  // Simple point system: 3 points for win, 0 for loss
  if (result.winner === player) {
    basePoints = 3;
  } else {
    basePoints = 0;
  }

  // Perfect game bonus: +5 points for 5/5 performance
  const goalsScored = result.rounds.filter(r => r.shooter === player && r.goal).length;
  const savesMade = result.rounds.filter(r => r.shooter !== player && !r.goal).length;
  
  if (goalsScored === 5 || savesMade === 5) {
    bonusPoints += 5;
  }

  // No streak multiplier in new system
  const streakMultiplier = 1;

  return {
    basePoints,
    bonusPoints,
    streakMultiplier,
    totalPoints: basePoints + bonusPoints
  };
}

async function getOrCreateUserStats(userId: string) {
  if (!db) throw new Error('Database not initialized');

  const result = await db.execute({
    sql: 'SELECT * FROM user_stats WHERE user_id = ?',
    args: [userId]
  });

  if (result.rows.length === 0) {
    // Create initial stats
    await db.execute({
      sql: `INSERT INTO user_stats (
        user_id, total_points, goals_scored, saves_made, 
        games_played, games_won, games_lost, games_drawn,
        current_streak, best_streak, perfect_games, current_level
      ) VALUES (?, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1)`,
      args: [userId]
    });

    return {
      user_id: userId,
      total_points: 0,
      goals_scored: 0,
      saves_made: 0,
      games_played: 0,
      games_won: 0,
      games_lost: 0,
      games_drawn: 0,
      current_streak: 0,
      best_streak: 0,
      perfect_games: 0,
      current_level: 1
    };
  }

  return result.rows[0] as any;
}

async function updateUserStats(userId: string, stats: any) {
  if (!db) return;

  await db.execute({
    sql: `UPDATE user_stats SET 
      total_points = ?,
      goals_scored = ?,
      saves_made = ?,
      games_played = ?,
      games_won = ?,
      games_lost = ?,
      games_drawn = ?,
      current_streak = ?,
      best_streak = ?,
      perfect_games = ?,
      current_level = ?,
      last_updated = CURRENT_TIMESTAMP
    WHERE user_id = ?`,
    args: [
      stats.total_points,
      stats.goals_scored,
      stats.saves_made,
      stats.games_played,
      stats.games_won,
      stats.games_lost,
      stats.games_drawn,
      stats.current_streak,
      stats.best_streak,
      stats.perfect_games,
      stats.current_level,
      userId
    ]
  });
}

// Removed complex achievement system - levels are now calculated on-the-fly from total_points