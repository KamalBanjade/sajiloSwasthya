import React from 'react';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string;
  gender?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  gender,
  name,
  size = 'md',
  className = ''
}) => {
  // Base default size mappings
  const sizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-14 h-14 rounded-2xl text-xl',
    xl: 'w-20 h-20 sm:w-24 sm:h-24 rounded-[2rem] sm:rounded-3xl text-3xl'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7',
    xl: 'w-10 h-10'
  };

  if (src) {
    return (
      <div className={`relative shrink-0 overflow-hidden shadow-md ${sizeClasses[size]} ${className}`}>
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Get gender-specific background gradient
  const g = (gender || '').trim().toLowerCase();
  let bgGradient = 'from-slate-400 to-indigo-600'; // Default Neutral/Other
  if (g === 'male' || g === 'm') {
    bgGradient = 'from-sky-400 to-blue-600';
  } else if (g === 'female' || g === 'f') {
    bgGradient = 'from-pink-400 to-rose-500';
  }

  return (
    <div
      className={`relative shrink-0 flex items-center justify-center text-white bg-gradient-to-br shadow-md overflow-hidden ${bgGradient} ${sizeClasses[size]} ${className}`}
    >
      <User className={`${iconSizes[size]} text-white/90 stroke-[2.5]`} />
    </div>
  );
};
