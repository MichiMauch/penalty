import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.warn('Turso environment variables not set. Database operations will fail.');
}

// Use conditional import to load web-compatible version on Vercel
let createClient: any;

try {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    // Use web version for serverless environments
    createClient = require('@libsql/client/web').createClient;
  } else {
    // Use node version for local development
    createClient = require('@libsql/client').createClient;
  }
} catch (error) {
  console.error('Failed to import libsql client:', error);
  createClient = require('@libsql/client').createClient;
}

export const db = databaseUrl && authToken && createClient ? createClient({
  url: databaseUrl,
  authToken: authToken,
}) : null;

export async function initDB() {
  if (!db) {
    throw new Error('Database not configured. Please set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables.');
  }
  
  // Create users table for authentication
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT 'player1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create sessions table for session management
  await db.execute(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
  
  // Create matches table if it doesn't exist
  await db.execute(`
    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      player_a TEXT,
      player_b TEXT,
      player_a_email TEXT,
      player_b_email TEXT,
      player_a_moves TEXT,
      player_b_moves TEXT,
      status TEXT DEFAULT 'waiting',
      winner TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add new columns for user profiles if they don't exist
  try {
    await db.execute(`ALTER TABLE matches ADD COLUMN player_a_username TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  try {
    await db.execute(`ALTER TABLE matches ADD COLUMN player_b_username TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add admin column to users table
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add blocked column to users table
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN is_blocked BOOLEAN DEFAULT FALSE`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Add preferred language column to users table
  try {
    await db.execute(`ALTER TABLE users ADD COLUMN preferred_language TEXT DEFAULT 'de'`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Set Roberto Böckli as admin if he exists
  try {
    await db.execute(`
      UPDATE users 
      SET is_admin = TRUE 
      WHERE username LIKE '%Roberto%' AND username LIKE '%Böckli%'
      OR username LIKE '%Roberto%' AND username LIKE '%Boeckli%'
    `);
  } catch (error) {
    console.error('Error setting Roberto Böckli as admin:', error);
  }

  try {
    await db.execute(`ALTER TABLE matches ADD COLUMN player_a_avatar TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  try {
    await db.execute(`ALTER TABLE matches ADD COLUMN player_b_avatar TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Create user statistics table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_stats (
      user_id TEXT PRIMARY KEY,
      total_points INTEGER DEFAULT 0,
      goals_scored INTEGER DEFAULT 0,
      saves_made INTEGER DEFAULT 0,
      games_played INTEGER DEFAULT 0,
      games_won INTEGER DEFAULT 0,
      games_lost INTEGER DEFAULT 0,
      games_drawn INTEGER DEFAULT 0,
      current_streak INTEGER DEFAULT 0,
      best_streak INTEGER DEFAULT 0,
      perfect_games INTEGER DEFAULT 0,
      current_level INTEGER DEFAULT 1,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Achievement tables removed - levels are now calculated from total_points
  
  // Add current_level column to existing user_stats table if it doesn't exist
  try {
    await db.execute(`
      ALTER TABLE user_stats ADD COLUMN current_level INTEGER DEFAULT 1
    `);
  } catch (error) {
    // Column already exists, ignore error
  }

  // Create push subscriptions table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, endpoint)
    )
  `);

  // Create password reset tokens table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);
}