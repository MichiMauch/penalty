'use client';

interface AchievementBadgeProps {
  name: string;
  icon: string;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  isActive?: boolean;
  onClick?: () => void;
}

export default function AchievementBadge({ 
  name, 
  icon, 
  size = 'md', 
  showName = true,
  isActive = false,
  onClick 
}: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-xl',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div 
      className={`inline-flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`
        ${sizeClasses[size]} 
        rounded-full flex items-center justify-center
        ${isActive 
          ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg ring-4 ring-yellow-300/50' 
          : 'bg-gradient-to-br from-gray-200 to-gray-300'
        }
        ${onClick ? 'hover:scale-110 transition-transform duration-200' : ''}
      `}>
        <span className={isActive ? 'filter drop-shadow-md' : 'opacity-80'}>
          {icon}
        </span>
      </div>
      {showName && (
        <span className={`
          ${textSizeClasses[size]} 
          font-semibold
          ${isActive ? 'text-gray-800' : 'text-gray-600'}
        `}>
          {name}
        </span>
      )}
    </div>
  );
}