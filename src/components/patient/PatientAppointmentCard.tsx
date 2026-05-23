'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppointmentDTO } from '@/lib/api/appointments';
import { formatLocalTime } from '@/lib/utils/dateUtils';
import { Stethoscope, User, Clock, FileText, Zap, XCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export interface PatientAppointmentCardProps {
    appointment: AppointmentDTO;
    isHistory: boolean;
    onCancel: () => void;
    onViewDetails: () => void;
}

export function PatientAppointmentCard({ appointment, isHistory, onCancel, onViewDetails }: PatientAppointmentCardProps) {
    const statusStyles: Record<string, any> = {
        Confirmed: { bg: 'bg-emerald-500/10', text: 'text-emerald-500', label: 'Confirmed' },
        Scheduled: { bg: 'bg-primary/10', text: 'text-primary', label: 'Scheduled' },
        Pending: { bg: 'bg-amber-500/10', text: 'text-amber-500', label: 'Pending' },
        Cancelled: { bg: 'bg-rose-500/10', text: 'text-rose-500', label: 'Terminated' },
        Completed: { bg: 'bg-emerald-600', text: 'text-white', label: 'Completed' },
        Overdue: { bg: 'bg-rose-600', text: 'text-white', label: 'Overdue' },
    };

    const status = statusStyles[appointment.status] || { bg: 'bg-slate-500/10', text: 'text-slate-500', label: appointment.status };
    const accentColor = appointment.status === 'Completed' || appointment.status === 'Overdue'
        ? status.bg
        : status.text.replace('text-', 'bg-');

    return (
        // motion.div is the clip boundary — same radius as Card, overflow-hidden clips the accent bar
        <motion.div
            whileHover={{ y: -2, scale: 1.002 }}
            className={`group relative overflow-hidden rounded-[2.5rem] sm:rounded-[3rem] transition-all duration-300 ${isHistory ? 'opacity-75 grayscale-[20%]' : ''}`}
        >
            {/* Accent bar — positioned relative to motion.div (the clipping context) */}
            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${accentColor} z-10`} />

            <Card padding="md" className="hover:shadow-xl hover:border-emerald-500/30">
                <div className="flex flex-col md:flex-row items-center gap-5 pl-3">

                    {/* Time block */}
                    <div className="flex flex-col items-center justify-center w-full md:w-24 shrink-0 py-3 px-2 bg-slate-50 dark:bg-slate-900/50 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 group-hover:bg-emerald-500/5 transition-colors">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic">
                            {formatLocalTime(appointment.appointmentDate, 'h:mm')}
                        </span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1">
                            {formatLocalTime(appointment.appointmentDate, 'a')}
                        </span>
                        <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 my-2 group-hover:w-12 group-hover:bg-emerald-500/30 transition-all duration-500" />
                        <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                            {formatLocalTime(appointment.appointmentDate, 'MMM dd')}
                        </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2 text-center md:text-left">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent ${status.bg} ${status.text}`}>
                                {status.label}
                            </span>
                            <span className="flex items-center gap-1 text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] font-black text-[9px]">
                                <Stethoscope className="w-3 h-3" />
                                {appointment.doctorDepartment}
                            </span>
                        </div>

                        <p className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate group-hover:text-emerald-600 transition-colors">
                            {appointment.reasonForVisit || 'General Medical Consultation'}
                        </p>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                                <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <User className="w-2.5 h-2.5 text-emerald-600" />
                                </div>
                                {appointment.doctorName}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800 text-[9px] font-black text-slate-400 uppercase">
                                <Clock className="w-3 h-3" />
                                {appointment.duration}m
                            </span>
                            {appointment.linkedRecordsCount > 0 && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase">
                                    <FileText className="w-3 h-3" />
                                    {appointment.linkedRecordsCount} Records
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto relative z-10">
                        {!isHistory ? (
                            <>
                                <button
                                    onClick={onViewDetails}
                                    className="flex-1 md:flex-none md:w-36 h-10 rounded-xl bg-slate-900 dark:bg-white dark:text-slate-900 text-white font-black text-[9px] uppercase tracking-widest shadow-lg shadow-black/10 transition-all hover:scale-[1.04] active:scale-95 flex items-center justify-center gap-2 group/btn cursor-pointer"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-current group-hover/btn:animate-pulse text-amber-400" />
                                    Full Insights
                                </button>
                                {appointment.canCancel && (
                                    <button
                                        onClick={onCancel}
                                        className="flex-1 md:flex-none md:w-36 h-10 flex items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-500 hover:text-white hover:border-rose-500 transition-all active:scale-95 group/cancel cursor-pointer"
                                    >
                                        <XCircle className="w-3.5 h-3.5 mr-1.5 transition-transform group-hover/cancel:rotate-90" />
                                        <span className="font-black text-[9px] uppercase tracking-widest whitespace-nowrap">Cancel</span>
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <Link href={`/appointments/new?doctorId=${appointment.doctorId}&reason=Follow-up for ${appointment.reasonForVisit}`} className="flex-1 md:flex-none">
                                    <button className="w-full md:w-36 h-10 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-black text-[9px] uppercase tracking-widest shadow-md shadow-emerald-500/20 group/rebook transition-all hover:scale-[1.04]">
                                        Re-Book
                                        <ArrowRight className="inline-block w-3.5 h-3.5 ml-1.5 group-hover/rebook:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={onViewDetails}
                                    className="flex-1 md:flex-none md:w-36 h-10 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    Summary
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
