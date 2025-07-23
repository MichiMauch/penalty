import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { nanoid } from './utils';
import { db } from './db';
import { User, UserSession } from './types';

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Session management
export async function createSession(userId: string): Promise<string> {
  if (!db) throw new Error('Database not configured');
  
  const sessionId = nanoid();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  await db.execute({
    sql: 'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)',
    args: [sessionId, userId, expiresAt.toISOString()]
  });
  
  return sessionId;
}

export async function getSession(sessionId: string): Promise<UserSession | null> {
  if (!db) return null;
  
  const result = await db.execute({
    sql: `
      SELECT s.id, s.expires_at, u.id as user_id, u.email, u.username, u.avatar, u.created_at, u.updated_at
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > datetime('now')
    `,
    args: [sessionId]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    user: {
      id: row.user_id as string,
      email: row.email as string,
      username: row.username as string,
      avatar: row.avatar as any,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    },
    expires_at: row.expires_at as string
  };
}

export async function deleteSession(sessionId: string): Promise<void> {
  if (!db) return;
  
  await db.execute({
    sql: 'DELETE FROM sessions WHERE id = ?',
    args: [sessionId]
  });
}

export async function cleanExpiredSessions(): Promise<void> {
  if (!db) return;
  
  await db.execute({
    sql: 'DELETE FROM sessions WHERE expires_at <= datetime("now")',
    args: []
  });
}

// User management
export async function createUser(email: string, password: string, username: string, avatar: string): Promise<User> {
  if (!db) throw new Error('Database not configured');
  
  const userId = nanoid();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();
  
  await db.execute({
    sql: 'INSERT INTO users (id, email, password_hash, username, avatar, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [userId, email, passwordHash, username, avatar, now, now]
  });
  
  return {
    id: userId,
    email,
    username,
    avatar: avatar as any,
    created_at: now,
    updated_at: now
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!db) return null;
  
  const result = await db.execute({
    sql: 'SELECT id, email, username, avatar, created_at, updated_at FROM users WHERE email = ?',
    args: [email]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    id: row.id as string,
    email: row.email as string,
    username: row.username as string,
    avatar: row.avatar as any,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string
  };
}

export async function getUserByEmailWithPassword(email: string): Promise<{ user: User; passwordHash: string } | null> {
  if (!db) return null;
  
  const result = await db.execute({
    sql: 'SELECT id, email, password_hash, username, avatar, created_at, updated_at FROM users WHERE email = ?',
    args: [email]
  });
  
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  return {
    user: {
      id: row.id as string,
      email: row.email as string,
      username: row.username as string,
      avatar: row.avatar as any,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string
    },
    passwordHash: row.password_hash as string
  };
}

export async function getUserSession(request: NextRequest): Promise<UserSession | null> {
  const sessionId = request.cookies.get('session')?.value;
  if (!sessionId) return null;
  
  return await getSession(sessionId);
}