#!/usr/bin/env node

const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const databaseUrl = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!databaseUrl || !authToken) {
  console.error('❌ Turso environment variables not set. Please check TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.');
  process.exit(1);
}

const db = createClient({
  url: databaseUrl,
  authToken: authToken,
});

async function clearAllTables() {
  try {
    console.log('🧹 Clearing all tables in Turso database...');
    
    // Clear tables in correct order (respecting foreign key constraints)
    console.log('📝 Clearing sessions table...');
    await db.execute('DELETE FROM sessions');
    
    console.log('🎮 Clearing matches table...');
    await db.execute('DELETE FROM matches');
    
    console.log('👤 Clearing users table...');
    await db.execute('DELETE FROM users');
    
    console.log('✅ All tables cleared successfully!');
    console.log('🎯 Database is now empty and ready for fresh testing.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearAllTables();