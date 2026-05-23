import React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    direction?: 'col' | 'row';
    spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    align?: 'start' | 'center' | 'end' | 'stretch';
    justify?: 'start' | 'center' | 'end' | 'between' | 'around';
    wrap?: boolean;
}

export function Stack({
    children,
    direction = 'col',
    spacing = 'md',
    align = 'stretch',
    justify = 'start',
    wrap = false,
    className = '',
    ...props
}: StackProps) {

    const directionClass = direction === 'col' ? 'flex-col' : 'flex-row';
    const wrapClass = wrap ? 'flex-wrap' : 'flex-nowrap';

    const spacingClass = {
        'xs': 'gap-2',     // sm
        'sm': 'gap-4',     // md
        'md': 'gap-6',     // lg
        'lg': 'gap-8',     // xl
        'xl': 'gap-12',    // 2xl
    }[spacing];

    const alignClass = {
        'start': 'items-start',
        'center': 'items-center',
        'end': 'items-end',
        'stretch': 'items-stretch',
    }[align];

    const justifyClass = {
        'start': 'justify-start',
        'center': 'justify-center',
        'end': 'justify-end',
        'between': 'justify-between',
        'around': 'justify-around',
    }[justify];

    return (
        <div className={`flex ${directionClass} ${wrapClass} ${spacingClass} ${alignClass} ${justifyClass} ${className}`} {...props}>
            {children}
        </div>
    );
}
