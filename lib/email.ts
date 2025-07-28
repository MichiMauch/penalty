import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendChallengeEmailParams {
  to: string;
  challengerEmail: string;
  matchId: string;
}

export async function sendChallengeEmail({
  to,
  challengerEmail,
  matchId
}: SendChallengeEmailParams) {
  if (!resend) {
    console.warn('Resend not configured - email will not be sent');
    return { success: false, error: 'Email service not configured' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const gameUrl = `${appUrl}/challenge?match=${matchId}`;
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'Fußballpause <michi@kokomo.house>',
      to: [to],
      subject: `${challengerEmail} fordert dich zum Elfmeterschießen heraus! ⚽`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fußballpause Elfmeter-Herausforderung</title>
            <style>
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background-color: #f3f4f6;
              }
              .container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
              }
              .header {
                background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
                color: white;
                padding: 40px 20px;
                text-align: center;
              }
              .header h1 {
                margin: 0;
                font-size: 36px;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
              }
              .content {
                padding: 40px 20px;
                text-align: center;
              }
              .challenge-box {
                background-color: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
              }
              .challenge-box h2 {
                color: #d97706;
                margin: 0 0 10px 0;
                font-size: 24px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                color: white;
                text-decoration: none;
                padding: 16px 48px;
                border-radius: 8px;
                font-size: 20px;
                font-weight: bold;
                margin: 30px 0;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                transition: transform 0.2s;
              }
              .button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
              }
              .rules {
                background-color: #e0e7ff;
                border-radius: 8px;
                padding: 20px;
                margin: 30px 0;
                text-align: left;
              }
              .rules h3 {
                color: #4338ca;
                margin: 0 0 15px 0;
              }
              .rule-item {
                display: flex;
                align-items: center;
                margin: 10px 0;
                font-size: 14px;
              }
              .rule-icon {
                font-size: 20px;
                margin-right: 10px;
                min-width: 30px;
              }
              .footer {
                background-color: #f3f4f6;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
              }
              .link-fallback {
                word-break: break-all;
                color: #6366f1;
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
                <h1>⚽ FUßBALLPAUSE ⚽</h1>
              </div>
              
              <div class="content">
                <div class="challenge-box">
                  <h2>⚽ Du wurdest zum Elfmeterschießen herausgefordert! ⚽</h2>
                  <p style="font-size: 18px; margin: 10px 0;">
                    <strong>${challengerEmail}</strong> wartet auf dich!
                  </p>
                </div>
                
                <p style="font-size: 16px; color: #4b5563; margin: 20px 0;">
                  Zeig dein Können beim Elfmeterschießen!<br>
                  Wähle deine Schüsse und Paraden strategisch.
                </p>
                
                <a href="${gameUrl}" class="button">
                  ELFMETERSCHIESSEN ANNEHMEN! ⚽
                </a>
                
                <div class="rules">
                  <h3>⚽ So funktioniert's:</h3>
                  <div class="rule-item">
                    <span class="rule-icon">1️⃣</span>
                    <span>Als Schütze: Wähle 5 Schussrichtungen strategisch</span>
                  </div>
                  <div class="rule-item">
                    <span class="rule-icon">2️⃣</span>
                    <span>Als Torwart: Wähle 5 Sprungrichtungen zum Halten</span>
                  </div>
                  <div class="rule-item">
                    <span class="rule-icon">3️⃣</span>
                    <span>Erfolgreich halten durch richtige Sprungrichtung:</span>
                  </div>
                  <div class="rule-item" style="margin-left: 40px;">
                    <span class="rule-icon">⬅️</span>
                    <span>Links geschossen → ⬅️ Links springen</span>
                  </div>
                  <div class="rule-item" style="margin-left: 40px;">
                    <span class="rule-icon">🎯</span>
                    <span>Mitte geschossen → 🎯 Mitte bleiben</span>
                  </div>
                  <div class="rule-item" style="margin-left: 40px;">
                    <span class="rule-icon">➡️</span>
                    <span>Rechts geschossen → ➡️ Rechts springen</span>
                  </div>
                  <div class="rule-item">
                    <span class="rule-icon">🏆</span>
                    <span>Punkte für erfolgreiche Tore und Paraden!</span>
                  </div>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                  Falls der Button nicht funktioniert, kopiere diesen Link:<br>
                  <a href="${gameUrl}" class="link-fallback">${gameUrl}</a>
                </p>
              </div>
              
              <div class="footer">
                <p>
                  Du erhältst diese Email, weil dich jemand zu Fußballpause herausgefordert hat.<br>
                  Fußballpause - Das Elfmeterschießen-Spiel ⚽
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
${challengerEmail} fordert dich zum Elfmeterschießen heraus!

Nimm die Herausforderung an: ${gameUrl}

So funktioniert's:
1. Als Schütze: Wähle 5 Schussrichtungen strategisch
2. Als Torwart: Wähle 5 Sprungrichtungen zum Halten
3. Erfolgreich halten durch richtige Sprungrichtung:
   - Links geschossen → Links springen
   - Mitte geschossen → Mitte bleiben
   - Rechts geschossen → Rechts springen
4. Punkte für erfolgreiche Tore und Paraden!

Viel Erfolg beim Elfmeterschießen!
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