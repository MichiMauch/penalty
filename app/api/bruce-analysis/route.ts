import { NextRequest, NextResponse } from 'next/server';
import { SaveDirection, ShotDirection } from '@/lib/types';

interface BruceAnalysisRequest {
  opponentKeepermoves: SaveDirection[];
  opponentShooterMoves: ShotDirection[];
  opponentName: string;
}

export async function POST(request: NextRequest) {
  const body: BruceAnalysisRequest = await request.json();
  const { opponentKeepermoves, opponentShooterMoves, opponentName } = body;

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY) {
    // Fallback to humorous static responses if no API key
    let staticTips = [];
    
    if (opponentKeepermoves.length > 0) {
      // Tips for shooting based on keeper data
      staticTips = [
        `${opponentName} wirft sich meist beim ersten Schuss nach rechts und bleibt beim letzten stehen.`,
        `Ich habe beobachtet: ${opponentName} liebt die linke Ecke, aber bei Druck geht's nach rechts!`,
        `${opponentName} hat eine Schwäche für die Mitte - aber nur bei ungeraden Elfmetern.`,
        `Mein Tipp: ${opponentName} springt fast nie zweimal in dieselbe Ecke hintereinander.`,
        `${opponentName} ist links stark, aber rechts manchmal zu langsam - probier's aus!`
      ];
    } else if (opponentShooterMoves.length > 0) {
      // Tips for keeping based on shooter data
      staticTips = [
        `${opponentName} schießt meist erst links, dann rechts - sei bereit für den Wechsel!`,
        `Ich habe gesehen: ${opponentName} liebt die rechte Ecke, aber wird bei Druck ungenau!`,
        `${opponentName} variiert gerne, aber hat eine Schwäche für die Mitte bei wichtigen Schüssen.`,
        `Mein Beobachtung: ${opponentName} wiederholt selten dieselbe Ecke zweimal hintereinander.`,
        `${opponentName} ist rechts stark, aber links manchmal hastig - geh früh dahin!`
      ];
    } else {
      // No data available - general motivational tips
      staticTips = [
        `Beim ersten Mal ist jeder Gegner ein Mysterium - überrasche ${opponentName} mit dem Unerwarteten!`,
        `Ich kann ${opponentName} noch nicht durchschauen, aber mein Tipp: Vertraue auf dein Bauchgefühl!`,
        `Ohne Daten ist jeder Schuss ein Abenteuer - zeig ${opponentName} was du drauf hast!`,
        `${opponentName} ist neu für mich, aber meine Erfahrung sagt: Die Mitte wird oft unterschätzt!`,
        `Erstes Duell mit ${opponentName}? Perfekt - niemand kennt deine Strategie!`
      ];
    }
    
    const randomTip = staticTips[Math.floor(Math.random() * staticTips.length)];
    
    return NextResponse.json({
      analysis: randomTip,
      confidence: "Bruce's Bauchgefühl",
      source: "fallback"
    });
  }

  try {
    // Determine what data to analyze
    let analysisData = '';
    let prompt = '';
    
    if (opponentKeepermoves.length > 0) {
      // Analyze keeper moves (when user was shooter, now wants to shoot again)
      const keeperPattern = opponentKeepermoves.join(', ');
      const leftCount = opponentKeepermoves.filter(move => move === 'links').length;
      const rightCount = opponentKeepermoves.filter(move => move === 'rechts').length;
      const centerCount = opponentKeepermoves.filter(move => move === 'mitte').length;
      
      analysisData = `Torwart-Bewegungen: ${keeperPattern} (Links: ${leftCount}x, Rechts: ${rightCount}x, Mitte: ${centerCount}x)`;
      
      prompt = `Du bist Bruce, ein witziger Fußball-Experte, der Elfmeter-Strategien analysiert. 
      
Analysiere die Abwehrmuster von Torwart ${opponentName}:
- ${analysisData}

Gib einen kurzen, humorvollen Tipp in EINEM Satz zurück, wie man gegen ${opponentName} am besten schießt. Sei witzig aber hilfreich!

Beispiele:
- "Meistens wirft sich der Gegner beim ersten Schuss nach rechts und beim letzten bleibt er stehen."
- "Ich habe beobachtet: Der Torwart liebt die linke Ecke, aber bei Druck geht's nach rechts!"

Dein Tipp:`;
    } else if (opponentShooterMoves.length > 0) {
      // Analyze shooter moves (when user was keeper, now wants to keep again)
      const shooterPattern = opponentShooterMoves.join(', ');
      const leftCount = opponentShooterMoves.filter(move => move === 'links').length;
      const rightCount = opponentShooterMoves.filter(move => move === 'rechts').length;
      const centerCount = opponentShooterMoves.filter(move => move === 'mitte').length;
      
      analysisData = `Schützen-Muster: ${shooterPattern} (Links: ${leftCount}x, Rechts: ${rightCount}x, Mitte: ${centerCount}x)`;
      
      prompt = `Du bist Bruce, ein witziger Fußball-Experte, der Elfmeter-Strategien analysiert. 
      
Analysiere die Schussmuster von ${opponentName}:
- ${analysisData}

Gib einen kurzen, humorvollen Tipp in EINEM Satz zurück, wie man als Torwart gegen ${opponentName} am besten hält. Sei witzig aber hilfreich!

Beispiele:
- "Der Schütze schießt meist erst links, dann rechts - sei bereit für den Wechsel!"
- "Ich habe gesehen: ${opponentName} liebt die rechte Ecke, aber wird bei Druck ungenau!"

Dein Tipp:`;
    } else {
      // No previous game data available - give general strategy tip
      prompt = `Du bist Bruce, ein witziger Fußball-Experte. Der Spieler fragt dich nach einem strategischen Tipp für Elfmeterschießen gegen ${opponentName}, aber du hast noch keine vorherigen Spielverhalten-Daten.

Gib einen kurzen, humorvollen und motivierenden Tipp in EINEM Satz zurück für das erste Elfmeterschießen. Sei witzig aber hilfreich!

Beispiele:
- "Beim ersten Mal ist jeder Gegner ein Mysterium - überrasche ${opponentName} mit dem Unerwarteten!"
- "Ich kann ${opponentName} noch nicht durchschauen, aber mein Tipp: Vertraue auf dein Bauchgefühl!"
- "Ohne Daten ist jeder Schuss ein Abenteuer - zeig ${opponentName} was du drauf hast!"

Dein motivierender Tipp:`;
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Du bist Bruce, ein humorvoller Fußball-Analytiker. Antworte immer auf Deutsch in einem einzigen, witzigen Satz.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0]?.message?.content?.trim() || 
      `${opponentName} ist unberechenbar - vertraue auf dein Gefühl!`;

    return NextResponse.json({
      analysis,
      confidence: "Bruce's KI-Analyse",
      source: "openai"
    });

  } catch (error) {
    console.error('Bruce analysis error:', error);
    
    // Fallback to static response on error
    let fallbackTips = [];
    
    if (opponentKeepermoves.length > 0) {
      fallbackTips = [
        `${opponentName} wirft sich meist beim ersten Schuss nach rechts und beim letzten bleibt er stehen.`,
        `Mein Gefühl sagt: ${opponentName} hat eine Schwäche für überraschende Schüsse in die Mitte!`,
        `${opponentName} ist stark, aber jeder Torwart hat seine Macken - bleib unberechenbar!`
      ];
    } else if (opponentShooterMoves.length > 0) {
      fallbackTips = [
        `${opponentName} schießt meist vorhersagbar - sei bereit für sein Lieblings-Eck!`,
        `Mein Gefühl sagt: ${opponentName} wird bei Druck unsicher - nutze das aus!`,
        `${opponentName} ist gut, aber jeder Schütze hat seine Gewohnheiten - beobachte genau!`
      ];
    } else {
      fallbackTips = [
        `Ohne Daten ist jeder Gegner ein Abenteuer - zeig ${opponentName} was du drauf hast!`,
        `${opponentName} ist unbekannt, aber mein Tipp: Überrasche mit dem Unerwarteten!`,
        `Erstes Duell? Perfekt - nutze das Element der Überraschung gegen ${opponentName}!`
      ];
    }
    
    const randomTip = fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
    
    return NextResponse.json({
      analysis: randomTip,
      confidence: "Bruce's Notfall-Tipp",
      source: "fallback",
      error: true
    });
  }
}