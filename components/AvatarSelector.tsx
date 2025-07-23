'use client';

import { useState } from 'react';
import { Avatar, AvatarId } from '@/lib/types';
import { AVATARS } from '@/lib/avatars';

interface AvatarSelectorProps {
  selectedAvatar: AvatarId;
  onSelectAvatar: (avatar: AvatarId) => void;
}

export default function AvatarSelector({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Wähle deinen Avatar
      </label>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((avatar) => (
          <button
            key={avatar.id}
            type="button"
            onClick={() => onSelectAvatar(avatar.id)}
            className={`
              flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200
              ${selectedAvatar === avatar.id
                ? 'border-blue-500 bg-blue-50 shadow-md transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }
            `}
          >
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-1
              ${avatar.color}
            `}>
              {avatar.emoji}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center">
              {avatar.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}