import React from 'react';

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    columns?: 1 | 2 | 3 | 4;
    gap?: 'sm' | 'md' | 'lg';
}

/**
 * A smart grid that automatically handles responsive column stacking.
 */
export function ResponsiveGrid({ children, columns = 3, gap = 'lg', className = '', ...props }: ResponsiveGridProps) {
    const gapClass = {
        'sm': 'gap-4',
        'md': 'gap-6',
        'lg': 'gap-6 sm:gap-8',
    }[gap];

    const columnsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    }[columns];

    return (
        <div className={`grid ${columnsClass} ${gapClass} ${className}`} {...props}>
            {children}
        </div>
    );
}

/**
 * Specifically tuned grid for dense form inputs.
 */
export function FormGrid({ children, columns = 2, className = '', ...props }: ResponsiveGridProps) {
    const columnsClass = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    }[columns];

    return (
        <div className={`grid ${columnsClass} gap-4 sm:gap-5 ${className}`} {...props}>
            {children}
        </div>
    );
}
