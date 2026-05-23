import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Hash } from 'lucide-react';

interface CollapsibleSectionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badgeCount?: number;
    icon?: React.ReactNode;
    className?: string;
    iconClassName?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
    title, 
    children, 
    defaultOpen = true,
    badgeCount,
    icon,
    className,
    iconClassName
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`mb-4 overflow-hidden transition-all ${className || 'bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl hover:border-slate-700'}`}>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-5 py-4 flex items-center justify-between text-left group"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg transition-colors ${
                        isOpen ? (iconClassName || 'bg-blue-600/20 text-blue-400') : 'bg-slate-800 text-slate-500'
                    }`}>
                        {icon || <Hash className="w-4 h-4" />}
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                            {title}
                        </h3>
                        {badgeCount !== undefined && (
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                                {badgeCount} measurement{badgeCount !== 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>

                <div className={`p-1.5 rounded-lg transition-all ${
                    isOpen ? 'bg-slate-800 text-slate-300' : 'bg-slate-800/50 text-slate-500'
                }`}>
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="px-5 pb-5 pt-1 border-t border-slate-800/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
