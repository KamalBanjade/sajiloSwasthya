'use client';

import React, { useState, useEffect } from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

export const ThemeToggle = () => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initial sync
        const isCurrentlyDark = document.documentElement.classList.contains('dark');
        setIsDark(isCurrentlyDark);

        // Observer to sync if changed elsewhere
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    setIsDark(document.documentElement.classList.contains('dark'));
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    const toggleDark = () => {
        const next = !isDark;
        setIsDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleDark}
            className="relative w-[52px] h-[28px] rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 flex-shrink-0"
            style={{
                background: isDark
                    ? 'linear-gradient(135deg, #1e3a5f, #2d4a7a)'
                    : 'linear-gradient(135deg, #fde68a, #fbbf24)',
                boxShadow: isDark
                    ? '0 0 12px rgba(59,130,246,0.4), inset 0 1px 2px rgba(0,0,0,0.3)'
                    : '0 0 12px rgba(251,191,36,0.5), inset 0 1px 2px rgba(0,0,0,0.1)'
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {/* Track icons */}
            <span className="absolute inset-0 flex items-center justify-between px-[5px] pointer-events-none">
                <SunIcon className="w-[13px] h-[13px] text-amber-900/60" />
                <MoonIcon className="w-[12px] h-[12px] text-blue-200/80" />
            </span>
            {/* Thumb */}
            <span
                className="absolute top-[3px] w-[22px] h-[22px] rounded-full shadow-md transition-all duration-300 flex items-center justify-center"
                style={{
                    left: isDark ? 'calc(100% - 25px)' : '3px',
                    background: isDark ? '#0f172a' : '#ffffff',
                }}
            >
                {isDark
                    ? <MoonIcon className="w-3 h-3 text-blue-300" />
                    : <SunIcon className="w-3 h-3 text-amber-500" />
                }
            </span>
        </button>
    );
};
