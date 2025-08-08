import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, initDB } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);
    
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    await initDB();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    let sql = `
      SELECT 
        u.id,
        u.email,
        u.username,
        u.avatar,
        u.created_at,
        u.is_admin,
        COALESCE(s.total_points, 0) as total_points,
        COALESCE(s.games_played, 0) as games_played,
        COALESCE(s.games_won, 0) as games_won
      FROM users u
      LEFT JOIN user_stats s ON s.user_id = u.id
    `;
    
    const args: any[] = [];

    if (search) {
      sql += ` WHERE u.email LIKE ? OR u.username LIKE ?`;
      args.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const users = await db.execute({
      sql,
      args
    });

    // Get total count for pagination
    let countSql = 'SELECT COUNT(*) as total FROM users';
    const countArgs: any[] = [];

    if (search) {
      countSql += ` WHERE email LIKE ? OR username LIKE ?`;
      countArgs.push(`%${search}%`, `%${search}%`);
    }

    const countResult = await db.execute({
      sql: countSql,
      args: countArgs
    });

    return NextResponse.json({
      users: users.rows,
      total: countResult.rows[0]?.total || 0,
      page: Math.floor(offset / limit) + 1,
      limit
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Handle auth errors
    if (error instanceof Error) {
      if (error.message.includes('Admin-Berechtigung') || error.message.includes('Authentifizierung')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}