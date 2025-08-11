import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { getUserSession } from '@/lib/auth';
import { EmailPreferences } from '@/lib/types';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
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
    // Get user profile with email preferences
    const result = await db.execute({
      sql: `SELECT id, email, username, avatar, preferred_language, email_preferences, created_at 
            FROM users WHERE id = ?`,
      args: [session.user.id]
    });
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const user = result.rows[0];
    let emailPreferences: EmailPreferences = {
      challenges: true,
      match_results: true,
      invitations: true
    };
    
    // Parse email preferences if they exist
    if (user.email_preferences) {
      try {
        emailPreferences = JSON.parse(user.email_preferences as string);
      } catch (error) {
        console.error('Error parsing email preferences:', error);
      }
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        preferred_language: user.preferred_language,
        email_preferences: emailPreferences,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const { username, avatar, preferred_language, email_preferences, current_password, new_password } = body;
    
    // If changing password, verify current password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json({ error: 'Current password required' }, { status: 400 });
      }
      
      // Get current user with password hash
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
      
      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(new_password, saltRounds);
      
      // Update password
      await db.execute({
        sql: 'UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?',
        args: [newPasswordHash, session.user.id]
      });
    }
    
    // Build update query for other fields
    const updates: string[] = [];
    const values: any[] = [];
    
    if (username !== undefined) {
      // Check if username is already taken by another user
      const usernameCheck = await db.execute({
        sql: 'SELECT id FROM users WHERE username = ? AND id != ?',
        args: [username, session.user.id]
      });
      
      if (usernameCheck.rows.length > 0) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
      }
      
      updates.push('username = ?');
      values.push(username);
    }
    
    if (avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(avatar);
    }
    
    if (preferred_language !== undefined) {
      updates.push('preferred_language = ?');
      values.push(preferred_language);
    }
    
    if (email_preferences !== undefined) {
      updates.push('email_preferences = ?');
      values.push(JSON.stringify(email_preferences));
    }
    
    // Always update the updated_at timestamp
    if (updates.length > 0) {
      updates.push('updated_at = datetime("now")');
      values.push(session.user.id);
      
      await db.execute({
        sql: `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        args: values
      });
    }
    
    // Fetch updated user data
    const result = await db.execute({
      sql: `SELECT id, email, username, avatar, preferred_language, email_preferences, created_at 
            FROM users WHERE id = ?`,
      args: [session.user.id]
    });
    
    const updatedUser = result.rows[0];
    let parsedEmailPreferences: EmailPreferences = {
      challenges: true,
      match_results: true,
      invitations: true
    };
    
    if (updatedUser.email_preferences) {
      try {
        parsedEmailPreferences = JSON.parse(updatedUser.email_preferences as string);
      } catch (error) {
        console.error('Error parsing updated email preferences:', error);
      }
    }
    
    return NextResponse.json({
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        avatar: updatedUser.avatar,
        preferred_language: updatedUser.preferred_language,
        email_preferences: parsedEmailPreferences,
        created_at: updatedUser.created_at
      },
      message: 'Profile updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}