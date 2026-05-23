import React from 'react';

interface OnlineStatusProps {
  isOnline: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const OnlineStatus: React.FC<OnlineStatusProps> = ({ isOnline, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`relative ${sizeClasses[size]}`}>
      <div 
        className={`absolute inset-0 rounded-full ${
          isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      />
    </div>
  );
};
