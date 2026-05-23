import React from 'react';

export interface PageLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    withPadding?: boolean;
}

export function PageLayout({ children, withPadding = true, className = '', ...props }: PageLayoutProps) {
    return (
        <div className={`w-full flex-1 flex flex-col space-y-6 lg:space-y-8 ${withPadding ? 'py-4 sm:py-6 lg:py-8' : ''} ${className}`} {...props}>
            {children}
        </div>
    );
}

export function Section({ children, title, description, action, className = '' }: { 
    children: React.ReactNode; 
    title?: React.ReactNode; 
    description?: React.ReactNode;
    action?: React.ReactNode;
    className?: string; 
}) {
    return (
        <section className={`flex flex-col gap-6 lg:gap-8 ${className}`}>
            {(title || description || action) && (
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 px-4 sm:px-8">
                    <div className="space-y-2">
                        {title && <h2 className="text-xl lg:text-2xl font-black tracking-tight text-slate-800 dark:text-slate-100">{title}</h2>}
                        {description && <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </section>
    );
}
