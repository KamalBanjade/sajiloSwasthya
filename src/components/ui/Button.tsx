import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'action' | 'luxury' | 'glass';
    size?: 'sm' | 'md' | 'lg' | 'compact' | 'xl' | 'h-14';
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95';

        const variants = {
            primary: 'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary/50 shadow-md hover:shadow-lg',
            secondary: 'bg-secondary text-secondary-foreground hover:opacity-90 focus:ring-secondary/50 shadow-md hover:shadow-lg',
            outline: 'border-2 border-slate-200 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-slate-500',
            danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-md',
            ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 focus:ring-slate-500',
            action: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold justify-center gap-1.5',
            luxury: 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black shadow-xl shadow-indigo-600/20 dark:shadow-none hover:brightness-110',
            glass: 'bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200/50 dark:border-slate-800/50 text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800/60 shadow-lg shadow-slate-200/20 dark:shadow-black/30',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-xs',
            md: 'px-4 py-2 text-sm',
            lg: 'px-6 py-3 text-base',
            compact: 'px-3 py-2 text-xs',
            xl: 'px-8 py-4 text-base rounded-2xl',
            'h-14': 'px-6 h-14 text-sm rounded-2xl',
        };

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                )}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
