'use client';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    appointmentsApi,
    AppointmentDTO,
} from '@/lib/api/appointments';
import {
    Calendar as CalendarIcon,
    Clock,
    User,
    CheckCircle2,
    Play,
    Search,
    Link as LinkIcon,
    FileText,
    History,
    RefreshCw,
    ChevronRight,
    LayoutDashboard,
    Stethoscope,
    Check,
    UserX,
} from 'lucide-react';
import { format, addDays, getDay, isSameDay, startOfMonth, addMonths, isBefore, startOfDay } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { formatLocalTime, getRelativeTimeString, normalizeUTC } from '@/lib/utils/dateUtils';
import { useRouter } from 'next/navigation';
import { DayPicker } from 'react-day-picker';
import { Activity, CalendarDays, ChevronLeft, ChevronDown, Filter, X } from 'lucide-react';
import { AppointmentSkeleton } from '@/components/ui/AppointmentSkeleton';
import { Skeleton } from '@/components/ui/Skeleton';
import { PageLayout } from '@/components/layout/PageLayout';
import { useConfirm } from '@/context/ConfirmContext';

export default function DoctorAppointmentsDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showHistory, setShowHistory] = useState<boolean>(false);
    const [historySearch, setHistorySearch] = useState<string>('');
    const [historyStatusFilter, setHistoryStatusFilter] = useState<string>('all');

    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

    // Calendar state
    const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(new Date()));

    const isToday = formattedDate === todayStr;
    const isTomorrow = formattedDate === tomorrowStr;

    const { data: appointmentsResponse, isLoading } = useQuery({
        queryKey: ['doctor-appointments', formattedDate, showHistory],
        queryFn: () => appointmentsApi.getDoctorAppointments(
            showHistory ? undefined : formattedDate,
            showHistory
        ),
    });

    // ── Monthly Overview for Calendar Indicators ────────────────────────────
    const { data: allAppointmentsResponse } = useQuery({
        queryKey: ['doctor-appointments-all'],
        queryFn: () => appointmentsApi.getDoctorAppointments(undefined, false),
        staleTime: 300000,
    });

    const appointmentDates = React.useMemo(() => {
        const dates = new Set<string>();
        allAppointmentsResponse?.data?.forEach((app: AppointmentDTO) => {
            if (app.status !== 'Cancelled') {
                const date = new Date(normalizeUTC(app.appointmentDate));
                dates.add(format(date, 'yyyy-MM-dd'));
            }
        });
        return dates;
    }, [allAppointmentsResponse]);

    const { data: statsResponse, isLoading: statsLoading } = useQuery({
        queryKey: ['doctor-appointment-stats'],
        queryFn: appointmentsApi.getDoctorStats,
    });

    const appointments = appointmentsResponse?.data ?? [];
    const stats = statsResponse?.data ?? {
        totalAppointments: 0,
        completedAppointments: 0,
        upcomingAppointments: 0,
        pendingConfirmation: 0,
    };

    const filteredHistoryAppointments = React.useMemo(() => {
        if (!showHistory) return [];
        return appointments.filter((app: AppointmentDTO) => {
            // Status filter
            if (historyStatusFilter !== 'all') {
                if (historyStatusFilter.toLowerCase() === 'no show') {
                    if (app.status.toLowerCase() !== 'noshow') return false;
                } else if (historyStatusFilter.toLowerCase() === 'in progress') {
                    if (app.status.toLowerCase() !== 'inprogress') return false;
                } else if (historyStatusFilter.toLowerCase() === 'confirmed') {
                    // Treat legacy 'Scheduled' as 'Confirmed'
                    const normalizedStatus = app.status.toLowerCase() === 'scheduled' ? 'confirmed' : app.status.toLowerCase();
                    if (normalizedStatus !== 'confirmed') return false;
                } else {
                    if (app.status.toLowerCase() !== historyStatusFilter.toLowerCase()) return false;
                }
            }

            // Search query filter: search by patient name, department, or reason for visit
            if (historySearch.trim() !== '') {
                const query = historySearch.toLowerCase();
                const patientName = app.patientName?.toLowerCase() ?? '';
                const department = app.doctorDepartment?.toLowerCase() ?? '';
                const reason = app.reasonForVisit?.toLowerCase() ?? '';
                if (!patientName.includes(query) && !department.includes(query) && !reason.includes(query)) {
                    return false;
                }
            }

            return true;
        });
    }, [appointments, showHistory, historySearch, historyStatusFilter]);

    return (
        <PageLayout className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
            {/* Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InsightCard title="Total Consults" value={stats.totalAppointments} icon={User} color="primary" isLoading={statsLoading} />
                <InsightCard title="Completed" value={stats.completedAppointments} icon={CheckCircle2} color="emerald" isLoading={statsLoading} />
                <InsightCard title="Upcoming" value={stats.upcomingAppointments} icon={Play} color="amber" isLoading={statsLoading} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit border border-slate-200/60 dark:border-slate-700">
                    <button
                        onClick={() => setShowHistory(false)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Active Schedule
                    </button>
                    <button
                        onClick={() => setShowHistory(true)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Clinical History
                    </button>
                </div>


            </div>

            {/* Main Content */}
            {isLoading ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-8">
                        <AppointmentSkeleton />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    <div className="lg:col-span-8 space-y-12">
                        {showHistory ? (
                            <section className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                        <History className="w-3.5 h-3.5" /> Historical Archive
                                    </h2>
                                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                                </div>

                                {/* Search and Filter Panel */}
                                <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border border-slate-100 dark:border-slate-800/60 shadow-sm animate-in fade-in duration-300">
                                    <div className="relative flex-1 group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Search by patient name, department, or reason..."
                                            value={historySearch}
                                            onChange={(e) => setHistorySearch(e.target.value)}
                                            className="w-full h-12 pl-12 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all dark:text-white"
                                        />
                                        {historySearch && (
                                            <button
                                                type="button"
                                                onClick={() => setHistorySearch('')}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative w-full sm:w-48 group">
                                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none" />
                                        <select
                                            value={historyStatusFilter}
                                            onChange={(e) => setHistoryStatusFilter(e.target.value)}
                                            className="w-full h-12 pl-12 pr-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="all" className="dark:bg-slate-900 font-black">All Statuses</option>
                                            <option value="confirmed" className="dark:bg-slate-900 font-black">Confirmed</option>
                                            <option value="completed" className="dark:bg-slate-900 font-black">Completed</option>
                                            <option value="cancelled" className="dark:bg-slate-900 font-black">Cancelled</option>
                                            <option value="overdue" className="dark:bg-slate-900 font-black">Overdue</option>
                                            <option value="no show" className="dark:bg-slate-900 font-black">No Show</option>
                                            <option value="in progress" className="dark:bg-slate-900 font-black">In Progress</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors">
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>

                                {filteredHistoryAppointments.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-6 animate-in fade-in duration-300">
                                        {filteredHistoryAppointments.map((app: AppointmentDTO) => (
                                            <DoctorAppointmentCard
                                                key={app.id}
                                                appointment={app}
                                                router={router}
                                                isHistory
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-sm h-[350px] flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner text-slate-300 dark:text-slate-700">
                                            <Search className="w-8 h-8" />
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                            {appointments.length === 0 ? 'Archive is Empty' : 'No Archive Matches'}
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                                            {appointments.length === 0
                                                ? 'No historical clinical sessions were found in our database.'
                                                : 'Your search criteria did not match any historical entries in this register.'}
                                        </p>
                                    </div>
                                )}
                            </section>
                        ) : appointments.filter((app: AppointmentDTO) => app.status !== 'Cancelled' && app.status !== 'Completed').length > 0 ? (
                            <div className="grid grid-cols-1 gap-6">
                                {appointments
                                    .filter((app: AppointmentDTO) => app.status !== 'Cancelled' && app.status !== 'Completed')
                                    .map((app: AppointmentDTO) => (
                                        <DoctorAppointmentCard
                                            key={app.id}
                                            appointment={app}
                                            router={router}
                                        />
                                    ))}
                            </div>
                        ) : (
                            <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 shadow-sm h-[550px] flex flex-col items-center justify-center">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <CalendarIcon className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    Empty Roster
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto font-bold text-xs uppercase tracking-widest">
                                    No appointments scheduled for {format(selectedDate, 'MMMM dd, yyyy')}.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Daily Analytics - Right Column */}
                    <div className="lg:col-span-4 space-y-6">

                        {!showHistory ? (
                            /* ── Interactive Calendar for Active Schedule ─────────────────────────── */
                            <div className="group relative p-[1px] rounded-[3rem] bg-gradient-to-br from-emerald-500/30 via-slate-200/10 to-primary/30 dark:from-emerald-500/20 dark:via-slate-800 dark:to-primary/20 shadow-premium overflow-hidden">
                                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] px-6 py-8 min-h-[550px] flex flex-col">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                                    <style>{`
                                        .rdp-root {
                                            --rdp-accent-color: #10b981;
                                            --rdp-accent-background-color: #10b98118;
                                            width: 100%;
                                            font-size: 11px;
                                        }
                                        .rdp-month { width: 100%; }
                                        .rdp-month_grid { width: 100%; border-collapse: separate; border-spacing: 2px; }
                                        .rdp-month_caption {
                                            display: none; 
                                        }
                                        .rdp-weekday {
                                            font-size: 0.5rem; font-weight: 900;
                                            text-transform: uppercase; letter-spacing: 0.1em;
                                            opacity: 0.4; padding-bottom: 0.4rem;
                                        }
                                        .rdp-weekday:nth-child(7) { color: #ef4444 !important; opacity: 1 !important; }
                                        .rdp-day { padding: 2px; }
                                        .rdp-day_button {
                                            width: 100%; aspect-ratio: 1;
                                            border-radius: 8px;
                                            font-size: 0.75rem; font-weight: 900;
                                            transition: all 0.2s cubic-bezier(.4,0,.2,1);
                                            border: 1px solid transparent; 
                                            cursor: pointer;
                                            background: rgba(148,163,184,0.04);
                                            color: inherit;
                                        }
                                        .rdp-day_button:not([disabled]) {
                                            background: rgba(148,163,184,0.04);
                                            color: inherit;
                                        }
                                        .rdp-day_button:hover:not([disabled]) {
                                            background: #10b98130; 
                                            color: #10b981; 
                                            transform: scale(1.1) translateY(-1px);
                                            box-shadow: 0 4px 12px #10b98125;
                                        }

                                        /* Selection Indicator (Subtle) */
                                        .rdp-selected .rdp-day_button {
                                            transform: scale(1.1);
                                            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
                                            background: rgba(148, 163, 184, 0.08) !important;
                                            opacity: 1 !important;
                                        }

                                        /* Appointment Indicator (Border Only) */
                                        .has-appointment .rdp-day_button {
                                            border: 2px solid #10b981 !important;
                                            color: #10b981 !important;
                                            background: transparent !important;
                                            opacity: 1 !important;
                                        }

                                        /* Today (Gray Border) */
                                        .rdp-today .rdp-day_button {
                                            border: 2px solid rgba(148, 163, 184, 0.4) !important;
                                            opacity: 1 !important;
                                        }

                                        /* Today + Appointment (Emerald Fill) */
                                        .rdp-today.has-appointment .rdp-day_button {
                                            background: #10b981 !important;
                                            color: white !important;
                                            border-color: #10b981 !important;
                                            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4) !important;
                                        }

                                        /* Hide Redundant Navigation */
                                        .rdp-nav {
                                            display: none !important;
                                        }

                                        /* Disabled */
                                        .rdp-disabled .rdp-day_button:not(.rdp-today) {
                                            opacity: 0.3 !important; 
                                            cursor: not-allowed !important; 
                                            background: transparent !important;
                                        }
                                        /* Saturday Holiday */
                                        .rdp-weekday:nth-child(7) { color: #811f1fff !important; opacity: 1 !important; }
                                        .rdp-week td:nth-child(7) .rdp-day_button { 
                                            color: #811f1fff !important; 
                                            font-weight: 1000 !important;
                                            opacity: 1 !important;
                                            background: transparent !important;
                                            border: none !important;
                                            box-shadow: none !important;
                                        }
                                        .rdp-outside .rdp-day_button { opacity: 0.1; }
                                    `}</style>

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div>
                                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-0.5">Planning For</p>
                                                <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tighter">
                                                    {format(calendarMonth, 'MMMM')}
                                                    <span className="text-slate-300 dark:text-slate-700 ml-1.5">{format(calendarMonth, 'yyyy')}</span>
                                                </h3>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => setCalendarMonth(addMonths(calendarMonth, -1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                                                >
                                                    <ChevronLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
                                                >
                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 mb-6">
                                            <DayPicker
                                                mode="single"
                                                selected={new Date(formattedDate + 'T12:00:00')}
                                                onSelect={(day) => { if (day) setSelectedDate(day); }}
                                                month={calendarMonth}
                                                onMonthChange={(month) => setCalendarMonth(startOfMonth(month))}
                                                disabled={(day) => isBefore(startOfDay(day), startOfDay(new Date()))}
                                                showOutsideDays
                                                modifiers={{
                                                    hasAppointment: (date) => appointmentDates.has(format(date, 'yyyy-MM-dd'))
                                                }}
                                                modifiersClassNames={{
                                                    hasAppointment: 'has-appointment'
                                                }}
                                                className="text-slate-900 dark:text-white m-0"
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-emerald-500 shrink-0">
                                                    <CalendarDays className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Current Date Scope</p>
                                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-none">
                                                        {format(selectedDate, 'eeee, MMMM d')}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#811f1f] shrink-0">
                                                    <Activity className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Standard Holiday</p>
                                                    <p className="text-[11px] font-bold text-[#811f1f] leading-none">
                                                        All Saturdays (Exclusive Red)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* ── Quick Access Card for Clinical History ─────────────────────── */
                            <div className="group relative p-[1px] rounded-[3rem] bg-gradient-to-br from-indigo-500/30 via-slate-200/10 to-primary/30 dark:from-indigo-500/20 dark:via-slate-800 dark:to-primary/20 shadow-premium overflow-hidden">
                                <div className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] px-8 py-10 min-h-[550px] flex flex-col">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50" />

                                    <div className="relative">
                                        <div className="flex items-center gap-3 mb-8">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                                                <FileText className="w-5 h-5 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase transition-colors group-hover:text-indigo-600">Quick Access</h3>
                                                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Rapid Identity Lookup</p>
                                            </div>
                                        </div>

                                        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                                        <div className="space-y-6">
                                            <div className="relative">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-2">Open Patient Records</label>
                                                <div className="relative group/select">
                                                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within/select:text-indigo-500 transition-colors" />
                                                    <select
                                                        onChange={(e) => {
                                                            if (e.target.value) {
                                                                router.push(`/doctor/patients/${e.target.value}`);
                                                            }
                                                        }}
                                                        className="w-full h-14 pl-12 pr-12 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer"
                                                    >
                                                        <option value="" className="bg-white dark:bg-slate-900">Select Patient Profile...</option>
                                                        {Array.from(new Map<string, string>(appointments.map((a: AppointmentDTO) => [a.patientId, a.patientName])).entries()).map(([id, name]) => (
                                                            <option key={id} value={id} className="bg-white dark:bg-slate-900">
                                                                {name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-[10px] text-slate-400 font-medium italic leading-relaxed px-2">
                                                Select a recorded patient from today's schedule to instantly view their clinical timeline and uploaded diagnostic files.
                                            </p>

                                            <div className="flex items-center gap-2 px-2">
                                                <div className="flex -space-x-2">
                                                    {[1, 2, 3].map((i: number) => (
                                                        <div key={i} className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                            <User className="w-2.5 h-2.5 text-slate-400" />
                                                        </div>
                                                    ))}
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                                    {new Set(appointments.map((a: AppointmentDTO) => a.patientId)).size} Clinical Identity Targets
                                                </span>
                                            </div>

                                            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block ml-2">Clinical Shortcuts</label>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        {[
                                                            { icon: LayoutDashboard, label: 'Metrics', color: 'text-emerald-500' },
                                                            { icon: Stethoscope, label: 'Protocol', color: 'text-indigo-500' },
                                                            { icon: History, label: 'Archive', color: 'text-amber-500' }
                                                        ].map((item, idx) => (
                                                            <button key={idx} className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50 hover:border-indigo-500/30 hover:bg-white dark:hover:bg-slate-800 transition-all group/btn">
                                                                <item.icon className={`w-4 h-4 mb-2 ${item.color} group-hover/btn:scale-110 transition-transform`} />
                                                                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tight">{item.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-2">Recently Synced</label>
                                                    <div className="space-y-2">
                                                        {appointments.slice(0, 2).map((app: AppointmentDTO) => (
                                                            <div key={app.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-700/30">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm">
                                                                        <User className="w-3.5 h-3.5 text-slate-400" />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{app.patientName}</p>
                                                                        <p className="text-[8px] text-slate-400 font-bold uppercase">{format(new Date(app.appointmentDate), 'MMM d')}</p>
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    onClick={() => router.push(`/doctor/patients/${app.patientId}`)}
                                                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-slate-300 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                                                >
                                                                    <ChevronRight className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


        </PageLayout>
    );
}

const InsightCard = ({ title, value, icon: Icon, color, isLoading = false }: { title: string; value: number; icon: any; color: string; isLoading?: boolean }) => {
    const colorStyles: Record<string, string> = {
        primary: 'text-primary bg-primary/5 border-primary/10',
        emerald: 'text-emerald-500 bg-emerald-500/5 border-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/5 border-amber-500/10',
        rose: 'text-rose-500 bg-rose-500/5 border-rose-500/10',
    };
    const style = colorStyles[color] || colorStyles.primary;

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-premium dark:shadow-none flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${style}`}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">{title}</p>
                {isLoading ? (
                    <Skeleton className="h-8 w-12 rounded-lg" />
                ) : (
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{value}</p>
                )}
            </div>
        </div>
    );
};

function DoctorAppointmentCard({
    appointment,
    router,
    isHistory = false,
}: {
    appointment: AppointmentDTO;
    router: ReturnType<typeof useRouter>;
    isHistory?: boolean;
}) {
    const [isCompleting, setIsCompleting] = useState(false);
    const [isMarkingNoShow, setIsMarkingNoShow] = useState(false);
    const queryClient = useQueryClient();
    const { confirm } = useConfirm();

    // ── Appointment time gate ──────────────────────────────────────────────
    const appointmentTime = new Date(normalizeUTC(appointment.appointmentDate));
    const now = new Date();
    const isConsultable = now >= appointmentTime && !isHistory;

    const canComplete = isConsultable && (appointment.status === "Confirmed" || appointment.status === "Scheduled" || appointment.status === "InProgress" || appointment.status === "Overdue");

    const handleMarkCompleted = async () => {
        const confirmed = await confirm({
            title: 'Complete Appointment',
            message: 'Complete this appointment without consultation notes? This cannot be undone.',
            confirmText: 'Complete',
            cancelText: 'Cancel',
            type: 'warning'
        });
        if (!confirmed) return;

        setIsCompleting(true);
        try {
            await appointmentsApi.completeAppointment(appointment.id, { consultationNotes: "" });
            toast.success("Appointment completed successfully.");
            queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
            queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats"] });
            queryClient.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || err?.message || "Failed to complete appointment.";
            toast.error(errMsg);
        } finally {
            setIsCompleting(false);
        }
    };



    const handleMarkNoShow = async () => {
        const confirmed = await confirm({
            title: 'Mark as No Show',
            message: 'Are you sure you want to mark this patient as a No Show? This will move the appointment out of the active schedule.',
            confirmText: 'Mark No Show',
            cancelText: 'Cancel',
            type: 'warning'
        });
        if (!confirmed) return;

        setIsMarkingNoShow(true);
        try {
            await appointmentsApi.markAsNoShow(appointment.id);
            toast.success("Appointment marked as No Show.");
            queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
            queryClient.invalidateQueries({ queryKey: ["doctor-appointment-stats"] });
            queryClient.invalidateQueries({ queryKey: ["doctor-appointments-all"] });
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || err?.message || "Failed to mark as No Show.";
            toast.error(errMsg);
        } finally {
            setIsMarkingNoShow(false);
        }
    };

    const statusStyles: Record<string, string> = {
        Confirmed: 'bg-emerald-50 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-400/20',
        Completed: 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 animate-[pulse_3s_ease-in-out_infinite]',
        Cancelled: 'bg-rose-50 dark:bg-rose-400/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-400/20',
        Overdue: 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200 dark:shadow-rose-900/20 font-black animate-pulse',
    };

    // Normalize legacy 'Scheduled' status → treat as 'Confirmed'
    const displayStatus = appointment.status === 'Scheduled' ? 'Confirmed' : appointment.status;

    const rawRelative = getRelativeTimeString(appointment.appointmentDate);
    const monthDay = format(new Date(appointment.appointmentDate), '(MMM d)').toUpperCase();

    // remove any existing (date)
    const cleanedRelative = rawRelative.replace(/\(.+\)/, '').trim();

    const displayTime = isHistory
        ? cleanedRelative.includes('ago')
            ? `${cleanedRelative} ${monthDay}`
            : cleanedRelative
        : '';

    const hasRealGender = appointment.patientGender &&
        appointment.patientGender.trim() !== '' &&
        appointment.patientGender.trim().toLowerCase() !== 'unknown' &&
        appointment.patientGender.trim().toLowerCase() !== 'unspecified';

    const hasRealAge = appointment.patientAge > 0 && appointment.patientAge < 120;

    return (
        <div className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200/60 dark:border-slate-800 px-8 py-7 flex flex-col md:flex-row items-center gap-8 hover:shadow-xl hover:border-primary/30 transition-all duration-300 relative shadow-premium dark:shadow-none overflow-hidden">
            <div className={`absolute left-0 top-4 bottom-4 w-1.5 rounded-full ${statusStyles[displayStatus]?.split(' ')[0] || 'bg-slate-100 dark:bg-slate-800'}`} />
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex flex-col items-center justify-center w-28 shrink-0 py-4 bg-slate-50 dark:bg-slate-800/80 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 transition-all group-hover:bg-primary/5 group-hover:border-primary/20 shadow-inner">
                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                    {formatLocalTime(appointment.appointmentDate, 'h:mm')}
                </span>
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                    {formatLocalTime(appointment.appointmentDate, 'a')}
                </span>
                <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 my-3 group-hover:bg-primary/30 transition-colors" />
                <div className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500" />
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">{appointment.duration}m</span>
                </div>
            </div>

            <div className="flex-1 min-w-0 space-y-4 text-center md:text-left">
                <div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-1">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight truncate uppercase">
                            {appointment.patientName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${statusStyles[displayStatus] || statusStyles.Confirmed}`}>
                            {displayStatus}
                        </span>
                    </div>

                    {isHistory && displayTime && (
                        <div className="text-[10px] font-black text-slate-500 dark:text-slate-400 mb-3">
                            {displayTime}
                        </div>
                    )}

                    {(hasRealGender || hasRealAge) && (
                        <div className="flex items-center justify-center md:justify-start gap-4 mb-3 text-slate-400 dark:text-slate-500">
                            {hasRealGender && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <User className="w-3 h-3 text-primary opacity-70" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">{appointment.patientGender}</span>
                                </div>
                            )}
                            {hasRealAge && (
                                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-700/50">
                                    <History className="w-3 h-3 text-primary opacity-70" />
                                    <span className="text-[9px] font-black uppercase tracking-wider">{appointment.patientAge} Years</span>
                                </div>
                            )}
                        </div>
                    )}

                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic max-w-lg">
                        "{appointment.reasonForVisit || 'i am sick'}"
                    </p>
                </div>

                {appointment.linkedRecordsCount > 0 && (
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                        {appointment.linkedRecords.slice(0, 3).map((rec, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-tighter transition-colors group-hover:bg-white dark:group-hover:bg-slate-900"
                            >
                                <FileText className="w-3 h-3 text-primary" />
                                <span className="truncate max-w-[120px]">{rec.recordFileName}</span>
                            </div>
                        ))}
                        {appointment.linkedRecordsCount > 3 && (
                            <span className="text-[9px] font-bold text-slate-400 tracking-widest px-2">
                                +{appointment.linkedRecordsCount - 3} OTHERS
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0 w-full md:w-44">
                <button
                    onClick={() => isConsultable && router.push(`/doctor/records/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}&source=appointment`)}
                    disabled={!isConsultable}
                    title={!isConsultable ? `Available at ${formatLocalTime(appointment.appointmentDate, 'h:mm a, MMM d')}` : 'Add consultation notes'}
                    className={`
                        group/btn relative flex-1 h-14 rounded-xl
                        border
                        transition-all duration-300
                        font-black text-[10px] uppercase tracking-[0.2em]
                        flex items-center justify-center gap-3
                        overflow-hidden
                        p-2
                        ${isConsultable
                            ? 'bg-secondary text-white border-primary hover:bg-primary/90 hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/20 cursor-pointer'
                            : 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60'
                        }
                    `}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <Stethoscope className={`w-4 h-4 transition-transform duration-500 ${isConsultable ? 'group-hover/btn:rotate-12' : ''}`} />
                    <span className="relative">Add Consultation</span>
                </button>


                {canComplete && (
                    <>
                        <button
                            onClick={handleMarkCompleted}
                            disabled={isCompleting}
                            className="
                                group/btn relative flex-1 h-14 rounded-xl
                                bg-emerald-500/10 dark:bg-emerald-500/5
                                border border-emerald-500/20 dark:border-emerald-500/10
                                text-emerald-600 dark:text-emerald-400
                                hover:bg-emerald-600 hover:text-white hover:border-emerald-600
                                transition-all duration-300
                                font-black text-[10px] uppercase tracking-[0.2em]
                                flex items-center justify-center gap-3
                                active:scale-95
                                overflow-hidden
                                cursor-pointer
                                p-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="absolute inset-0 border border-white/10 dark:border-white/5 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_4s_infinite] pointer-events-none" />
                            <div className="relative flex items-center gap-3 pointer-events-none">
                                <CheckCircle2 className="w-4 h-4 transition-transform duration-500 group-hover/btn:scale-110" />
                                <span className="relative">
                                    {isCompleting ? 'Completing...' : 'Mark Completed'}
                                </span>
                            </div>
                        </button>
                        <button
                            onClick={handleMarkNoShow}
                            disabled={isMarkingNoShow}
                            className="
                                group/btn relative flex-1 h-14 rounded-xl
                                bg-rose-500/10 dark:bg-rose-500/5
                                border border-rose-500/20 dark:border-rose-500/10
                                text-rose-600 dark:text-rose-400
                                hover:bg-rose-600 hover:text-white hover:border-rose-600
                                transition-all duration-300
                                font-black text-[10px] uppercase tracking-[0.2em]
                                flex items-center justify-center gap-3
                                active:scale-95
                                overflow-hidden
                                cursor-pointer
                                p-2
                                disabled:opacity-50 disabled:cursor-not-allowed
                            "
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" />
                            <div className="absolute inset-0 border border-white/10 dark:border-white/5 rounded-xl opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none" />
                            <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_4s_infinite] pointer-events-none" />
                            <div className="relative flex items-center gap-3 pointer-events-none">
                                <UserX className="w-4 h-4 transition-transform duration-500 group-hover/btn:scale-110" />
                                <span className="relative">
                                    {isMarkingNoShow ? 'Processing...' : 'No Show'}
                                </span>
                            </div>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}