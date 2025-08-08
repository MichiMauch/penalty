import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db, initDB } from '@/lib/db';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Require admin authentication and get current admin user
    const adminUser = await requireAdmin(request);
    
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }
    
    await initDB();
    
    const { userId } = await params;
    const body = await request.json();
    const { is_admin } = body;

    // Prevent admin from removing their own admin status
    if (adminUser.id === userId && is_admin === false) {
      return NextResponse.json(
        { error: 'Du kannst deine eigenen Admin-Rechte nicht entfernen' },
        { status: 400 }
      );
    }

    // Validate that userId exists
    const userCheck = await db.execute({
      sql: 'SELECT id, username FROM users WHERE id = ?',
      args: [userId]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update admin status
    const result = await db.execute({
      sql: 'UPDATE users SET is_admin = ? WHERE id = ?',
      args: [is_admin ? 1 : 0, userId]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    const user = userCheck.rows[0];
    console.log(`Admin ${adminUser.username} ${is_admin ? 'granted' : 'removed'} admin rights to/from ${user.username}`);

    return NextResponse.json({
      success: true,
      message: `User ${user.username} ${is_admin ? 'ist jetzt Admin' : 'ist kein Admin mehr'}`
    });
  } catch (error) {
    console.error('Error updating user admin status:', error);
    
    // Handle auth errors
    if (error instanceof Error) {
      if (error.message.includes('Admin-Berechtigung') || error.message.includes('Authentifizierung')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}