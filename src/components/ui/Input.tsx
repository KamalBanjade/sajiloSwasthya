import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    success?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, success, className = '', ...props }, ref) => {
        return (
            <div className="w-full space-y-2 group/field">
                {label && (
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.15em] block transition-colors px-1 group-focus-within/field:text-primary dark:group-focus-within/field:text-primary-light">
                        {label}
                        {props.required && <span className="text-rose-500 ml-1 font-black">*</span>}
                    </label>
                )}
                <div className="relative group transition-all duration-300">
                    <input
                        ref={ref}
                        className={`
            w-full px-5 py-3.5 pr-12 rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-300
            focus:outline-none focus:ring-4 placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-medium
            hover:border-slate-400 dark:hover:border-slate-600 active:scale-[0.99]
            ${error
                                ? 'border-rose-500 focus:ring-rose-500/10 focus:border-rose-500'
                                : success
                                    ? 'border-emerald-500 focus:ring-emerald-500/10 focus:border-emerald-500'
                                    : 'border-slate-200 dark:border-slate-700 dark:shadow-none focus:ring-primary/10 focus:border-primary'
                            }
            ${className}
          `}
                        {...props}
                    />

                    {/* Success Icon */}
                    {success && !error && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-in fade-in zoom-in duration-300">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                        </div>
                    )}

                    {/* Interactive focus underline */}
                    {!error && !success && (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-secondary transition-all duration-500 ease-out group-focus-within:w-[60%] opacity-0 group-focus-within:opacity-100 rounded-full" />
                    )}
                </div>
                {error && <p className="text-[11px] font-bold text-rose-500 dark:text-rose-400 px-1 animate-in fade-in slide-in-from-top-1">{error}</p>}
            </div>
        );
    }
);

Input.displayName = 'Input';
