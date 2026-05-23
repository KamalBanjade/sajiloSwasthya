import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: { value: string; label: string }[];
    error?: string;
    success?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ label, options, error, success, className = '', ...props }, ref) => {
        return (
            <div className="w-full space-y-2 group/field">
                {label && (
                    <label className="text-[11px] font-black text-slate-900 dark:text-slate-200 uppercase tracking-[0.15em] block transition-colors px-1 group-focus-within/field:text-primary dark:group-focus-within/field:text-primary-light">
                        {label}
                        {props.required && <span className="text-rose-500 ml-1 font-black">*</span>}
                    </label>
                )}
                <div className="relative group transition-all duration-300">
                    <select
                        ref={ref}
                        className={`
            w-full px-5 py-3.5 pr-12 rounded-2xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white transition-all duration-300
            focus:outline-none focus:ring-4 appearance-none
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
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value} className="dark:bg-slate-900">
                                {opt.label}
                            </option>
                        ))}
                    </select>

                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400 dark:text-slate-500 transition-all group-focus-within:text-primary dark:group-focus-within:text-primary-light">
                        {success && !error ? (
                            <CheckCircleIcon className="w-5 h-5 text-emerald-500 animate-in fade-in zoom-in duration-300" />
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </div>

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

Select.displayName = 'Select';
