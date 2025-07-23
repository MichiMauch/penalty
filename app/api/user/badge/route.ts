import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserSession } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const session = await getUserSession(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { achievementId } = await request.json();

    if (!achievementId) {
      // Remove active badge
      await db.execute({
        sql: 'DELETE FROM user_active_badge WHERE user_id = ?',
        args: [session.user.id]
      });
      
      return NextResponse.json({ success: true, activeBadge: null });
    }

    // Check if user has this achievement
    const hasAchievement = await db.execute({
      sql: 'SELECT * FROM user_achievements WHERE user_id = ? AND achievement_id = ?',
      args: [session.user.id, achievementId]
    });

    if (hasAchievement.rows.length === 0) {
      return NextResponse.json(
        { error: 'You have not earned this achievement' },
        { status: 403 }
      );
    }

    // Update active badge
    await db.execute({
      sql: `
        INSERT INTO user_active_badge (user_id, achievement_id, set_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          achievement_id = excluded.achievement_id,
          set_at = excluded.set_at
      `,
      args: [session.user.id, achievementId]
    });

    // Get achievement details
    const achievementResult = await db.execute({
      sql: 'SELECT * FROM achievements WHERE id = ?',
      args: [achievementId]
    });

    const achievement = achievementResult.rows[0];

    return NextResponse.json({
      success: true,
      activeBadge: {
        id: achievement.id as string,
        name: achievement.name as string,
        icon: achievement.icon as string
      }
    });
  } catch (error) {
    console.error('Error updating active badge:', error);
    return NextResponse.json(
      { error: 'Failed to update active badge' },
      { status: 500 }
    );
  }
}