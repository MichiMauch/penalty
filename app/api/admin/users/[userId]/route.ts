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
    const { is_admin, is_blocked } = body;

    // Prevent admin from removing their own admin status or blocking themselves
    if (adminUser.id === userId) {
      if (is_admin === false) {
        return NextResponse.json(
          { error: 'Du kannst deine eigenen Admin-Rechte nicht entfernen' },
          { status: 400 }
        );
      }
      if (is_blocked === true) {
        return NextResponse.json(
          { error: 'Du kannst dich nicht selbst sperren' },
          { status: 400 }
        );
      }
    }

    // Validate that userId exists
    const userCheck = await db.execute({
      sql: 'SELECT id, username FROM users WHERE id = ?',
      args: [userId]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const args: any[] = [];
    
    if (is_admin !== undefined) {
      updates.push('is_admin = ?');
      args.push(is_admin ? 1 : 0);
    }
    
    if (is_blocked !== undefined) {
      updates.push('is_blocked = ?');
      args.push(is_blocked ? 1 : 0);
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }
    
    args.push(userId);
    
    const result = await db.execute({
      sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      args
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }

    const user = userCheck.rows[0];
    
    // Log the action
    let logMessage = `Admin ${adminUser.username} updated ${user.username}:`;
    if (is_admin !== undefined) {
      logMessage += ` ${is_admin ? 'granted' : 'removed'} admin rights`;
    }
    if (is_blocked !== undefined) {
      logMessage += ` ${is_blocked ? 'blocked' : 'unblocked'} user`;
    }
    console.log(logMessage);

    // Generate response message
    let message = `User ${user.username}`;
    if (is_admin !== undefined && is_blocked !== undefined) {
      message += ` ${is_admin ? 'ist jetzt Admin' : 'ist kein Admin mehr'} und ${is_blocked ? 'wurde gesperrt' : 'wurde entsperrt'}`;
    } else if (is_admin !== undefined) {
      message += ` ${is_admin ? 'ist jetzt Admin' : 'ist kein Admin mehr'}`;
    } else if (is_blocked !== undefined) {
      message += ` ${is_blocked ? 'wurde gesperrt' : 'wurde entsperrt'}`;
    }

    return NextResponse.json({
      success: true,
      message
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

export async function DELETE(
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

    // Prevent admin from deleting themselves
    if (adminUser.id === userId) {
      return NextResponse.json(
        { error: 'Du kannst dich nicht selbst löschen' },
        { status: 400 }
      );
    }

    // Get user info before deletion
    const userCheck = await db.execute({
      sql: 'SELECT id, username, email FROM users WHERE id = ?',
      args: [userId]
    });

    if (userCheck.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = userCheck.rows[0];

    // Delete user (cascade will handle sessions, stats, etc.)
    const result = await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId]
    });

    if (result.rowsAffected === 0) {
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    console.log(`Admin ${adminUser.username} deleted user ${user.username} (${user.email})`);

    return NextResponse.json({
      success: true,
      message: `User ${user.username} wurde gelöscht`
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    // Handle auth errors
    if (error instanceof Error) {
      if (error.message.includes('Admin-Berechtigung') || error.message.includes('Authentifizierung')) {
        return NextResponse.json({ error: error.message }, { status: 403 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}