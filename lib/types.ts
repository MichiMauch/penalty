export type ShotDirection = 'links' | 'mitte' | 'rechts';
export type SaveDirection = 'links' | 'mitte' | 'rechts';
export type Move = ShotDirection | SaveDirection;

// Avatar types
export type AvatarId = string; // Allow any playerX format

// User and Authentication types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar: AvatarId;
  created_at: string;
  updated_at: string;
  is_admin?: boolean;
}

export interface UserSession {
  id: string;
  user: User;
  expires_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  avatar: AvatarId;
}

export interface Avatar {
  id: AvatarId;
  name: string;
  emoji: string;
  color: string;
}

export interface PlayerMoves {
  moves: (ShotDirection | SaveDirection)[];
  role: 'shooter' | 'keeper';
}

export interface Match {
  id: string;
  player_a: string | null;
  player_b: string | null;
  player_a_email: string | null;
  player_b_email: string | null;
  player_a_username: string | null;
  player_b_username: string | null;
  player_a_avatar: AvatarId | null;
  player_b_avatar: AvatarId | null;
  player_a_moves: PlayerMoves | null;
  player_b_moves: PlayerMoves | null;
  status: 'waiting' | 'ready' | 'finished';
  winner: string | null;
  created_at: string;
}

export interface GameResult {
  rounds: RoundResult[];
  winner: 'player_a' | 'player_b' | 'draw';
  scoreA: number;
  scoreB: number;
}

export interface RoundResult {
  shooterMove: ShotDirection;
  keeperMove: SaveDirection;
  goal: boolean;
  shooter: 'player_a' | 'player_b';
  pointsTo: 'shooter' | 'keeper'; // Wer bekommt den Punkt
  shooterPoints: number; // Punkte durch erfolgreiche Tore
  keeperPoints: number; // Punkte durch erfolgreiche Paraden
}