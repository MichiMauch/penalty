import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // No auth required for public stats

    if (!db) {
      return NextResponse.json({ error: 'Datenbankverbindung fehlgeschlagen' }, { status: 500 });
    }

    // Fetch various statistics
    const [
      systemStats,
      matchStatusStats,
      topPlayers,
      recentMatches,
      dailyActivity,
      avatarDistribution
    ] = await Promise.all([
      // System overview
      db.execute(`
        SELECT 
          (SELECT COUNT(*) FROM users) as total_users,
          (SELECT COUNT(*) FROM matches) as total_matches,
          (SELECT COUNT(*) FROM matches WHERE status = 'finished') as finished_matches,
          (SELECT COUNT(*) FROM matches WHERE winner IS NOT NULL) as completed_matches
      `),

      // Match status distribution
      db.execute(`
        SELECT status, COUNT(*) as count 
        FROM matches 
        GROUP BY status
      `),

      // Top 10 players by points
      db.execute(`
        SELECT 
          u.username, 
          u.avatar,
          s.total_points,
          s.games_won,
          s.games_played,
          CASE 
            WHEN s.games_played > 0 
            THEN ROUND(CAST(s.games_won AS FLOAT) / s.games_played * 100, 1)
            ELSE 0
          END as win_rate
        FROM user_stats s
        JOIN users u ON u.id = s.user_id
        WHERE s.games_played > 0
        ORDER BY s.total_points DESC
        LIMIT 10
      `),

      // Recent 10 matches
      db.execute(`
        SELECT 
          m.id,
          m.player_a_username,
          m.player_b_username,
          m.status,
          m.winner,
          m.created_at
        FROM matches m
        ORDER BY m.created_at DESC
        LIMIT 10
      `),

      // Daily activity (last 7 days)
      db.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as matches_played
        FROM matches
        WHERE created_at >= date('now', '-7 days')
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),

      // Avatar distribution
      db.execute(`
        SELECT 
          avatar,
          COUNT(*) as count
        FROM users
        GROUP BY avatar
        ORDER BY count DESC
      `)
    ]);

    const stats = {
      system: systemStats.rows[0] || {},
      matchStatus: matchStatusStats.rows || [],
      topPlayers: topPlayers.rows || [],
      recentMatches: recentMatches.rows || [],
      dailyActivity: dailyActivity.rows || [],
      avatarDistribution: avatarDistribution.rows || []
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Statistiken' }, { status: 500 });
  }
}