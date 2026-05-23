import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({ isOpen, onClose, children, title, description, maxWidth = 'md' }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEsc);
        } else {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        }
        return () => { 
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    const maxWidthClass = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl',
        '2xl': 'max-w-2xl',
    }[maxWidth];

    // Render safely into document body
    if (typeof window === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 backdrop-blur-md bg-slate-900/60 cursor-pointer"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.98 }}
                        transition={{ 
                            type: "spring", 
                            damping: 25, 
                            stiffness: 400,
                            mass: 0.8
                        }}
                        className={`relative w-full ${maxWidthClass} bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-white/5 dark:border-slate-800/50`}
                    >
                        {(title || description) && (
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    {title && <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>}
                                    <button
                                        onClick={onClose}
                                        className="p-2 -mr-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                                {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
                            </div>
                        )}
                        {!title && !description && (
                            <button
                                onClick={onClose}
                                className="absolute right-4 top-4 p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <div className="p-6">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
