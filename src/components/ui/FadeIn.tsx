'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface FadeInProps extends HTMLMotionProps<'div'> {
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    distance?: number;
    staggerChildren?: number;
}

export const FadeIn: React.FC<FadeInProps> = ({
    children,
    delay = 0,
    duration = 0.5,
    direction = 'down', // Default to 'down' as requested (up-to-down)
    distance = 20,
    staggerChildren,
    className,
    ...props
}) => {
    const directions = {
        up: { y: distance },
        down: { y: -distance },
        left: { x: distance },
        right: { x: -distance },
        none: {},
    };

    return (
        <motion.div
            initial={{
                opacity: 0,
                ...directions[direction],
            }}
            animate={{
                opacity: 1,
                x: 0,
                y: 0,
            }}
            transition={{
                duration,
                delay,
                ease: [0.25, 0.1, 0.25, 1], // Smooth cubic bezier
                staggerChildren,
            }}
            className={className}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const FadeInStagger: React.FC<FadeInProps> = ({
    children,
    staggerChildren = 0.1,
    delay = 0,
    ...props
}) => {
    return (
        <FadeIn
            direction="none"
            staggerChildren={staggerChildren}
            delay={delay}
            {...props}
        >
            {children}
        </FadeIn>
    );
};
