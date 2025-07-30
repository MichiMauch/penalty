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

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`
        ${sizeClasses[size]} 
        ${avatar?.color || 'bg-gray-500'} 
        rounded-full flex items-center justify-center shadow-md
      `}>
        {avatar?.emoji || '🙂'}
      </div>
      
      {showName && (
        <div className="flex flex-col">
          <span className={`font-semibold text-gray-800 ${textSizes[size]}`}>
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