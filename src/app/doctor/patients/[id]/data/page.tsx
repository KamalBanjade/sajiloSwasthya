'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { doctorApi } from '@/lib/api';
import { ResponsiveTable } from '@/components/data-display/ResponsiveTable';
import {
    ChevronLeft, Database, Activity, ClipboardList,
    Calendar, User, Heart, AlertTriangle, Clock, RefreshCw, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function PatientDataTablePage() {
    const params = useParams();
    const router = useRouter();
    const patientId = params.id as string;
    const [currentPage, setCurrentPage] = React.useState(1);
    const [expandedRecords, setExpandedRecords] = React.useState<Record<string, boolean>>({});
    const pageSize = 10;

    const toggleExpansion = (id: string) => {
        setExpandedRecords(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const { data: recordsRes, isLoading, refetch, isFetching } = useQuery({
        queryKey: ['doctor', 'patient', patientId, 'records', 'health', 'tabular'],
        queryFn: () => healthRecordApi.getPatientRecords(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const { data: patientRes } = useQuery({
        queryKey: ['doctor', 'patient', patientId],
        queryFn: () => doctorApi.getPatientInfo(patientId),
        staleTime: 1000 * 60 * 5,
    });

    const records = (recordsRes as any)?.data || (recordsRes as any)?.Data || [];
    const patient = patientRes?.success ? patientRes.data : null;

    // Pagination Logic
    const totalPages = Math.ceil(records.length / pageSize);
    const paginatedRecords = React.useMemo(() => {
        return records.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    }, [records, currentPage]);

    const columns = [
        {
            header: "Date & Context",
            accessor: (row: any) => (
                <div className="flex flex-col gap-1.5 min-w-[130px]">
                    <div className="flex items-center gap-2 text-slate-900 dark:text-white font-black whitespace-nowrap">
                        <Calendar size={14} className="text-sky-500" />
                        {format(new Date(row.recordDate), 'MMM dd, yyyy')}
                    </div>
                    {row.appointmentId && (
                        <div className="text-[9px] font-black text-sky-600/60 dark:text-sky-400/60 uppercase tracking-widest flex items-center gap-1.5 bg-sky-500/5 px-2 py-0.5 rounded-md w-fit">
                            <Clock size={10} /> Appt-{row.appointmentId.slice(0, 5)}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Patient Info",
            accessor: (row: any) => (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-bold">
                        <User size={14} className="text-slate-400" />
                        {row.patientName || `${patient?.firstName} ${patient?.lastName}`}
                    </div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        ID: {row.patientId.slice(0, 12)}
                    </div>
                </div>
            )
        },
        {
            header: "Clinical Vitals",
            accessor: (row: any) => (
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 min-w-[250px] p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/50 shadow-sm backdrop-blur-sm">
                    <VitalRow label="BP" value={row.bloodPressure} isAbnormal={row.isBloodPressureAbnormal} />
                    <VitalRow label="HR" value={row.heartRate} isAbnormal={row.isHeartRateAbnormal} fallbackUnit="bpm" />
                    <VitalRow label="TEMP" value={row.temperature} isAbnormal={row.isTemperatureAbnormal} />
                    <VitalRow label="SPO2" value={row.spO2} isAbnormal={row.isSpO2Abnormal} fallbackUnit="%" />
                    {row.bmi && (
                        <div className="col-span-2 mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase">BMI Status</span>
                            <span className="text-[10px] font-black text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                {row.bmi} · {row.bmiCategory}
                            </span>
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Medical Data & Assessment",
            className: "min-w-[400px]",
            accessor: (row: any) => {
                const isExpanded = expandedRecords[row.id];
                const allSections = (row.sections || row.Sections || []) as any[];
                
                return (
                    <div className="space-y-4">
                        {/* Diagnosis & Complaint */}
                        <div className="flex flex-col gap-1.5 px-3 py-2 bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100/50 dark:border-sky-800/50 rounded-xl relative overflow-hidden group/diag">
                            <div className="absolute top-0 left-0 w-1 h-full bg-sky-500" />
                            <div className="flex items-center gap-1.5">
                                <Activity size={10} className="text-sky-500" />
                                <p className="text-[9px] font-black uppercase text-sky-600 tracking-widest">Clinical Diagnosis</p>
                            </div>
                            <p className="text-[11px] font-bold text-slate-800 dark:text-white leading-relaxed">
                                {row.diagnosis || 'General Clinical Review'}
                            </p>
                        </div>

                        {/* Protocol Sections */}
                        {allSections?.filter((s: any) => (s.attributes || s.Attributes)?.some((a: any) => (a.fieldValue || a.FieldValue)?.trim())).length > 0 && (
                            <div className="space-y-3">
                                {allSections
                                    .filter((s: any) => (s.attributes || s.Attributes)?.some((a: any) => (a.fieldValue || a.FieldValue)?.trim()))
                                    .map((section: any, idx: number) => {
                                        const attributes = (section.attributes || section.Attributes || [])
                                            ?.filter((attr: any) => (attr.fieldValue || attr.FieldValue)?.trim());
                                        
                                        const visibleAttributes = isExpanded ? attributes : attributes.slice(0, 6);
                                        const hasMore = attributes.length > 6;

                                        return (
                                            <div key={idx} className="p-4 bg-white dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm relative transition-all">
                                                <div className="flex items-center justify-between mb-3 border-b border-slate-50 dark:border-slate-800 pb-2">
                                                    <div className="flex items-center gap-2">
                                                        <ClipboardList size={12} className="text-slate-400" />
                                                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                                                            {section.sectionName || section.SectionName}
                                                        </p>
                                                    </div>
                                                    {hasMore && (
                                                        <button 
                                                            onClick={() => toggleExpansion(row.id)}
                                                            className="text-[9px] font-black text-sky-600 hover:text-sky-700 bg-sky-500/5 px-2 py-0.5 rounded-lg border border-sky-500/10 transition-colors uppercase tracking-widest cursor-pointer"
                                                        >
                                                            {isExpanded ? 'Show Less' : `+ ${attributes.length - 6} more metrics`}
                                                        </button>
                                                    )}
                                                </div>
                                                
                                                <div className="grid grid-cols-2 lg:grid-cols-2 gap-y-2.5 gap-x-6">
                                                    {visibleAttributes.map((attr: any, aIdx: number) => (
                                                        <ClinicalMetric 
                                                            key={aIdx}
                                                            label={attr.fieldLabel || attr.FieldLabel || attr.fieldName || attr.FieldName}
                                                            value={attr.fieldValue || attr.FieldValue}
                                                            unit={attr.fieldUnit || attr.FieldUnit}
                                                        />
                                                    ))}
                                                </div>

                                                {!isExpanded && hasMore && (
                                                    <div className="mt-3 pt-2 border-t border-slate-50 dark:border-slate-800 flex justify-center">
                                                        <button 
                                                            onClick={() => toggleExpansion(row.id)}
                                                            className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 hover:text-sky-600 transition-colors uppercase tracking-[0.2em] group"
                                                        >
                                                            Expand All Details
                                                            <Activity size={10} className="group-hover:animate-pulse" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="w-full flex-1 flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* ── HEADER ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => router.back()}
                            className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-sky-600 hover:border-sky-500/30 transition-all cursor-pointer shadow-sm group"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Longitudinal Medical Data</h1>
                                <div className="px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-[10px] font-black text-sky-600 uppercase tracking-widest hidden sm:block">
                                    Structured Table View
                                </div>
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                                <User size={12} className="text-emerald-600" />
                                <span className="opacity-60">Archive for:</span>
                                <span className="text-slate-900 dark:text-white bg-emerald-500/5 px-3 py-0.5 rounded-lg border border-emerald-500/10">
                                    {patient ? `${patient.firstName} ${patient.lastName}` : 'Loading Patient...'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className={`h-12 w-12 p-0 rounded-2xl text-slate-400 hover:text-sky-600 cursor-pointer ${isFetching ? 'animate-spin' : ''}`}
                    >
                        <RefreshCw size={20} />
                    </Button>
                    <div className="h-10 w-px bg-slate-100 dark:bg-slate-800 hidden md:block" />
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Counts</p>
                            <p className="text-sm font-black text-emerald-600 tracking-tighter">{records.length} Entries</p>
                        </div>
                        <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                            <Database size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── TABLE CONTAINER ── */}
            <div className="relative space-y-6">
                <div className="absolute -inset-4 bg-gradient-to-tr from-sky-500/5 to-emerald-500/5 blur-3xl rounded-[4rem] -z-10" />
                <ResponsiveTable
                    data={paginatedRecords}
                    columns={columns}
                    loading={isLoading}
                    keyExtractor={(row) => row.id}
                    renderMobileCard={(row) => (
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{format(new Date(row.recordDate), 'PPPP')}</p>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase">{row.diagnosis || 'Clinical Record'}</h4>
                                </div>
                                <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
                                    <ClipboardList size={20} />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-l-2 border-emerald-500 pl-3">Vital Stats</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <MobileVital label="Blood Pressure" value={row.bloodPressure} />
                                    <MobileVital label="Heart Rate" value={row.heartRate ? `${row.heartRate} bpm` : null} />
                                    <MobileVital label="Temperature" value={row.temperature ? `${row.temperature}°C` : null} />
                                    <MobileVital label="SpO2 Level" value={row.spO2 ? `${row.spO2}%` : null} />
                                </div>
                            </div>

                            <button
                                onClick={() => router.push(`/doctor/records/${row.id}`)}
                                className="w-full py-4 bg-slate-900 dark:bg-slate-800 hover:bg-sky-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg shadow-sky-500/10 cursor-pointer"
                            >
                                View Detailed Report
                            </button>
                        </div>
                    )}
                />

                {/* ── PAGINATION CONTROLS ── */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-4 rounded-[1.5rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-all hover:border-slate-200 dark:hover:border-slate-700">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Showing <span className="text-slate-900 dark:text-white font-black">{Math.min(records.length, (currentPage - 1) * pageSize + 1)}-{Math.min(records.length, currentPage * pageSize)}</span> of <span className="text-slate-900 dark:text-white font-black">{records.length}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="compact"
                                disabled={currentPage === 1}
                                onClick={() => {
                                    setCurrentPage(prev => Math.max(1, prev - 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-10 px-4 rounded-xl gap-2 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                <ChevronLeft size={16} />
                                Previous
                            </Button>
                            <div className="flex items-center gap-1.5 px-3">
                                <span className="text-xs font-black text-sky-600">{currentPage}</span>
                                <span className="text-[10px] font-bold text-slate-300">/</span>
                                <span className="text-xs font-bold text-slate-400">{totalPages}</span>
                            </div>
                            <Button
                                variant="outline"
                                size="compact"
                                disabled={currentPage === totalPages}
                                onClick={() => {
                                    setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="h-10 px-4 rounded-xl gap-2 transition-all disabled:opacity-30 cursor-pointer"
                            >
                                Next
                                <ChevronRight size={16} />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ClinicalMetric({ label, value, unit }: { label: string, value: string, unit?: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{label}</span>
            <span className="text-[10px] font-black text-slate-900 dark:text-slate-200 truncate">
                {value} {unit && !value.toLowerCase().includes(unit.toLowerCase()) && <span className="text-[8px] opacity-40 font-bold ml-0.5">{unit}</span>}
            </span>
        </div>
    );
}

function VitalRow({ label, value, isAbnormal, fallbackUnit }: { label: string, value: string | null, isAbnormal?: boolean, fallbackUnit?: string }) {
    if (!value) return null;

    // Clean up double units (e.g. "82 bpm bpm")
    let displayValue = value.trim();
    if (fallbackUnit && !displayValue.toLowerCase().includes(fallbackUnit.toLowerCase())) {
        displayValue = `${displayValue} ${fallbackUnit}`;
    }

    return (
        <div className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100/50 dark:border-slate-800/30 last:border-0 gap-3">
            <span className="text-slate-400 font-black uppercase tracking-widest text-[9px] whitespace-nowrap">{label}</span>
            <div className={`flex items-center gap-1.5 font-black tracking-tight whitespace-nowrap ${isAbnormal ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {displayValue}
                {isAbnormal && <AlertTriangle size={10} className="fill-rose-500/10 shrink-0" />}
            </div>
        </div>
    );
}

function MobileVital({ label, value }: { label: string, value: string | null }) {
    if (!value) return null;
    return (
        <div className="bg-slate-50 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
        </div>
    );
}
