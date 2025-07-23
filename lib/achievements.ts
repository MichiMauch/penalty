export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'goalkeeper' | 'shooter' | 'general' | 'special';
  requirement_type: string;
  requirement_value: number;
  points_reward: number;
  sort_order: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Goalkeeper Achievements
  {
    id: 'goalkeeper-beginner',
    name: 'Handschuhe',
    description: '10 Bälle gehalten',
    icon: '🧤',
    category: 'goalkeeper',
    requirement_type: 'saves_made',
    requirement_value: 10,
    points_reward: 50,
    sort_order: 1
  },
  {
    id: 'goalkeeper-intermediate',
    name: 'Mauer',
    description: '50 Bälle gehalten',
    icon: '🛡️',
    category: 'goalkeeper',
    requirement_type: 'saves_made',
    requirement_value: 50,
    points_reward: 200,
    sort_order: 2
  },
  {
    id: 'goalkeeper-advanced',
    name: 'Hexer',
    description: '100 Bälle gehalten',
    icon: '🧙‍♂️',
    category: 'goalkeeper',
    requirement_type: 'saves_made',
    requirement_value: 100,
    points_reward: 500,
    sort_order: 3
  },
  {
    id: 'goalkeeper-expert',
    name: 'Penalty-Killer',
    description: '200 Bälle gehalten',
    icon: '💀',
    category: 'goalkeeper',
    requirement_type: 'saves_made',
    requirement_value: 200,
    points_reward: 1000,
    sort_order: 4
  },
  {
    id: 'goalkeeper-legend',
    name: 'Torwart-Legende',
    description: '500 Bälle gehalten',
    icon: '🏆',
    category: 'goalkeeper',
    requirement_type: 'saves_made',
    requirement_value: 500,
    points_reward: 2500,
    sort_order: 5
  },

  // Shooter Achievements
  {
    id: 'shooter-beginner',
    name: 'Torjäger',
    description: '10 Tore geschossen',
    icon: '⚽',
    category: 'shooter',
    requirement_type: 'goals_scored',
    requirement_value: 10,
    points_reward: 50,
    sort_order: 11
  },
  {
    id: 'shooter-intermediate',
    name: 'Scharfschütze',
    description: '50 Tore geschossen',
    icon: '🎯',
    category: 'shooter',
    requirement_type: 'goals_scored',
    requirement_value: 50,
    points_reward: 200,
    sort_order: 12
  },
  {
    id: 'shooter-advanced',
    name: 'Rakete',
    description: '100 Tore geschossen',
    icon: '🚀',
    category: 'shooter',
    requirement_type: 'goals_scored',
    requirement_value: 100,
    points_reward: 500,
    sort_order: 13
  },
  {
    id: 'shooter-expert',
    name: 'Blitz',
    description: '200 Tore geschossen',
    icon: '⚡',
    category: 'shooter',
    requirement_type: 'goals_scored',
    requirement_value: 200,
    points_reward: 1000,
    sort_order: 14
  },
  {
    id: 'shooter-legend',
    name: 'Elfmeter-König',
    description: '500 Tore geschossen',
    icon: '👑',
    category: 'shooter',
    requirement_type: 'goals_scored',
    requirement_value: 500,
    points_reward: 2500,
    sort_order: 15
  },

  // General Achievements
  {
    id: 'streak-5',
    name: 'Heißer Schuh',
    description: '5 Siege in Folge',
    icon: '🔥',
    category: 'general',
    requirement_type: 'best_streak',
    requirement_value: 5,
    points_reward: 300,
    sort_order: 21
  },
  {
    id: 'veteran',
    name: 'Veteran',
    description: '100 Spiele gespielt',
    icon: '🏅',
    category: 'general',
    requirement_type: 'games_played',
    requirement_value: 100,
    points_reward: 400,
    sort_order: 22
  },
  {
    id: 'elite',
    name: 'Elite',
    description: '1000 Punkte erreicht',
    icon: '💎',
    category: 'general',
    requirement_type: 'total_points',
    requirement_value: 1000,
    points_reward: 0,
    sort_order: 23
  },
  {
    id: 'allrounder',
    name: 'Allrounder',
    description: 'Je 50 Tore und Paraden',
    icon: '🎪',
    category: 'general',
    requirement_type: 'allrounder',
    requirement_value: 50,
    points_reward: 600,
    sort_order: 24
  },
  {
    id: 'winner-50',
    name: 'Siegertyp',
    description: '50 Spiele gewonnen',
    icon: '🥇',
    category: 'general',
    requirement_type: 'games_won',
    requirement_value: 50,
    points_reward: 800,
    sort_order: 25
  },

  // Special Achievements
  {
    id: 'perfectionist',
    name: 'Perfektionist',
    description: '3 perfekte Spiele (5/5)',
    icon: '🎩',
    category: 'special',
    requirement_type: 'perfect_games',
    requirement_value: 3,
    points_reward: 1000,
    sort_order: 31
  },
  {
    id: 'oracle',
    name: 'Wahrsager',
    description: '5/5 als Torwart in einem Spiel',
    icon: '🔮',
    category: 'special',
    requirement_type: 'special_oracle',
    requirement_value: 1,
    points_reward: 500,
    sort_order: 32
  },
  {
    id: 'lucky',
    name: 'Glückspilz',
    description: '10 Siege mit 1 Punkt Unterschied',
    icon: '🎰',
    category: 'special',
    requirement_type: 'special_lucky',
    requirement_value: 10,
    points_reward: 400,
    sort_order: 33
  },
  {
    id: 'starter',
    name: 'Neuling',
    description: 'Erstes Spiel absolviert',
    icon: '🌟',
    category: 'special',
    requirement_type: 'games_played',
    requirement_value: 1,
    points_reward: 10,
    sort_order: 34
  }
];

export function getAchievementById(id: string): Achievement | undefined {
  return ACHIEVEMENTS.find(a => a.id === id);
}

export function getAchievementsByCategory(category: Achievement['category']): Achievement[] {
  return ACHIEVEMENTS.filter(a => a.category === category).sort((a, b) => a.sort_order - b.sort_order);
}