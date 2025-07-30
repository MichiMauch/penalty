import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search for users by username or email, include their points
    const result = await db.execute({
      sql: `
        SELECT u.id, u.username, u.email, u.avatar, COALESCE(s.total_points, 0) as total_points
        FROM users u
        LEFT JOIN user_stats s ON u.id = s.user_id
        WHERE u.username LIKE ? OR u.email LIKE ?
        ORDER BY s.total_points DESC, u.username ASC
        LIMIT 10
      `,
      args: [`%${query}%`, `%${query}%`]
    });

    const users = result.rows.map((row: any) => ({
      id: row.id,
      username: row.username,
      email: row.email,
      avatar: row.avatar,
      totalPoints: Number(row.total_points) || 0
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { error: 'Failed to search users' },
      { status: 500 }
    );
  }
}