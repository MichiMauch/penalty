'use client';

import { useState, useEffect, useRef } from 'react';
import { AvatarId } from '@/lib/types';

interface DynamicAvatar {
  id: string;
  imageUrl: string;
  color: string;
}

interface AvatarSelectorProps {
  selectedAvatar: AvatarId;
  onSelectAvatar: (avatar: AvatarId) => void;
}

const COLORS = [
  'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500',
  'bg-purple-500', 'bg-orange-500', 'bg-indigo-500', 'bg-pink-500',
  'bg-amber-500', 'bg-cyan-500', 'bg-gray-500', 'bg-yellow-400',
  'bg-violet-500', 'bg-red-600', 'bg-orange-400', 'bg-purple-600'
];

export default function AvatarSelector({ selectedAvatar, onSelectAvatar }: AvatarSelectorProps) {
  const [avatars, setAvatars] = useState<DynamicAvatar[]>([]);
  const [loadingStates, setLoadingStates] = useState<{[key: string]: boolean}>({});
  const [errorStates, setErrorStates] = useState<{[key: string]: boolean}>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const nextAvatarId = useRef(1);

  // Generate avatar URL with DiceBear API
  const generateAvatarUrl = (id: number): string => {
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=avatar${id}`;
  };

  // Generate initial 16 avatars
  const generateAvatars = (startId: number, count: number): DynamicAvatar[] => {
    return Array.from({ length: count }, (_, index) => {
      const id = startId + index;
      return {
        id: `player${id}`,
        imageUrl: generateAvatarUrl(id),
        color: COLORS[(id - 1) % COLORS.length]
      };
    });
  };

  // Load initial avatars
  useEffect(() => {
    const initialAvatars = generateAvatars(1, 16);
    setAvatars(initialAvatars);
    nextAvatarId.current = 17;
  }, []);

  // Load more avatars
  const loadMoreAvatars = () => {
    if (isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Simulate slight delay for smooth UX
    setTimeout(() => {
      const newAvatars = generateAvatars(nextAvatarId.current, 16);
      setAvatars(prev => [...prev, ...newAvatars]);
      nextAvatarId.current += 16;
      setIsLoadingMore(false);
    }, 200);
  };

  // Scroll detection for infinite loading
  const handleScroll = () => {
    if (!sliderRef.current || isLoadingMore) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth;
    
    // Load more when 80% scrolled
    if (scrollPercentage > 0.8) {
      loadMoreAvatars();
    }
  };

  const handleImageLoad = (avatarId: string) => {
    setLoadingStates(prev => ({ ...prev, [avatarId]: false }));
  };

  const handleImageError = (avatarId: string) => {
    setLoadingStates(prev => ({ ...prev, [avatarId]: false }));
    setErrorStates(prev => ({ ...prev, [avatarId]: true }));
  };

  const handleImageStart = (avatarId: string) => {
    setLoadingStates(prev => ({ ...prev, [avatarId]: true }));
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-3">
        Wähle deinen Avatar
      </label>
      <div 
        ref={sliderRef}
        className="avatar-slider"
        onScroll={handleScroll}
      >
        {avatars.map((avatar) => {
          const isLoading = loadingStates[avatar.id];
          const hasError = errorStates[avatar.id];
          
          return (
            <button
              key={avatar.id}
              type="button"
              onClick={() => onSelectAvatar(avatar.id as AvatarId)}
              className={`avatar-option ${
                selectedAvatar === avatar.id ? 'avatar-selected' : ''
              }`}
            >
              <div className={`avatar-image-container ${avatar.color}`}>
                {hasError ? (
                  <div className="avatar-fallback">
                    👤
                  </div>
                ) : (
                  <>
                    {isLoading && (
                      <div className="avatar-loading">
                        <div className="loading-spinner"></div>
                      </div>
                    )}
                    <img
                      src={avatar.imageUrl}
                      alt="Avatar"
                      className="avatar-image"
                      onLoad={() => handleImageLoad(avatar.id)}
                      onError={() => handleImageError(avatar.id)}
                      onLoadStart={() => handleImageStart(avatar.id)}
                      style={{ opacity: isLoading ? 0 : 1 }}
                    />
                  </>
                )}
              </div>
            </button>
          );
        })}
        
        {/* Loading indicator */}
        {isLoadingMore && (
          <div className="avatar-option avatar-loading-more">
            <div className="avatar-image-container bg-gray-500">
              <div className="avatar-loading">
                <div className="loading-spinner"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}