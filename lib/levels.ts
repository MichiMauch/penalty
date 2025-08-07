export interface Level {
  id: number;
  name: string;
  icon: string;
  minPoints: number;
  maxPoints: number;
}

export const LEVELS: Level[] = [
  { id: 1, name: 'Stolperer', icon: '🤡', minPoints: 0, maxPoints: 9 },
  { id: 2, name: 'Spieler', icon: '⚽', minPoints: 10, maxPoints: 29 },
  { id: 3, name: 'Profi', icon: '🎯', minPoints: 30, maxPoints: 59 },
  { id: 4, name: 'Experte', icon: '🚀', minPoints: 60, maxPoints: 99 },
  { id: 5, name: 'Hexer', icon: '🧙‍♂️', minPoints: 100, maxPoints: 149 },
  { id: 6, name: 'Meister', icon: '👑', minPoints: 150, maxPoints: 249 },
  { id: 7, name: 'Legende', icon: '💎', minPoints: 250, maxPoints: 399 },
  { id: 8, name: 'Champion', icon: '🏆', minPoints: 400, maxPoints: 599 },
  { id: 9, name: 'Titan', icon: '🔥', minPoints: 600, maxPoints: 999 },
  { id: 10, name: 'GOAT', icon: '🌟', minPoints: 1000, maxPoints: Infinity },
];

export function calculateLevel(points: number): Level {
  return LEVELS.find(level => points >= level.minPoints && points <= level.maxPoints) || LEVELS[0];
}

export function getNextLevel(currentLevel: Level): Level | null {
  const currentIndex = LEVELS.findIndex(level => level.id === currentLevel.id);
  return currentIndex < LEVELS.length - 1 ? LEVELS[currentIndex + 1] : null;
}

export function calculateProgress(points: number, currentLevel: Level): number {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 100; // Max level reached
  
  const pointsInCurrentLevel = points - currentLevel.minPoints;
  const pointsNeededForNextLevel = nextLevel.minPoints - currentLevel.minPoints;
  
  return Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100);
}

export function getPointsToNextLevel(points: number, currentLevel: Level): number {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return 0; // Max level reached
  
  return nextLevel.minPoints - points;
}