'use client';

import { User } from '@/lib/types';
import { getAvatar } from '@/lib/avatars';

interface UserAvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showName?: boolean;
  className?: string;
}

export default function UserAvatar({ user, size = 'md', showName = false, className = '' }: UserAvatarProps) {
  const avatar = getAvatar(user.avatar);
  const isDynamicAvatar = user.avatar && user.avatar.match(/^player\d+$/);
  
  const sizeClasses = {
    sm: 'w-8 h-8 text-lg',
    md: 'w-12 h-12 text-2xl',
    lg: 'w-16 h-16 text-3xl',
    xl: 'w-20 h-20 text-4xl'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  // Generate DiceBear URL for dynamic avatars
  const generateAvatarUrl = (avatarId: string): string => {
    const match = avatarId.match(/^player(\d+)$/);
    if (match) {
      const number = match[1];
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=avatar${number}`;
    }
    return '';
  };

  const imageSizes = {
    sm: '32',
    md: '48',
    lg: '64',
    xl: '80'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {isDynamicAvatar ? (
        <div className={`${sizeClasses[size]} rounded-full overflow-hidden shadow-md bg-gray-200`}>
          <img 
            src={generateAvatarUrl(user.avatar)}
            alt={user.username}
            className="w-full h-full object-cover"
            width={imageSizes[size]}
            height={imageSizes[size]}
          />
        </div>
      ) : (
        <div className={`
          ${sizeClasses[size]} 
          ${avatar?.color || 'bg-gray-500'} 
          rounded-full flex items-center justify-center shadow-md
        `}>
          {avatar?.emoji || '👤'}
        </div>
      )}
      
      {showName && (
        <div className="flex flex-col">
          <span className={`font-semibold text-white ${textSizes[size]}`}>
            {user.username}
          </span>
          {size !== 'sm' && avatar && (
            <span className="text-xs text-gray-500">
              {avatar.name}
            </span>
          )}
        </div>
      )}
    </div>
  );
}