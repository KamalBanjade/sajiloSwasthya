'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface BottomNavProps {
  items: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    href: string;
  }>;
  unreadCount?: number;
}

export const BottomNav = ({ items, unreadCount }: BottomNavProps) => {
  const pathname = usePathname();

  // Find the most specific active item (longest href match)
  const sortedItems = [...items].sort((a, b) => b.href.length - a.href.length);
  const activeItem = sortedItems.find((item) =>
    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-2 md:hidden">
      <div className="mx-auto max-w-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[2rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-around p-2 overflow-x-auto no-scrollbar scroll-smooth">
          {items.map((item) => {
            const isActive = activeItem?.href === item.href;
            const Icon = item.icon;
            const isMessages = item.href === '/messages' || item.href === '/doctor/messages';

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative flex flex-col items-center justify-center min-w-[64px] py-2 transition-all duration-300 ${isActive ? 'text-primary scale-110' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-active"
                    className="absolute inset-0 bg-primary/10 dark:bg-primary/20 rounded-2xl z-0"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <div className="relative z-10 flex items-center justify-center">
                  <Icon className={`w-6 h-6 transition-transform ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  {isMessages && unreadCount !== undefined && unreadCount > 0 && (
                    <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 rounded-full bg-emerald-500 text-white text-[8px] font-black flex items-center justify-center px-0.5 border border-white dark:border-slate-900 shadow-md animate-pulse">
                      {unreadCount}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
