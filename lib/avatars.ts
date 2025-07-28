import { Avatar, AvatarId } from './types';

export const AVATARS: Avatar[] = [
  {
    id: 'player1',
    name: 'Avatar 1',
    emoji: '⚽',
    color: 'bg-blue-500'
  },
  {
    id: 'player2', 
    name: 'Avatar 2',
    emoji: '👑',
    color: 'bg-yellow-500'
  },
  {
    id: 'player3',
    name: 'Avatar 3',
    emoji: '🧤',
    color: 'bg-green-500'
  },
  {
    id: 'player4',
    name: 'Avatar 4', 
    emoji: '🛡️',
    color: 'bg-red-500'
  },
  {
    id: 'player5',
    name: 'Avatar 5',
    emoji: '⭐',
    color: 'bg-purple-500'
  },
  {
    id: 'player6',
    name: 'Avatar 6',
    emoji: '🚀',
    color: 'bg-orange-500'
  },
  {
    id: 'player7',
    name: 'Avatar 7',
    emoji: '🎯',
    color: 'bg-indigo-500'
  },
  {
    id: 'player8',
    name: 'Avatar 8',
    emoji: '🎉',
    color: 'bg-pink-500'
  },
  {
    id: 'player9',
    name: 'Avatar 9',
    emoji: '🏆',
    color: 'bg-amber-500'
  },
  {
    id: 'player10',
    name: 'Avatar 10',
    emoji: '🌟',
    color: 'bg-cyan-500'
  },
  {
    id: 'player11',
    name: 'Avatar 11',
    emoji: '🎖️',
    color: 'bg-gray-500'
  },
  {
    id: 'player12',
    name: 'Avatar 12',
    emoji: '⚡',
    color: 'bg-yellow-400'
  },
  {
    id: 'player13',
    name: 'Avatar 13',
    emoji: '🎨',
    color: 'bg-violet-500'
  },
  {
    id: 'player14',
    name: 'Avatar 14',
    emoji: '⚔️',
    color: 'bg-red-600'
  },
  {
    id: 'player15',
    name: 'Avatar 15',
    emoji: '🥇',
    color: 'bg-orange-400'
  },
  {
    id: 'player16',
    name: 'Avatar 16',
    emoji: '🔮',
    color: 'bg-purple-600'
  }
];

// Generate DiceBear avatar URL
export function getAvatarImageUrl(avatarId: AvatarId): string {
  const avatarNumber = avatarId.replace('player', '');
  return `https://api.dicebear.com/7.x/adventurer/svg?seed=avatar${avatarNumber}`;
}

export function getAvatar(id: AvatarId): Avatar {
  const avatar = AVATARS.find(a => a.id === id);
  if (!avatar) {
    return AVATARS[0]; // Fallback to first avatar
  }
  return avatar;
}

export function getRandomAvatar(): Avatar {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}