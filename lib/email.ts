import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendChallengeEmailParams {
  to: string;
  challengerEmail: string;
  challengerUsername: string;
  matchId: string;
}

export async function sendChallengeEmail({
  to,
  challengerEmail,
  challengerUsername,
  matchId
}: SendChallengeEmailParams) {
  if (!resend) {
    console.warn('Resend not configured - email will not be sent');
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://penalty.mauch.ai';
  const gameUrl = `${appUrl}/challenge?match=${matchId}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Penalty <michi@kokomo.house>',
      to: [to],
      subject: `${challengerUsername} fordert dich heraus! ⚽`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Penalty Herausforderung</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: radial-gradient(ellipse at top, #065f46, #064e3b, #0a0a0a);
                min-height: 100vh;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(22, 101, 52, 0.95);
                border-radius: 16px;
                overflow: hidden;
                border: 2px solid #10b981;
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
              }
              .header {
                background: linear-gradient(135deg, #059669, #10b981);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-bottom: 2px solid #10b981;
              }
              .header h1 {
                margin: 0;
                font-size: 36px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                letter-spacing: 2px;
              }
              .content {
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .challenge-box {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #10b981;
                border-radius: 16px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
              }
              .challenge-box h2 {
                color: #10b981;
                margin: 0 0 15px 0;
                font-size: 26px;
                font-weight: bold;
              }
              .challenge-text {
                color: white;
                font-size: 18px;
                margin: 15px 0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                text-decoration: none;
                padding: 20px 50px;
                border-radius: 12px;
                font-size: 22px;
                font-weight: bold;
                margin: 30px 0;
                border: 2px solid #10b981;
                box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
                background: linear-gradient(135deg, #059669, #047857);
              }
              .footer {
                background: rgba(0, 0, 0, 0.8);
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid #10b981;
              }
              .link-fallback {
                word-break: break-all;
                color: #10b981;
                text-decoration: underline;
                font-size: 14px;
              }
              @media only screen and (max-width: 600px) {
                .header h1 {
                  font-size: 28px;
                }
                .button {
                  padding: 14px 36px;
                  font-size: 18px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚽ PENALTY ⚽</h1>
              </div>
              
              <div class="content">
                <div class="challenge-box">
                  <h2>⚽ Neue Herausforderung! ⚽</h2>
                  <p class="challenge-text">
                    <strong>${challengerUsername}</strong> wartet auf dich!
                  </p>
                  <p class="challenge-text">
                    Zeig dein Können beim Elfmeterschießen!
                  </p>
                </div>
                
                <a href="${gameUrl}" class="button">
                  Herausforderung annehmen ⚽
                </a>
                
                <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <a href="${gameUrl}" class="link-fallback">${gameUrl}</a>
                </p>
              </div>
              
              <div class="footer">
                <p>
                  Du erhältst diese Email, weil dich jemand zu Penalty herausgefordert hat.<br>
                  Penalty - Das Elfmeterschießen-Spiel ⚽
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${challengerUsername} fordert dich heraus!

Nimm die Herausforderung an: ${gameUrl}

Zeig dein Können beim Elfmeterschießen!

Penalty - Das Elfmeterschießen-Spiel ⚽
      `
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

interface SendPasswordResetEmailParams {
  to: string;
  resetToken: string;
  username: string;
}

export async function sendPasswordResetEmail({
  to,
  resetToken,
  username
}: SendPasswordResetEmailParams) {
  if (!resend) {
    console.warn('Resend not configured - password reset email will not be sent');
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://penalty.mauch.ai';
  const resetUrl = `${appUrl}/reset-password/${resetToken}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Penalty <michi@kokomo.house>',
      to: [to],
      subject: 'Passwort zurücksetzen - Penalty ⚽',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Passwort zurücksetzen</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: radial-gradient(ellipse at top, #065f46, #064e3b, #0a0a0a);
                min-height: 100vh;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(22, 101, 52, 0.95);
                border-radius: 16px;
                overflow: hidden;
                border: 2px solid #ef4444;
                box-shadow: 0 0 30px rgba(239, 68, 68, 0.3);
              }
              .header {
                background: linear-gradient(135deg, #dc2626, #ef4444);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-bottom: 2px solid #ef4444;
              }
              .header h1 {
                margin: 0;
                font-size: 32px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                letter-spacing: 2px;
              }
              .content {
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .reset-box {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #ef4444;
                border-radius: 16px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
              }
              .reset-box h2 {
                color: #ef4444;
                margin: 0 0 15px 0;
                font-size: 24px;
                font-weight: bold;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                text-decoration: none;
                padding: 20px 50px;
                border-radius: 12px;
                font-size: 20px;
                font-weight: bold;
                margin: 30px 0;
                border: 2px solid #ef4444;
                box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6);
                background: linear-gradient(135deg, #dc2626, #b91c1c);
              }
              .warning {
                background: rgba(0, 0, 0, 0.6);
                border: 2px solid #f59e0b;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                color: #fbbf24;
                font-size: 14px;
              }
              .footer {
                background: rgba(0, 0, 0, 0.8);
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid #ef4444;
              }
              .link-fallback {
                word-break: break-all;
                color: #10b981;
                text-decoration: underline;
                font-size: 14px;
              }
              @media only screen and (max-width: 600px) {
                .header h1 {
                  font-size: 24px;
                }
                .button {
                  padding: 14px 36px;
                  font-size: 16px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🔒 PENALTY</h1>
              </div>
              
              <div class="content">
                <div class="reset-box">
                  <h2>🔐 Passwort-Reset angefordert</h2>
                  <p style="font-size: 16px; margin: 10px 0;">
                    Hallo <strong>${username}</strong>!
                  </p>
                </div>
                
                <p style="font-size: 16px; color: white; margin: 20px 0;">
                  Du hast eine Passwort-Zurücksetzung für deinen Penalty Account angefordert.<br>
                  Klicke auf den Button unten, um ein neues Passwort zu setzen.
                </p>
                
                <a href="${resetUrl}" class="button">
                  🔑 NEUES PASSWORT SETZEN
                </a>
                
                <div class="warning">
                  <strong>⚠️ Wichtige Sicherheitshinweise:</strong><br>
                  • Dieser Link ist nur 15 Minuten gültig<br>
                  • Der Link kann nur einmal verwendet werden<br>
                  • Falls du kein neues Passwort angefordert hast, ignoriere diese Email
                </div>
                
                <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <a href="${resetUrl}" class="link-fallback">${resetUrl}</a>
                </p>
              </div>
              
              <div class="footer">
                <p>
                  Diese Email wurde automatisch generiert.<br>
                  Penalty - Das Elfmeterschießen-Spiel ⚽
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Passwort zurücksetzen - Penalty

Hallo ${username}!

Du hast eine Passwort-Zurücksetzung für deinen Penalty Account angefordert.
Besuche den folgenden Link, um ein neues Passwort zu setzen:

${resetUrl}

WICHTIGE SICHERHEITSHINWEISE:
- Dieser Link ist nur 15 Minuten gültig
- Der Link kann nur einmal verwendet werden
- Falls du kein neues Passwort angefordert hast, ignoriere diese Email

Penalty Team
      `
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Password reset email service error:', error);
    return { success: false, error };
  }
}

interface SendMatchCompletedEmailParams {
  to: string;
  opponentUsername: string;
  matchId: string;
  userWon: boolean; // true if the email recipient won, false if they lost
}

export async function sendMatchCompletedEmail({
  to,
  opponentUsername,
  matchId,
  userWon
}: SendMatchCompletedEmailParams) {
  if (!resend) {
    console.warn('Resend not configured - match completed email will not be sent');
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://penalty.mauch.ai';
  const resultUrl = `${appUrl}/game/${matchId}`;
  const resultText = userWon ? 'Gewonnen! 🎉' : 'Verloren 😔';
  const resultColor = userWon ? '#10b981' : '#ef4444';
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Penalty <michi@kokomo.house>',
      to: [to],
      subject: `Match beendet - ${resultText} ⚽`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Match beendet - Penalty</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: radial-gradient(ellipse at top, #065f46, #064e3b, #0a0a0a);
                min-height: 100vh;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: rgba(22, 101, 52, 0.95);
                border-radius: 16px;
                overflow: hidden;
                border: 2px solid ${resultColor};
                box-shadow: 0 0 30px rgba(16, 185, 129, 0.3);
              }
              .header {
                background: linear-gradient(135deg, #059669, #10b981);
                color: white;
                padding: 40px 20px;
                text-align: center;
                border-bottom: 2px solid ${resultColor};
              }
              .header h1 {
                margin: 0;
                font-size: 36px;
                font-weight: bold;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
                letter-spacing: 2px;
              }
              .content {
                padding: 40px 20px;
                text-align: center;
                color: white;
              }
              .result-box {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid ${resultColor};
                border-radius: 16px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
              }
              .result-box h2 {
                color: ${resultColor};
                margin: 0 0 15px 0;
                font-size: 26px;
                font-weight: bold;
              }
              .result-text {
                color: white;
                font-size: 18px;
                margin: 15px 0;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, ${resultColor}, ${userWon ? '#059669' : '#dc2626'});
                color: white;
                text-decoration: none;
                padding: 20px 50px;
                border-radius: 12px;
                font-size: 22px;
                font-weight: bold;
                margin: 30px 0;
                border: 2px solid ${resultColor};
                box-shadow: 0 6px 20px rgba(${userWon ? '16, 185, 129' : '239, 68, 68'}, 0.4);
                transition: all 0.3s ease;
                text-transform: uppercase;
                letter-spacing: 1px;
              }
              .button:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 25px rgba(${userWon ? '16, 185, 129' : '239, 68, 68'}, 0.6);
                background: linear-gradient(135deg, ${userWon ? '#059669' : '#dc2626'}, ${userWon ? '#047857' : '#b91c1c'});
              }
              .footer {
                background: rgba(0, 0, 0, 0.8);
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #9ca3af;
                border-top: 1px solid ${resultColor};
              }
              .link-fallback {
                word-break: break-all;
                color: ${resultColor};
                text-decoration: underline;
                font-size: 14px;
              }
              @media only screen and (max-width: 600px) {
                .header h1 {
                  font-size: 28px;
                }
                .button {
                  padding: 18px 40px;
                  font-size: 20px;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚽ PENALTY ⚽</h1>
              </div>
              
              <div class="content">
                <div class="result-box">
                  <h2>${resultText}</h2>
                  <p class="result-text">
                    Das Match gegen <strong>${opponentUsername}</strong> ist beendet!
                  </p>
                  <p class="result-text">
                    Schau dir das komplette Ergebnis und die Spielzüge an.
                  </p>
                </div>
                
                <a href="${resultUrl}" class="button">
                  Ergebnis anschauen ⚽
                </a>
                
                <p style="font-size: 14px; color: #9ca3af; margin-top: 30px;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <a href="${resultUrl}" class="link-fallback">${resultUrl}</a>
                </p>
              </div>
              
              <div class="footer">
                <p>
                  Das Match wurde soeben beendet.<br>
                  Penalty - Das Elfmeterschießen-Spiel ⚽
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Match beendet - ${resultText}

Das Match gegen ${opponentUsername} ist beendet!

Schau dir das Ergebnis an: ${resultUrl}

Penalty - Das Elfmeterschießen-Spiel ⚽
      `
    });

    if (error) {
      console.error('Failed to send match completed email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Match completed email service error:', error);
    return { success: false, error };
  }
}