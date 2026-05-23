'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'glass';
}

export function Skeleton({ className = '', variant = 'default' }: SkeletonProps) {
  if (variant === 'glass') {
    return (
      <div 
        className={`relative overflow-hidden bg-white/20 dark:bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl ${className}`}
      >
        <motion.div
          animate={{
            x: ['-100%', '100%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden bg-slate-200/50 dark:bg-slate-800/40 rounded-xl ${className}`}
    >
      <motion.div
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent shadow-[0_0_20px_rgba(255,255,255,0.05)]"
      />
    </div>
  );
}
