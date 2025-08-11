import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  // Check authentication
  const session = await getUserSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { new_email, current_password } = body;
    
    // Validation
    if (!new_email || !current_password) {
      return NextResponse.json({ error: 'New email and current password required' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(new_email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Check if email is already in use
    const emailCheck = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ? AND id != ?',
      args: [new_email.toLowerCase(), session.user.id]
    });
    
    if (emailCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }
    
    // Verify current password
    const userResult = await db.execute({
      sql: 'SELECT password_hash FROM users WHERE id = ?',
      args: [session.user.id]
    });
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const isValidPassword = await bcrypt.compare(current_password, userResult.rows[0].password_hash as string);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    
    // Update email
    await db.execute({
      sql: 'UPDATE users SET email = ?, updated_at = datetime("now") WHERE id = ?',
      args: [new_email.toLowerCase(), session.user.id]
    });
    
    return NextResponse.json({
      message: 'Email updated successfully',
      new_email: new_email.toLowerCase()
    });
    
  } catch (error) {
    console.error('Error changing email:', error);
    return NextResponse.json(
      { error: 'Failed to change email' },
      { status: 500 }
    );
  }
}