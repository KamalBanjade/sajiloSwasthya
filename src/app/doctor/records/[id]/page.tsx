'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { 
    Loader2, ChevronLeft, Calendar, User, Stethoscope, 
    Activity, Heart, Thermometer, Droplets, Scale, 
    Ruler, ClipboardList, FileText, AlertCircle,
    Download, Printer, Share2, CornerUpLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/dateUtils';
import { useQuery } from '@tanstack/react-query';
import { RecordDetailSkeleton } from '@/components/ui/RecordDetailSkeleton';

function RecordContent() {
    const params = useParams();
    const router = useRouter();
    const recordId = params.id as string;
    
    const { data: recordRes, isLoading } = useQuery({
        queryKey: ['doctor', 'records', recordId],
        queryFn: () => healthRecordApi.getRecord(recordId),
        staleTime: 1000 * 60 * 5,
    });

    const record = recordRes?.success ? recordRes.data : null;

    const handlePrint = () => {
        window.print();
    };

    if (isLoading) {
        return (
            <RecordDetailSkeleton />
        );
    }

    if (!record) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12">
                <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mb-6">
                    <AlertCircle className="w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 uppercase">Record Not Found</h2>
                <button 
                    onClick={() => router.back()}
                    className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                    <CornerUpLeft size={18} /> Go Back
                </button>
            </div>
        );
    }

    const vitals = [
        { label: 'Pulse Rate', value: record.heartRate ? `${record.heartRate} BPM` : '--', icon: <Heart size={16} />, color: 'rose' },
        { label: 'Blood Pressure', value: record.bloodPressure || '--/--', icon: <Activity size={16} />, color: 'indigo' },
        { label: 'Temperature', value: record.temperature ? `${record.temperature} °C` : '--', icon: <Thermometer size={16} />, color: 'orange' },
        { label: 'SpO2', value: record.spO2 ? `${record.spO2}%` : '--', icon: <Droplets size={16} />, color: 'blue' },
        { label: 'Weight', value: record.weight ? `${record.weight} kg` : '--', icon: <Scale size={16} />, color: 'emerald' },
        { label: 'Height', value: record.height ? `${record.height} cm` : '--', icon: <Ruler size={16} />, color: 'amber' },
    ];

    return (
        <div className="w-full flex-1 flex flex-col space-y-8 animate-in fade-in duration-500 print:p-0 print:m-0">
            {/* ── HEADER ACTION BAR ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()}
                        className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-indigo-500/50 transition-all text-slate-400 hover:text-indigo-600 shadow-sm"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Consultation Summary</h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Digital Clinical Record</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        onClick={handlePrint}
                        className="h-11 px-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <Printer size={16} /> Print Report
                    </button>
                    <button className="h-11 px-5 rounded-xl bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none transition-all">
                        <Share2 size={16} /> Share Securely
                    </button>
                </div>
            </div>

            {/* ── RECORD METADATA ── */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <User size={12} /> Patient Identity
                        </p>
                        <h2 className="text-2xl font-black uppercase leading-none">{record.patientName}</h2>
                        <p className="text-xs font-bold text-slate-400">MRN: #{record.patientId.slice(0, 8)}</p>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                            <Stethoscope size={12} /> Attending Clinician
                        </p>
                        <h2 className="text-xl font-black uppercase leading-none">Dr. {record.doctorName}</h2>
                        <p className="text-xs font-bold text-slate-400">Certified Digital Record</p>
                    </div>

                    <div className="space-y-2 text-md-right">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 md:justify-end">
                            <Calendar size={12} /> Date of Record
                        </p>
                        <h2 className="text-xl font-black uppercase leading-none md:text-right">{formatDate(record.recordDate || record.createdAt)}</h2>
                        <p className="text-xs font-bold text-slate-400 md:text-right">Synced on {new Date(record.createdAt).toLocaleTimeString()}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* ── MAIN CONTENT ── */}
                <div className="lg:col-span-8 space-y-8">
                    {/* VITALS GRID */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-8 space-y-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg text-rose-500">
                                <Activity size={20} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Physiological Vitals</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {vitals.map((vital, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-2 group hover:border-indigo-500/30 transition-all">
                                    <div className={`p-2 w-fit rounded-lg bg-white dark:bg-white/5 text-slate-400 group-hover:text-indigo-500 transition-colors`}>
                                        {vital.icon}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{vital.label}</p>
                                        <p className="text-lg font-black text-slate-800 dark:text-slate-100">{vital.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CLINICAL IMPRESSIONS */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center gap-3 bg-indigo-50/30 dark:bg-indigo-900/10">
                            <ClipboardList className="text-indigo-600" />
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Clinical Impressions</h3>
                        </div>
                        <div className="p-8 space-y-8">
                            <section className="space-y-3">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Confirmed Diagnosis</label>
                                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-relaxed italic">
                                        {record.diagnosis ? `"${record.diagnosis}"` : "No diagnosis recorded for this consultation."}
                                    </p>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Recommended Treatment Plan</label>
                                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 prose dark:prose-invert max-w-none text-sm font-medium text-slate-600 dark:text-slate-300">
                                    {record.treatmentPlan ? record.treatmentPlan.split('\n').map((line: string, i: number) => (
                                        <p key={i}>{line}</p>
                                    )) : <p>No specific treatment plan documented.</p>}
                                </div>
                            </section>

                            {record.doctorNotes && (
                                <section className="space-y-3">
                                    <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Confidential Provider Notes</label>
                                    <div className="p-5 bg-amber-50/30 dark:bg-amber-900/5 rounded-2xl border border-amber-100/50 dark:border-amber-900/20 text-sm font-medium text-amber-900/70 dark:text-amber-200/50">
                                        {record.doctorNotes}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── SIDEBAR CONTENT ── */}
                <div className="lg:col-span-4 space-y-8">
                    {/* CUSTOM SECTIONS */}
                    {record.sections && record.sections.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                                <FileText size={14} /> Additional Modules
                            </h4>
                            {record.sections.map((section: any, sIdx: number) => (
                                <div key={sIdx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
                                    <h5 className="text-sm font-black text-indigo-600 uppercase border-b border-indigo-50 pb-3">{section.sectionName}</h5>
                                    <div className="space-y-3">
                                        {section.attributes.map((attr: any, aIdx: number) => (
                                            <div key={aIdx} className="flex justify-between items-center gap-4">
                                                <span className="text-xs font-bold text-slate-400">{attr.name}</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200 text-right">{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ACTIONS CARD */}
                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100 dark:shadow-none space-y-6">
                        <h4 className="text-lg font-black uppercase">Clinician Tools</h4>
                        <div className="space-y-3">
                            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group">
                                <div className="flex items-center gap-3">
                                    <Download size={18} className="text-indigo-200" />
                                    <span className="text-xs font-black uppercase">Export as PDF</span>
                                </div>
                                <ChevronLeft size={16} className="rotate-180 opacity-40 group-hover:opacity-100" />
                            </button>
                            <button className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 transition-all group opacity-50 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <CornerUpLeft size={18} className="text-indigo-200" />
                                    <span className="text-xs font-black uppercase">Request Revision</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ConsultationDetailPage() {
    return (
        <Suspense fallback={<RecordDetailSkeleton />}>
            <RecordContent />
        </Suspense>
    );
}
