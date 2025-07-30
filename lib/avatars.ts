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
    emoji: '🏃',
    color: 'bg-red-500'
  },
  {
    id: 'player5',
    name: 'Avatar 5',
    emoji: '🥅',
    color: 'bg-purple-500'
  },
  {
    id: 'player6',
    name: 'Avatar 6',
    emoji: '🎯',
    color: 'bg-indigo-500'
  },
  {
    id: 'player7',
    name: 'Avatar 7',
    emoji: '💪',
    color: 'bg-orange-500'
  },
  {
    id: 'player8',
    name: 'Avatar 8',
    emoji: '🎉',
    color: 'bg-pink-500'
  }
];

export function getAvatarById(id?: AvatarId | string): Avatar | undefined {
  return AVATARS.find(a => a.id === id);
}

export function getAvatar(id?: AvatarId | string): Avatar | undefined {
  return getAvatarById(id);
}

export function getAvatarEmoji(avatarId?: AvatarId | string): string {
  const avatar = getAvatarById(avatarId);
  return avatar?.emoji || '🙂';
}

export function generateRandomAvatars(count: number): Avatar[] {
  const shuffled = [...AVATARS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, AVATARS.length));
}