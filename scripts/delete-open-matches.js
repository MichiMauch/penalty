#!/usr/bin/env node

/**
 * Script to delete all open (non-finished) matches from Turso database
 * 
 * Usage: node scripts/delete-open-matches.js
 */

const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const { createClient } = require('@libsql/client');

async function deleteOpenMatches() {
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl || !authToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
    process.exit(1);
  }

  const db = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  try {
    console.log('🔍 Checking for open matches...');
    
    // First, let's see what matches exist
    const allMatches = await db.execute('SELECT id, status, player_a_email, player_b_email, created_at FROM matches ORDER BY created_at DESC');
    console.log(`📊 Total matches in database: ${allMatches.rows.length}`);
    
    if (allMatches.rows.length === 0) {
      console.log('✅ No matches found in database');
      return;
    }

    // Show breakdown by status
    const statusCounts = {};
    allMatches.rows.forEach(row => {
      const status = row.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    
    console.log('📈 Matches by status:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    // Find open matches (not finished)
    const openMatches = await db.execute(`
      SELECT id, status, player_a_email, player_b_email, created_at 
      FROM matches 
      WHERE status != 'finished' OR status IS NULL
      ORDER BY created_at DESC
    `);

    if (openMatches.rows.length === 0) {
      console.log('✅ No open matches found to delete');
      return;
    }

    console.log(`\n🎯 Found ${openMatches.rows.length} open matches:`);
    openMatches.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ID: ${row.id}, Status: ${row.status || 'null'}, Players: ${row.player_a_email || 'none'} vs ${row.player_b_email || 'none'}, Created: ${row.created_at}`);
    });

    // Confirm deletion
    console.log(`\n⚠️  This will DELETE ${openMatches.rows.length} open matches. This action cannot be undone!`);
    
    // In a real script, you might want to add a confirmation prompt
    // For now, let's proceed with the deletion
    
    console.log('🗑️  Deleting open matches...');
    
    const deleteResult = await db.execute(`
      DELETE FROM matches 
      WHERE status != 'finished' OR status IS NULL
    `);
    
    console.log(`✅ Successfully deleted ${deleteResult.rowsAffected} open matches`);
    
    // Verify deletion
    const remainingMatches = await db.execute('SELECT COUNT(*) as count FROM matches');
    console.log(`📊 Remaining matches in database: ${remainingMatches.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error deleting open matches:', error);
    process.exit(1);
  }
}

// Add confirmation prompt function
function askForConfirmation() {
  return new Promise((resolve) => {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Are you sure you want to delete all open matches? (yes/no): ', (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

// Main execution with confirmation
async function main() {
  console.log('🏗️  Open Matches Deletion Script');
  console.log('==================================\n');
  
  try {
    // Show what will be deleted first
    await showOpenMatches();
    
    // Ask for confirmation
    const confirmed = await askForConfirmation();
    
    if (!confirmed) {
      console.log('❌ Operation cancelled by user');
      process.exit(0);
    }
    
    // Proceed with deletion
    await deleteOpenMatches();
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

async function showOpenMatches() {
  const databaseUrl = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!databaseUrl || !authToken) {
    console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables');
    process.exit(1);
  }

  const db = createClient({
    url: databaseUrl,
    authToken: authToken,
  });

  const openMatches = await db.execute(`
    SELECT id, status, player_a_email, player_b_email, created_at 
    FROM matches 
    WHERE status != 'finished' OR status IS NULL
    ORDER BY created_at DESC
  `);

  if (openMatches.rows.length === 0) {
    console.log('✅ No open matches found to delete');
    process.exit(0);
  }

  console.log(`🎯 Found ${openMatches.rows.length} open matches to delete:`);
  openMatches.rows.forEach((row, index) => {
    console.log(`  ${index + 1}. ID: ${row.id.substring(0, 8)}..., Status: ${row.status || 'null'}, Created: ${row.created_at}`);
  });
  console.log();
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { deleteOpenMatches };