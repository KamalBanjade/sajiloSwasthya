'use client';

import { useEffect } from 'react';

/**
 * ThemeProvider — applies saved dark/light preference to <html> before first paint.
 * Uses an inline script for flash-free initialization (SSR safe).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        // Sync on mount (covers cases where localStorage was written after initial rendering)
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const dark = saved ? saved === 'dark' : prefersDark;
        document.documentElement.classList.toggle('dark', dark);
    }, []);

    return <>{children}</>;
}

/**
 * Inline script snippet to inject into <head> to apply theme before any CSS rendering.
 * This completely eliminates the "white flash" on dark mode reload.
 */
export function ThemeScript() {
    const script = `
        (function() {
            try {
                var saved = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                var dark = saved ? saved === 'dark' : prefersDark;
                if (dark) document.documentElement.classList.add('dark');
            } catch (e) {}
        })();
    `;
    return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
