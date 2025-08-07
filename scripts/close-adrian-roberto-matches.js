// Script to close all open matches for Adrian and Roberto Böckli
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

async function closeOpenMatches() {
  // Initialize database connection
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('🔍 Searching for open matches for Adrian and Roberto Böckli...');
    
    // Find all open matches for these users
    const openMatches = await db.execute({
      sql: `
        SELECT 
          id,
          player_a_email,
          player_a_username,
          player_b_email,
          player_b_username,
          status,
          player_a_moves,
          player_b_moves,
          created_at
        FROM matches 
        WHERE status != 'finished' 
          AND (
            player_a_email LIKE '%adrian%' OR 
            player_a_username LIKE '%adrian%' OR
            player_b_email LIKE '%adrian%' OR 
            player_b_username LIKE '%adrian%' OR
            player_a_email LIKE '%roberto%' OR 
            player_a_username LIKE '%roberto%' OR
            player_b_email LIKE '%roberto%' OR 
            player_b_username LIKE '%roberto%' OR
            player_a_username LIKE '%böckli%' OR
            player_b_username LIKE '%böckli%'
          )
        ORDER BY created_at DESC
      `
    });

    console.log(`📊 Found ${openMatches.rows.length} open matches`);
    
    if (openMatches.rows.length === 0) {
      console.log('✅ No open matches found for Adrian or Roberto Böckli');
      return;
    }

    // Show matches before deletion
    console.log('📋 Open matches to be closed:');
    openMatches.rows.forEach((match, index) => {
      console.log(`${index + 1}. ${match.id}`);
      console.log(`   Player A: ${match.player_a_email} (${match.player_a_username})`);
      console.log(`   Player B: ${match.player_b_email || 'Not joined'} (${match.player_b_username || 'N/A'})`);
      console.log(`   Status: ${match.status}`);
      console.log(`   Moves: A=${!!match.player_a_moves}, B=${!!match.player_b_moves}`);
      console.log(`   Created: ${match.created_at}`);
      console.log('');
    });

    // Delete all these matches
    const matchIds = openMatches.rows.map(match => match.id);
    
    console.log('🗑️ Deleting matches...');
    
    for (const matchId of matchIds) {
      const result = await db.execute({
        sql: 'DELETE FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rowsAffected > 0) {
        console.log(`✅ Deleted match ${matchId}`);
      } else {
        console.log(`❌ Failed to delete match ${matchId}`);
      }
    }

    console.log(`🎉 Successfully closed ${matchIds.length} open matches for Adrian and Roberto Böckli`);

  } catch (error) {
    console.error('❌ Error closing matches:', error);
  } finally {
    // Close database connection
    db.close();
  }
}

// Run the script
closeOpenMatches();