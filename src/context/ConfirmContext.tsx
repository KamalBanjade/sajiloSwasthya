'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'primary' | 'danger' | 'warning';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export const ConfirmProvider = ({ children }: {children: ReactNode;}) => {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve
      });
    });
  }, []);

  const handleClose = useCallback((result: boolean) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  }, [confirmState]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AnimatePresence>
                {confirmState?.isOpen &&
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleClose(false)}
            className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm" />
          

                        {/* Modal Card */}
                        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[440px] bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            
                            {/* Header / Logo */}
                            <div className="pt-8 flex flex-col items-center">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800/50 shadow-sm">
                                    <img
                  src="/images/logo.webp"
                  alt="Sajilo Swasthya"
                  className="h-8 w-auto object-contain dark:brightness-110" />
                
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight px-6 text-center">
                                    {confirmState.options.title}
                                </h3>
                            </div>

                            {/* Message */}
                            <div className="px-8 py-4 text-center">
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">
                                    {confirmState.options.message}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
                                <Button
                variant="ghost"
                onClick={() => handleClose(false)}
                className="flex-1 h-12 rounded-2xl text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
                
                                    {confirmState.options.cancelText || 'Cancel'}
                                </Button>
                                <Button
                variant={confirmState.options.type === 'danger' ? 'secondary' : 'primary'}
                onClick={() => handleClose(true)}
                className={`flex-1 h-12 rounded-2xl font-bold shadow-lg
                                        ${confirmState.options.type === 'danger' ?
                'bg-rose-600 hover:bg-rose-700 shadow-rose-200 dark:shadow-none' :
                'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'}`}>
                
                                    {confirmState.options.confirmText || 'Confirm'}
                                </Button>
                            </div>

                            {/* Close Icon (Corner) */}
                            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 p-2 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
              
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </motion.div>
                    </div>
        }
            </AnimatePresence>
        </ConfirmContext.Provider>);

};