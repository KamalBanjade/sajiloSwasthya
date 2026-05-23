'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const MedicalLoader: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center space-y-12">
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Glow Effect Background */}
                <motion.div
                    animate={{
                        scale: [0.8, 1.2, 0.8],
                        opacity: [0.1, 0.2, 0.1],
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"
                />

                {/* Pulsing Medical Cross */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative z-10"
                >
                    <svg
                        width="80"
                        height="80"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="filter drop-shadow-lg"
                    >
                        <path
                            d="M19 11H13V5C13 4.44772 12.5523 4 12 4C11.4477 4 11 4.44772 11 5V11H5C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13H11V19C11 19.5523 11.4477 20 12 20C12.5523 20 13 19.5523 13 19V13H19C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11Z"
                            fill="currentColor"
                            className="text-secondary"
                        />
                    </svg>
                </motion.div>

                {/* EKG Pulse Line Loop */}
                <div className="absolute inset-0 flex items-center justify-center z-20 overflow-hidden pointer-events-none">
                    <svg
                        width="200"
                        height="80"
                        viewBox="0 0 200 80"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="opacity-80"
                    >
                        <motion.path
                            d="M0 40H60L65 20L75 60L85 5L95 75L105 35L115 45L125 40H200"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-primary"
                            initial={{ pathLength: 0, opacity: 0, x: -100 }}
                            animate={{
                                pathLength: [0, 1, 1],
                                opacity: [0, 1, 0],
                                x: [-50, 0, 50]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "linear",
                                times: [0, 0.5, 1]
                            }}
                        />
                    </svg>
                </div>
            </div>

            <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center">
                    <span className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.4em] uppercase text-[9px] mb-1">
                        System Health Check
                    </span>
                    <h2 className="text-slate-900 dark:text-white font-bold tracking-tight text-lg">
                        Sajilo <span className="text-secondary">स्वास्थ्य</span>
                    </h2>
                </div>

                <div className="flex space-x-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            animate={{
                                scale: [1, 1.4, 1],
                                opacity: [0.2, 0.8, 0.2]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.15,
                                ease: "easeInOut"
                            }}
                            className="w-1.5 h-1.5 bg-secondary rounded-full"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
