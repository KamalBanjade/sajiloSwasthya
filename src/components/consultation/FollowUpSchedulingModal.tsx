'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, ChevronRight, Loader2, SkipForward } from 'lucide-react';
import { addDays, format } from 'date-fns';

export interface FollowUpData {
    preferredDate: Date; // Full calculated Date object
}

interface FollowUpSchedulingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: FollowUpData | null) => void;
    todayAppointmentTime: string; // "HH:mm" — pre-filled from today's appointment
    patientName: string;
    isLoading?: boolean;
}

export function FollowUpSchedulingModal({
    isOpen,
    onClose,
    onConfirm,
    todayAppointmentTime,
    patientName,
    isLoading = false,
}: FollowUpSchedulingModalProps) {
    const [followUpDays, setFollowUpDays] = useState(30);
    const [preferredTime, setPreferredTime] = useState(todayAppointmentTime || '09:00');
    const [computedDate, setComputedDate] = useState('');

    // Sync time if prop changes (e.g. async load)
    useEffect(() => {
        if (todayAppointmentTime) setPreferredTime(todayAppointmentTime);
    }, [todayAppointmentTime]);

    // Recompute the future date whenever days changes
    useEffect(() => {
        if (followUpDays >= 1 && followUpDays <= 365) {
            const future = addDays(new Date(), followUpDays);
            setComputedDate(format(future, 'EEEE, MMMM d, yyyy'));
        } else {
            setComputedDate('—');
        }
    }, [followUpDays]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (followUpDays < 1 || followUpDays > 365 || !preferredTime) return;
        
        // Calculate the actual Date object
        const futureDate = addDays(new Date(), followUpDays);
        const [hours, minutes] = preferredTime.split(':').map(Number);
        futureDate.setHours(hours, minutes, 0, 0);
        
        onConfirm({ preferredDate: futureDate });
    };

    const handleSkip = () => onConfirm(null);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-200/60 dark:border-slate-800 w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header */}
                <div className="bg-slate-900 dark:bg-slate-950 px-6 py-5 flex items-center justify-between border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-tight">Schedule Follow-Up</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Optional — Post-Consultation Step</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-6 space-y-5">
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                        Recommend a follow-up visit for{' '}
                        <span className="font-black text-slate-800 dark:text-white">{patientName}</span>?
                        An appointment will be created and the patient will receive a calendar invite.
                    </p>

                    {/* Days Input */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            Follow-Up In
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <input
                                    type="number"
                                    value={followUpDays}
                                    min={1}
                                    max={365}
                                    onChange={(e) => setFollowUpDays(Number(e.target.value))}
                                    className="w-full h-12 px-4 pr-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">
                                    days
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Time Input */}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                            Preferred Time
                            <span className="ml-2 text-emerald-500 normal-case font-bold tracking-normal">
                                (pre-filled from today&apos;s appointment)
                            </span>
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="time"
                                value={preferredTime}
                                onChange={(e) => setPreferredTime(e.target.value)}
                                className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Computed date display */}
                    <div className="px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                Appointment Will Be Set For
                            </span>
                        </div>
                        <p className="text-[13px] font-black text-slate-800 dark:text-white leading-tight">
                            {computedDate}
                        </p>
                        {preferredTime && (
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                                at {preferredTime}
                            </p>
                        )}
                        <p className="text-[9px] font-medium text-slate-400 mt-2">
                            ✉️ Patient will receive a confirmation email with calendar invite (.ics)
                        </p>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="px-6 pb-6 flex flex-col gap-2">
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || followUpDays < 1 || followUpDays > 365}
                        className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-600/20"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Calendar className="w-4 h-4" />
                                <span>Schedule Follow-Up</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleSkip}
                        disabled={isLoading}
                        className="w-full py-2.5 text-[9px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                        <SkipForward className="w-3 h-3" />
                        Skip — No Follow-Up Needed
                    </button>
                </div>
            </div>
        </div>
    );
}
