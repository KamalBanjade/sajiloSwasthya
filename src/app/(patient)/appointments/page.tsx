'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, AppointmentDTO } from '@/lib/api/appointments';
import {
    Calendar,
    Clock,
    User,
    Stethoscope,
    CheckCircle2,
    XCircle,
    Search,
    RefreshCw,
    Plus,
    FileText,
    ArrowRight,
    Zap,
    Info,
    X,
    Activity,
    CalendarDays
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { isAfter, isBefore, subDays } from 'date-fns';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useConfirm } from '@/context/ConfirmContext';
import { formatLocalTime, normalizeUTC } from '@/lib/utils/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { InsightCard } from '@/components/cards/InsightCard';
import { PatientAppointmentCard } from '@/components/patient/PatientAppointmentCard';
import { AppointmentSkeleton } from '@/components/ui/AppointmentSkeleton';
import { PageLayout } from '@/components/layout/PageLayout';

export default function PatientAppointmentsPage() {
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
    const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancellationError, setCancellationError] = useState<string | null>(null);

    const { data: appointmentsResponse, isLoading } = useQuery({
        queryKey: ['patient-appointments'],
        queryFn: () => appointmentsApi.getPatientAppointments(true),
    });

    const appointments = appointmentsResponse?.data || [];
    const now = new Date();

    const filteredAppointments = appointments.filter((app: AppointmentDTO) => {
        const appDate = new Date(normalizeUTC(app.appointmentDate));
        const matchesSearch =
            app.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (app.reasonForVisit?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
            app.doctorDepartment.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const isPast = isBefore(appDate, now);
        const isActiveStatus = (app.status === 'Scheduled' || app.status === 'Confirmed' || app.status === 'Pending');

        if (activeTab === 'upcoming') {
            // Upcoming should only show active statuses that are in the future/today
            return isActiveStatus && !isPast;
        } else {
            // History shows everything else: past appointments, or final statuses (Cancelled, Completed, Overdue)
            const isFinalStatus = (app.status === 'Cancelled' || app.status === 'Completed' || app.status === 'Overdue');
            return isFinalStatus || (isActiveStatus && isPast);
        }
    }).sort((a: AppointmentDTO, b: AppointmentDTO) => {
        const dateA = new Date(normalizeUTC(a.appointmentDate));
        const dateB = new Date(normalizeUTC(b.appointmentDate));
        return activeTab === 'upcoming'
            ? dateA.getTime() - dateB.getTime()
            : dateB.getTime() - dateA.getTime();
    });

    const stats = {
        total: appointments.length,
        upcoming: appointments.filter((a: AppointmentDTO) => {
            const appDate = new Date(normalizeUTC(a.appointmentDate));
            return (a.status === 'Scheduled' || a.status === 'Confirmed' || a.status === 'Pending') && !isBefore(appDate, now);
        }).length,
        completed: appointments.filter((a: AppointmentDTO) => a.status === 'Completed').length,
        cancelled: appointments.filter((a: AppointmentDTO) => a.status === 'Cancelled').length
    };

    const handleCancel = (id: string) => {
        setCancellingAppointmentId(id);
        setCancellationReason('');
        setCancellationError(null);
    };

    const confirmCancellation = async () => {
        if (!cancellingAppointmentId) return;
        if (!cancellationReason.trim()) {
            setCancellationError('Please provide a reason for cancellation');
            return;
        }

        setIsCancelling(true);
        setCancellationError(null);
        const cancelToast = toast.loading('Revoking clinical slot and notifying physician...', {
            style: {
                borderRadius: '16px',
                background: '#1e293b',
                color: '#fff',
            },
        });

        try {
            await appointmentsApi.cancelAppointment(cancellingAppointmentId, {
                cancellationReason: cancellationReason.trim()
            });
            toast.success('Appointment cancelled successfully', {
                id: cancelToast,
            });
            queryClient.invalidateQueries({ queryKey: ['patient-appointments'] });
            setCancellingAppointmentId(null);
        } catch (err) {
            toast.error('Failed to cancel appointment', {
                id: cancelToast,
            });
        } finally {
            setIsCancelling(false);
        }
    };

    return (
        <PageLayout>
            <div className="space-y-10">

            {/* Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <InsightCard isLoading={isLoading} title="Total Consults" value={stats.total} icon={Calendar} gradient="from-violet-500 to-indigo-600" />
                <InsightCard isLoading={isLoading} title="Active Schedule" value={stats.upcoming} icon={Clock} gradient="from-amber-500 to-orange-600" />
                <InsightCard isLoading={isLoading} title="Successful" value={stats.completed} icon={CheckCircle2} gradient="from-emerald-500 to-teal-600" />
                <InsightCard isLoading={isLoading} title="Terminated" value={stats.cancelled} icon={XCircle} gradient="from-rose-500 to-pink-600" />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Tab Switcher */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-800/50 rounded-2xl w-full lg:w-fit border border-slate-200 dark:border-slate-700/50">
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'upcoming'
                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 lg:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === 'history'
                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        History
                    </button>
                </div>

                {/* Search + New Appointment */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="relative group w-full lg:w-96">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by physician or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-5 py-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-[10px] uppercase tracking-widest focus:ring-4 focus:ring-primary/5 outline-none transition-all placeholder:text-slate-400"
                        />
                    </div>
                    <Link href="/appointments/new">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            className="h-14 px-7 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 flex items-center gap-2.5 whitespace-nowrap border-none group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
                            New Appointment
                        </motion.button>
                    </Link>
                </div>
            </div>

            {/* List Container */}
            <div>
                {isLoading ? (
                    <div className="grid grid-cols-1 gap-6">
                        {[1, 2, 3].map((i) => (
                            <AppointmentSkeleton key={i} />
                        ))}
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {filteredAppointments.length > 0 ? (
                            <motion.div
                                key={activeTab + searchTerm}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="grid grid-cols-1 gap-6"
                            >
                                {filteredAppointments.map((app: AppointmentDTO) => (
                                    <PatientAppointmentCard
                                        key={app.id}
                                        appointment={app}
                                        isHistory={activeTab === 'history'}
                                        onCancel={() => handleCancel(app.id)}
                                        onViewDetails={() => setSelectedAppointmentId(app.id)}
                                    />
                                ))}
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="py-40 flex flex-col items-center justify-center text-center space-y-8"
                            >
                                <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-inner relative">
                                    <Calendar className="w-14 h-14 text-slate-200 dark:text-slate-700" />
                                    <div className="absolute top-0 right-0 w-8 h-8 bg-rose-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
                                        <X className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                                        {searchTerm ? 'No Clinical Matches' : 'Roster is Clear'}
                                    </h2>
                                    <p className="text-slate-400 dark:text-slate-500 max-w-sm font-bold text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                                        {searchTerm
                                            ? `Search for "${searchTerm}" returned zero clinical entries.`
                                            : activeTab === 'upcoming'
                                                ? 'No upcoming medical consultations found in your active schedule.'
                                                : 'Your historical clinical archive is currently empty.'}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {selectedAppointmentId && (
                    <AppointmentDetailsOverlay
                        appointmentId={selectedAppointmentId}
                        onClose={() => setSelectedAppointmentId(null)}
                    />
                )}
                {cancellingAppointmentId && (
                    <CancellationOverlay
                        isOpen={!!cancellingAppointmentId}
                        onClose={() => setCancellingAppointmentId(null)}
                        onConfirm={confirmCancellation}
                        reason={cancellationReason}
                        setReason={setCancellationReason}
                        isSubmitting={isCancelling}
                        error={cancellationError}
                    />
                )}
            </AnimatePresence>
            </div>
        </PageLayout>
    );
}

// ── Components ─────────────────────────────────────────────────────────────

// ── Overlay Component ───────────────────────────────────────────────────────

function AppointmentDetailsOverlay({ appointmentId, onClose }: { appointmentId: string; onClose: () => void }) {
    const { data: appResponse, isLoading } = useQuery({
        queryKey: ['appointment', appointmentId],
        queryFn: () => appointmentsApi.getAppointment(appointmentId),
    });

    const app = appResponse?.data;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8 bg-slate-950/80 backdrop-blur-xl"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 30 }}
                className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl md:rounded-[3.5rem] shadow-2xl border border-white/20 dark:border-slate-800 overflow-hidden relative"
            >
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 md:top-8 md:right-8 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all z-20 shadow-lg"
                >
                    <X className="w-5 h-5" />
                </button>

                {isLoading ? (
                    <div className="p-10 md:p-12 space-y-8">
                        <Skeleton className="h-40 w-full rounded-[2.5rem]" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                            <Skeleton className="h-32 w-full rounded-[2.5rem]" />
                        </div>
                        <Skeleton className="h-48 w-full rounded-[2.5rem]" />
                    </div>
                ) : app ? (
                    <div className="flex flex-col h-full max-h-[85vh]">
                        <div className="p-10 md:p-12 bg-gradient-to-br from-emerald-600 to-teal-700 text-white relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-[0.2em]">
                                        {app.status} Consult
                                    </div>
                                    <div className="px-4 py-1.5 bg-black/10 rounded-full text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {app.duration} Minutes
                                    </div>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black tracking-tighter leading-none italic max-w-2xl">
                                    {app.reasonForVisit || 'General Clinical Review'}
                                </h2>
                                <div className="flex flex-wrap items-center gap-8 pt-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                            <CalendarDays className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Appointment Date</p>
                                            <p className="text-lg font-black">{formatLocalTime(app.appointmentDate, 'EEEE, MMMM do')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                            <Stethoscope className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Department</p>
                                            <p className="text-lg font-black">{app.doctorDepartment}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner">
                                            <User className="w-7 h-7" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Leading Physician</p>
                                            <p className="text-lg font-black">{app.doctorName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 md:p-12 space-y-12 bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Patient & Clinical Brief */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
                                                    <User className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Patient Profiling</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Full Name</p>
                                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{app.patientName}</p>
                                                </div>
                                                <div className="flex gap-8">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Age</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">{app.patientAge} Years</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gender</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">{app.patientGender}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Clinical Data</h3>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Session ID</p>
                                                    <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 break-all">{app.id}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Patient ID</p>
                                                    <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 break-all">{app.patientId}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Consultation Notes</h3>
                                        </div>
                                        <div className="p-8 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 shadow-sm min-h-[160px]">
                                            <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed">
                                                {app.consultationNotes || 'No specific clinical notes have been recorded for this session yet. Please consult your physician during the scheduled time for detailed feedback.'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                    <Info className="w-4 h-4" />
                                                </div>
                                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Linked Records</h3>
                                            </div>
                                            <span className="text-[10px] font-black px-3 py-1 bg-slate-200 dark:bg-slate-800 rounded-full text-slate-500 uppercase">
                                                {app.linkedRecords?.length || 0} Files
                                            </span>
                                        </div>
                                        {app.linkedRecords?.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {app.linkedRecords.map((record: any) => (
                                                    <div key={record.recordId} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 hover:border-emerald-500/30 transition-colors group/record">
                                                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover/record:text-emerald-500 transition-colors">
                                                            <FileText className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black text-slate-800 dark:text-white truncate uppercase">{record.recordFileName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{record.recordType}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-10 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-center">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Zero medical records are linked to this consultation.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-6">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 px-1">Session Analytics</h3>
                                        <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</p>
                                                <div className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${app.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                    app.status === 'Cancelled' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        app.status === 'Overdue' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                                                    }`}>
                                                    {app.status}
                                                </div>
                                            </div>
                                            <div className="space-y-2 border-t border-slate-50 dark:border-slate-800 pt-6">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Appointment Slot</p>
                                                <div className="space-y-1">
                                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{formatLocalTime(app.appointmentDate, 'h:mm a')}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{app.duration} Minutes Duration</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 border-t border-slate-50 dark:border-slate-800 pt-6">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Clinical Audit</p>
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-3">
                                                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                                                        <div>
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Requested</p>
                                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{formatLocalTime(app.createdAt, 'MMM do, yyyy')}</p>
                                                        </div>
                                                    </div>
                                                    {app.completedAt && (
                                                        <div className="flex items-center gap-3">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                            <div>
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Finalized</p>
                                                                <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{formatLocalTime(app.completedAt, 'MMM do, yyyy')}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] border border-primary/10 space-y-4">
                                        <div className="flex items-center gap-3 text-primary">
                                            <Zap className="w-5 h-5 flex-shrink-0" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Quick Note</p>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">
                                            This consultation is securely recorded. Your clinical data is encrypted and only accessible by your attending physician.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 md:p-10 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Session ID: <span className="text-slate-900 dark:text-white ml-2">{app.id.slice(0, 8)}</span></p>
                            </div>
                            <Link href="/reports">
                                <button className="px-6 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all overflow-hidden relative group">
                                    Export Summary
                                    <div className="absolute inset-0 bg-emerald-600 translate-y-full group-hover:translate-y-0 transition-transform -z-10" />
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : null}
            </motion.div>
        </motion.div>
    );
}

function CancellationOverlay({
    isOpen,
    onClose,
    onConfirm,
    reason,
    setReason,
    isSubmitting,
    error
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    reason: string;
    setReason: (val: string) => void;
    isSubmitting: boolean;
    error: string | null;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-sm"
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-2xl flex items-center justify-center">
                            <XCircle className="w-6 h-6" />
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Cancel Appointment</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                            Are you sure? This will remove the slot from your schedule and notify the physician.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block px-1">
                            Reason for Cancellation
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Please explain why you need to cancel..."
                            className="w-full h-32 rounded-2xl border-2 bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 p-4 text-sm font-medium focus:ring-4 focus:ring-rose-500/5 focus:border-rose-500/50 outline-none transition-all resize-none shadow-inner"
                        />
                        {error && (
                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest px-1 animate-pulse">
                                {error}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-inter"
                        >
                            Back
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className={`flex-[2] h-12 rounded-xl bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                                <XCircle className="w-3.5 h-3.5" />
                            )}
                            Confirm Cancellation
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}