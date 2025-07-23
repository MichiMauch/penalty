import { Avatar, AvatarId } from './types';

export const AVATARS: Avatar[] = [
  {
    id: 'player1',
    name: 'Torjäger',
    emoji: '⚽',
    color: 'bg-blue-500'
  },
  {
    id: 'player2', 
    name: 'Kapitän',
    emoji: '👑',
    color: 'bg-yellow-500'
  },
  {
    id: 'player3',
    name: 'Torwart',
    emoji: '🧤',
    color: 'bg-green-500'
  },
  {
    id: 'player4',
    name: 'Verteidiger', 
    emoji: '🛡️',
    color: 'bg-red-500'
  },
  {
    id: 'player5',
    name: 'Mittelfeld',
    emoji: '⭐',
    color: 'bg-purple-500'
  },
  {
    id: 'player6',
    name: 'Stürmer',
    emoji: '🚀',
    color: 'bg-orange-500'
  },
  {
    id: 'player7',
    name: 'Trainer',
    emoji: '🎯',
    color: 'bg-indigo-500'
  },
  {
    id: 'player8',
    name: 'Fan',
    emoji: '🎉',
    color: 'bg-pink-500'
  }
];

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