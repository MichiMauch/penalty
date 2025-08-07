// Script to fix the problematic revenge match AyFWdgaI6c
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@libsql/client');

async function fixRevengeMatch() {
  const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    console.log('🔍 Checking match AyFWdgaI6c...');
    
    // Get the match details
    const result = await db.execute({
      sql: 'SELECT * FROM matches WHERE id = ?',
      args: ['AyFWdgaI6c']
    });

    if (result.rows.length === 0) {
      console.log('❌ Match not found');
      return;
    }

    const match = result.rows[0];
    console.log('📊 Current match state:');
    console.log('   Status:', match.status);
    console.log('   Player A:', match.player_a_email);
    console.log('   Player B:', match.player_b_email);
    console.log('   Player B ID:', match.player_b);

    // Fix the match by setting proper status and removing player_b
    console.log('🔧 Fixing match...');
    
    const updateResult = await db.execute({
      sql: `UPDATE matches 
            SET status = 'waiting', 
                player_b = NULL,
                player_b_username = NULL,
                player_b_avatar = NULL
            WHERE id = ?`,
      args: ['AyFWdgaI6c']
    });

    if (updateResult.rowsAffected > 0) {
      console.log('✅ Match fixed successfully!');
      console.log('   - Status changed to "waiting"');
      console.log('   - Player B needs to join again');
      console.log('   - Match should now appear in pending matches');
    } else {
      console.log('❌ Failed to update match');
    }

  } catch (error) {
    console.error('❌ Error fixing match:', error);
  } finally {
    db.close();
  }
}

// Run the script
fixRevengeMatch();