import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { nanoid } from '@/lib/utils';
import { calculateGameResult } from '@/lib/gameLogic';
import { PlayerMoves } from '@/lib/types';
import { sendChallengeEmail } from '@/lib/email';
import { calculateAndUpdateStats } from '@/lib/stats';
import { sendChallengeNotification } from '@/lib/pushNotifications';
import { getUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  const body = await request.json();
  const { action } = body;
  
  switch (action) {
    case 'create': {
      const matchId = nanoid();
      const { playerId, email, username, avatar, moves } = body;
      const finalPlayerId = playerId || nanoid();
      
      // Create match with or without initial moves
      if (moves && moves.length > 0) {
        // Create match with player A moves
        const playerMoves = { moves: moves, role: 'shooter' };
        await db.execute({
          sql: 'INSERT INTO matches (id, player_a, player_a_email, player_a_username, player_a_avatar, player_a_moves) VALUES (?, ?, ?, ?, ?, ?)',
          args: [matchId, finalPlayerId, email, username, avatar, JSON.stringify(playerMoves)]
        });
      } else {
        // Create match without moves
        await db.execute({
          sql: 'INSERT INTO matches (id, player_a, player_a_email, player_a_username, player_a_avatar) VALUES (?, ?, ?, ?, ?)',
          args: [matchId, finalPlayerId, email, username, avatar]
        });
      }
      
      return NextResponse.json({ matchId, playerId: finalPlayerId });
    }
    
    case 'join': {
      const { matchId, playerId, email, username, avatar } = body;
      console.log('JOIN attempt:', { matchId, playerId, email, username });
      
      const result = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rows.length === 0) {
        console.log('Match not found:', matchId);
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const match = result.rows[0];
      console.log('Match state:', {
        player_b: match.player_b,
        player_b_email: match.player_b_email,
        player_b_moves: match.player_b_moves,
        status: match.status,
        joining_email: email
      });
      
      if (match.player_b && match.player_b_email !== email) {
        console.log('Match already full - different email');
        return NextResponse.json({ error: 'Match already full' }, { status: 400 });
      }
      
      // If player_b exists but it's the same email as the invited player, allow them to join/rejoin
      if (match.player_b && match.player_b_email === email) {
        // This is the invited player trying to rejoin - allow it
        const finalPlayerId = playerId || nanoid();
        await db.execute({
          sql: 'UPDATE matches SET player_b = ?, player_b_username = ?, player_b_avatar = ? WHERE id = ?',
          args: [finalPlayerId, username, avatar, matchId]
        });
        
        return NextResponse.json({ matchId, playerId: finalPlayerId });
      }
      
      const finalPlayerId = playerId || nanoid();
      await db.execute({
        sql: 'UPDATE matches SET player_b = ?, player_b_email = ?, player_b_username = ?, player_b_avatar = ? WHERE id = ?',
        args: [finalPlayerId, email, username, avatar, matchId]
      });
      
      return NextResponse.json({ matchId, playerId: finalPlayerId });
    }

    case 'takeover-player-b': {
      const { matchId, playerId, email, username, avatar } = body;
      console.log('Taking over player B for match:', matchId, 'with player:', playerId);
      
      // Allow taking over player B slot if they haven't submitted moves yet
      await db.execute({
        sql: 'UPDATE matches SET player_b = ?, player_b_email = ?, player_b_username = ?, player_b_avatar = ? WHERE id = ? AND player_b_moves IS NULL',
        args: [playerId, email, username, avatar, matchId]
      });
      
      return NextResponse.json({ success: true });
    }
    
    case 'invite-player': {
      const { matchId, email } = body;
      const result = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const match = result.rows[0];
      
      // Check for existing pending challenges between these players
      const existingChallengeResult = await db.execute({
        sql: `
          SELECT id 
          FROM matches 
          WHERE (
            (player_a_email = ? AND player_b_email = ?) OR 
            (player_a_email = ? AND player_b_email = ?)
          ) 
          AND status != 'finished'
          AND (
            player_a_moves IS NULL OR 
            player_b_moves IS NULL OR
            player_b IS NULL
          )
          AND id != ?
          LIMIT 1
        `,
        args: [match.player_a_email, email, email, match.player_a_email, matchId]
      });
      
      if (existingChallengeResult.rows.length > 0) {
        return NextResponse.json({ 
          error: 'Es existiert bereits eine offene Herausforderung zwischen diesen Spielern. Bitte warte, bis diese abgeschlossen ist.',
          existingChallenge: true 
        }, { status: 400 });
      }
      
      // Store the email for the invitation
      await db.execute({
        sql: 'UPDATE matches SET player_b_email = ? WHERE id = ?',
        args: [email, matchId]
      });
      
      // Send email invitation if we have the API key configured
      if (process.env.RESEND_API_KEY) {
        const emailResult = await sendChallengeEmail({
          to: email,
          challengerEmail: match.player_a_email as string || 'Ein Spieler',
          matchId
        });
        
        if (!emailResult.success) {
          console.error('Failed to send challenge email:', emailResult.error);
          // Don't fail the whole request if email fails
          return NextResponse.json({ 
            success: true, 
            message: 'Invitation saved, but email could not be sent. Please share the link manually.',
            emailError: true
          });
        }
      } else {
        console.warn('RESEND_API_KEY not configured - skipping email send');
      }
      
      // Send push notification to the challenged user
      try {
        const challengedUser = await getUserByEmail(email);
        if (challengedUser) {
          await sendChallengeNotification(
            challengedUser.id,
            match.player_a_username as string || match.player_a_email as string || 'Ein Spieler',
            matchId
          );
          console.log('Push notification sent to:', email);
        }
      } catch (error) {
        console.error('Error sending push notification:', error);
        // Don't fail the request if push fails
      }
      
      return NextResponse.json({ success: true, message: 'Invitation sent' });
    }
    
    case 'decline-challenge': {
      const { matchId, email, reason } = body;
      console.log('DECLINE challenge:', { matchId, email, reason });
      
      const result = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const match = result.rows[0];
      
      // Only the invited player (player_b_email) can decline
      if (match.player_b_email !== email) {
        return NextResponse.json({ error: 'Unauthorized to decline this challenge' }, { status: 403 });
      }
      
      // Delete the match
      await db.execute({
        sql: 'DELETE FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      // TODO: Send notification email to challenger about decline
      console.log(`Challenge ${matchId} declined by ${email}, challenger: ${match.player_a_email}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Challenge declined successfully' 
      });
    }

    case 'cancel-challenge': {
      const { matchId, email } = body;
      console.log('CANCEL challenge:', { matchId, email });
      
      const result = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const match = result.rows[0];
      
      // Only the challenger (player_a_email) can cancel if no one has joined yet
      if (match.player_a_email !== email) {
        return NextResponse.json({ error: 'Unauthorized to cancel this challenge' }, { status: 403 });
      }
      
      // Only allow canceling if player_b hasn't joined yet or hasn't made moves
      if (match.player_b && match.player_b_moves) {
        return NextResponse.json({ error: 'Cannot cancel challenge - game already in progress' }, { status: 400 });
      }
      
      // Delete the match
      await db.execute({
        sql: 'DELETE FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      console.log(`Challenge ${matchId} cancelled by ${email}`);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Challenge cancelled successfully' 
      });
    }

    case 'create-revenge': {
      const { matchId, playerAEmail, playerBEmail, playerAUsername, playerBUsername, playerAAvatar, playerBAvatar, originalMatchId } = body;
      
      // Erstelle neues Match mit getauschten Rollen für Revanche
      // Nur Player A wird erstellt, Player B muss beitreten
      const playerAId = nanoid(); // Neue Player ID für Angreifer
      
      await db.execute({
        sql: 'INSERT INTO matches (id, player_a, player_a_email, player_a_username, player_a_avatar, player_b_email, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        args: [matchId, playerAId, playerAEmail, playerAUsername, playerAAvatar, playerBEmail, 'waiting']
      });
      
      // Sende E-Mail-Einladung an Player B (der neue Verteidiger)
      if (process.env.RESEND_API_KEY) {
        const emailResult = await sendChallengeEmail({
          to: playerBEmail,
          challengerEmail: playerAEmail,
          matchId
        });
        
        if (!emailResult.success) {
          console.error('Failed to send revenge challenge email:', emailResult.error);
        }
      }
      
      // Send push notification to the challenged user
      try {
        const challengedUser = await getUserByEmail(playerBEmail);
        if (challengedUser) {
          await sendChallengeNotification(
            challengedUser.id,
            playerAUsername || playerAEmail || 'Ein Spieler',
            matchId
          );
          console.log('Revenge push notification sent to:', playerBEmail);
        }
      } catch (error) {
        console.error('Error sending revenge push notification:', error);
      }
      
      return NextResponse.json({ 
        matchId, 
        playerId: playerAId, // Player der Revanche startet wird Player A
        success: true, 
        message: 'Revanche erstellt - Einladung gesendet!' 
      });
    }

    case 'submit-moves': {
      const { matchId, playerId, moves } = body;
      console.log('Submit moves:', { matchId, playerId, moves });
      
      const result = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      if (result.rows.length === 0) {
        return NextResponse.json({ error: 'Match not found' }, { status: 404 });
      }
      
      const match = result.rows[0];
      const isPlayerA = match.player_a === playerId;
      const isPlayerB = match.player_b === playerId;
      
      console.log('Match state before update:', {
        player_a: match.player_a,
        player_b: match.player_b,
        player_a_email: match.player_a_email,
        player_b_email: match.player_b_email,
        submittedPlayerId: playerId,
        isPlayerA,
        isPlayerB,
        player_a_moves: !!match.player_a_moves,
        player_b_moves: !!match.player_b_moves
      });
      
      if (!isPlayerA && !isPlayerB) {
        return NextResponse.json({ error: 'Player not in match' }, { status: 403 });
      }
      
      // Check if moves already submitted
      if (isPlayerA && match.player_a_moves) {
        console.log('Player A already submitted moves');
        return NextResponse.json({ 
          error: 'Deine Schüsse wurden bereits abgegeben! Du kannst sie nicht mehr ändern.' 
        }, { status: 409 });
      }
      
      if (isPlayerB && match.player_b_moves) {
        console.log('Player B already submitted moves');
        return NextResponse.json({ 
          error: 'Deine Abwehr wurde bereits abgegeben! Du kannst sie nicht mehr ändern.' 
        }, { status: 409 });
      }
      
      if (isPlayerA) {
        const updateResult = await db.execute({
          sql: 'UPDATE matches SET player_a_moves = ? WHERE id = ? AND player_a_moves IS NULL',
          args: [JSON.stringify(moves), matchId]
        });
        
        if (updateResult.rowsAffected === 0) {
          return NextResponse.json({ 
            error: 'Moves konnten nicht gespeichert werden - bereits vorhanden.' 
          }, { status: 409 });
        }
      } else {
        const updateResult = await db.execute({
          sql: 'UPDATE matches SET player_b_moves = ? WHERE id = ? AND player_b_moves IS NULL',
          args: [JSON.stringify(moves), matchId]
        });
        
        if (updateResult.rowsAffected === 0) {
          return NextResponse.json({ 
            error: 'Moves konnten nicht gespeichert werden - bereits vorhanden.' 
          }, { status: 409 });
        }
      }
      
      // Check if both players have submitted moves
      const updated = await db.execute({
        sql: 'SELECT * FROM matches WHERE id = ?',
        args: [matchId]
      });
      
      const updatedMatch = updated.rows[0];
      console.log('Match state after update:', {
        player_a_moves: updatedMatch.player_a_moves,
        player_b_moves: updatedMatch.player_b_moves,
        both_have_moves: !!(updatedMatch.player_a_moves && updatedMatch.player_b_moves)
      });
      
      if (updatedMatch.player_a_moves && updatedMatch.player_b_moves) {
        console.log('Both players have moves, calculating result...');
        // Calculate result
        const movesA = JSON.parse(updatedMatch.player_a_moves as string) as PlayerMoves;
        const movesB = JSON.parse(updatedMatch.player_b_moves as string) as PlayerMoves;
        const result = calculateGameResult(movesA, movesB);
        
        console.log('Game result calculated:', result);
        
        const winner = result.winner === 'draw' ? null : 
                      result.winner === 'player_a' ? updatedMatch.player_a : updatedMatch.player_b;
        
        await db.execute({
          sql: 'UPDATE matches SET status = ?, winner = ? WHERE id = ?',
          args: ['finished', winner, matchId]
        });
        
        console.log('Match updated to finished status');

        // Update player stats and check achievements
        const playerAId = await getUserIdByPlayerId(updatedMatch.player_a as string);
        const playerBId = await getUserIdByPlayerId(updatedMatch.player_b as string);
        
        if (playerAId && playerBId) {
          await calculateAndUpdateStats(matchId, playerAId, playerBId, result);
        }
        
        console.log('Returning finished status to client');
        return NextResponse.json({ status: 'finished', result });
      }
      
      console.log('Not all moves submitted yet, returning waiting status');
      return NextResponse.json({ status: 'waiting' });
    }
    
    default:
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }
  
  await initDB();
  
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  
  if (!matchId) {
    return NextResponse.json({ error: 'Match ID required' }, { status: 400 });
  }
  
  const result = await db.execute({
    sql: 'SELECT * FROM matches WHERE id = ?',
    args: [matchId]
  });
  
  if (result.rows.length === 0) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }
  
  const match = result.rows[0];
  
  // Calculate result if game is finished
  let gameResult = null;
  if (match.status === 'finished' && match.player_a_moves && match.player_b_moves) {
    const movesA = JSON.parse(match.player_a_moves as string) as PlayerMoves;
    const movesB = JSON.parse(match.player_b_moves as string) as PlayerMoves;
    gameResult = calculateGameResult(movesA, movesB);
  }
  
  return NextResponse.json({ 
    match: {
      ...match,
      player_a_moves: match.player_a_moves ? JSON.parse(match.player_a_moves as string) : null,
      player_b_moves: match.player_b_moves ? JSON.parse(match.player_b_moves as string) : null,
    },
    result: gameResult
  });
}

async function getUserIdByPlayerId(playerId: string): Promise<string | null> {
  if (!db) return null;
  
  try {
    // First check if the playerId is already a user ID
    const userResult = await db.execute({
      sql: 'SELECT id FROM users WHERE id = ?',
      args: [playerId]
    });
    
    if (userResult.rows.length > 0) {
      return playerId;
    }
    
    // Otherwise, try to find the user through matches
    const matchResult = await db.execute({
      sql: `
        SELECT DISTINCT 
          CASE 
            WHEN player_a = ? THEN player_a_email
            WHEN player_b = ? THEN player_b_email
          END as email
        FROM matches 
        WHERE player_a = ? OR player_b = ?
        LIMIT 1
      `,
      args: [playerId, playerId, playerId, playerId]
    });
    
    if (matchResult.rows.length > 0 && matchResult.rows[0].email) {
      const userByEmail = await db.execute({
        sql: 'SELECT id FROM users WHERE email = ?',
        args: [matchResult.rows[0].email]
      });
      
      if (userByEmail.rows.length > 0) {
        return userByEmail.rows[0].id as string;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}