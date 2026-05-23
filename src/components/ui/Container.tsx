import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '7xl' | 'full';
}

export function Container({ children, maxWidth = '7xl', className = '', ...props }: ContainerProps) {
    const maxWidthClass = {
        'sm': 'max-w-screen-sm',
        'md': 'max-w-screen-md',
        'lg': 'max-w-screen-lg',
        'xl': 'max-w-screen-xl',
        '7xl': 'max-w-7xl',
        'full': 'max-w-full',
    }[maxWidth];

    return (
        <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthClass} ${className}`} {...props}>
            {children}
        </div>
    );
}
