import { ShotDirection, SaveDirection, GameResult, PlayerMoves, RoundResult } from './types';

export function calculateGoal(shot: ShotDirection, save: SaveDirection): boolean {
  // Tor nur wenn Schütze und Torwart verschiedene Richtungen wählen
  return shot !== save;
}

export function calculateGameResult(movesA: PlayerMoves, movesB: PlayerMoves): GameResult {
  const rounds: RoundResult[] = [];
  let scoreA = 0;
  let scoreB = 0;
  
  // Determine who is shooter and who is keeper
  let shooterMoves: (ShotDirection | SaveDirection)[];
  let keeperMoves: (ShotDirection | SaveDirection)[];
  let shooterPlayer: 'player_a' | 'player_b';
  
  if (movesA.role === 'shooter') {
    shooterMoves = movesA.moves;
    keeperMoves = movesB.moves;
    shooterPlayer = 'player_a';
  } else {
    shooterMoves = movesB.moves;
    keeperMoves = movesA.moves;
    shooterPlayer = 'player_b';
  }
  
  // Calculate 5 penalty rounds: Shooter vs Keeper
  // Punktesystem: Jede Runde gibt einen Punkt - entweder an Schütze (bei Tor) oder Torwart (bei Parade)
  for (let i = 0; i < 5; i++) {
    const goal = calculateGoal(
      shooterMoves[i] as ShotDirection, 
      keeperMoves[i] as SaveDirection
    );
    
    let shooterPoints = 0;
    let keeperPoints = 0;
    
    if (goal) {
      // Tor erzielt - Schütze bekommt Punkt
      shooterPoints = 1;
      if (shooterPlayer === 'player_a') {
        scoreA++;
      } else {
        scoreB++;
      }
    } else {
      // Ball gehalten - Torwart bekommt Punkt  
      keeperPoints = 1;
      if (shooterPlayer === 'player_a') {
        scoreB++; // Player B ist Torwart
      } else {
        scoreA++; // Player A ist Torwart
      }
    }
    
    rounds.push({
      shooterMove: shooterMoves[i] as ShotDirection,
      keeperMove: keeperMoves[i] as SaveDirection,
      goal,
      shooter: shooterPlayer,
      pointsTo: goal ? 'shooter' : 'keeper',
      shooterPoints,
      keeperPoints
    });
  }
  
  let winner: 'player_a' | 'player_b' | 'draw' = 'draw';
  if (scoreA > scoreB) winner = 'player_a';
  else if (scoreB > scoreA) winner = 'player_b';
  
  return {
    rounds,
    winner,
    scoreA,
    scoreB
  };
}