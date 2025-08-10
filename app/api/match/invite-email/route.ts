import { NextRequest, NextResponse } from 'next/server';
import { db, initDB } from '@/lib/db';
import { nanoid } from '@/lib/utils';
import { getUserSession } from '@/lib/auth';
import { sendChallengeEmail } from '@/lib/email';

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
    const { invitedEmail, challengerEmail, challengerUsername, challengerAvatar } = await request.json();
    
    // Validation
    if (!invitedEmail || !challengerEmail || !challengerUsername) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitedEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }
    
    // Ensure user cannot invite themselves
    if (invitedEmail.toLowerCase() === challengerEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 });
    }
    
    // Check if invited user already exists
    const existingUser = await db.execute({
      sql: 'SELECT id FROM users WHERE email = ?',
      args: [invitedEmail.toLowerCase()]
    });
    
    if (existingUser.rows.length > 0) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }
    
    // Generate unique IDs
    const matchId = nanoid();
    const playerAId = nanoid(); // Challenger (existing user)
    const invitationToken = nanoid(); // Unique token for invitation
    
    // Create match with invitation status
    await db.execute({
      sql: `INSERT INTO matches (
        id, 
        player_a, 
        player_a_email, 
        player_a_username, 
        player_a_avatar,
        invited_email,
        invitation_token,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        matchId,
        playerAId,
        challengerEmail,
        challengerUsername,
        challengerAvatar,
        invitedEmail.toLowerCase(),
        invitationToken,
        'invitation_pending'
      ]
    });
    
    // Send invitation email
    if (process.env.RESEND_API_KEY) {
      try {
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const registrationUrl = `${baseUrl}/register?invitation=${invitationToken}&match=${matchId}`;
        
        // Use existing email function but modify for invitation
        const emailResult = await sendInvitationEmail({
          to: invitedEmail,
          challengerEmail: challengerEmail,
          challengerUsername: challengerUsername,
          registrationUrl: registrationUrl,
          matchId: matchId
        });
        
        if (!emailResult.success) {
          console.error('Failed to send invitation email:', emailResult.error);
          // Don't fail the request if email fails, just log it
        }
      } catch (error) {
        console.error('Error sending invitation email:', error);
        // Don't fail the request if email fails
      }
    }
    
    return NextResponse.json({ 
      success: true,
      matchId,
      invitationToken,
      message: 'Invitation sent successfully'
    });
    
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

// Email function for invitations (similar to sendChallengeEmail but for new users)
async function sendInvitationEmail({
  to,
  challengerEmail,
  challengerUsername,
  registrationUrl,
  matchId
}: {
  to: string;
  challengerEmail: string;
  challengerUsername: string;
  registrationUrl: string;
  matchId: string;
}) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'PENALTY <noreply@penalty-game.com>',
      to: [to],
      subject: `🏆 ${challengerUsername} fordert dich zu einem PENALTY-Duell heraus!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 10px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚽ PENALTY Challenge!</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Du wurdest herausgefordert!</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              <strong>${challengerUsername}</strong> (${challengerEmail}) hat dich zu einem spannenden Penalty-Duell herausgefordert!
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Registriere dich jetzt kostenlos und zeige deine Torwart-Fähigkeiten im ultimativen Penalty-Shootout!
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">
              🧤 JETZT REGISTRIEREN & SPIELEN
            </a>
          </div>
          
          <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; margin-top: 20px;">
            <h3 style="color: #059669; margin-top: 0; font-size: 16px;">Wie funktioniert es?</h3>
            <ol style="color: #333; font-size: 14px; line-height: 1.5;">
              <li>Klicke auf den Button oben um dich zu registrieren</li>
              <li>Wähle deinen Avatar und erstelle dein Profil</li>
              <li>Du wirst direkt zum Keeper-Modus weitergeleitet</li>
              <li>Wehre die 5 Penalty-Schüsse ab und gewinne!</li>
            </ol>
          </div>
          
          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px;">
              Match ID: ${matchId}<br>
              Diese Einladung wurde von PENALTY generiert.
            </p>
          </div>
        </div>
      `
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return { success: false, error };
  }
}