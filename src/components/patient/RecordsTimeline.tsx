'use client';

import React, { useState } from 'react';
import {
    GroupedMedicalRecordsDTO,
    MedicalRecordResponseDTO,
    RecordSectionDTO
} from '@/lib/api/medicalRecords';
import { RecordCard } from './RecordCard';
import {
    ChevronDown,
    ChevronUp,
    Search,
    Filter,
    Calendar,
    ArrowUpCircle,
    Clock
} from 'lucide-react';

interface RecordsTimelineProps {
    data: GroupedMedicalRecordsDTO;
    onDownload: (id: string, fileName: string) => void;
    onDelete: (id: string) => void;
    onEdit: (record: MedicalRecordResponseDTO) => void;
    onSubmit?: (record: MedicalRecordResponseDTO) => void;
    onView: (record: MedicalRecordResponseDTO, url: string) => void;
}

export const RecordsTimeline: React.FC<RecordsTimelineProps> = ({
    data,
    onDownload,
    onDelete,
    onEdit,
    onSubmit,
    onView
}) => {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

    const toggleSection = (period: string) => {
        setExpandedSections(prev => ({
            ...prev,
            [period]: prev[period] === false ? true : false
        }));
    };

    if (data.totalCount === 0) {
        return (
            <div className="text-center py-20 px-6 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl leading-none">
                    <Search className="w-12 h-12 text-slate-300" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">No Records Found</h2>
                <p className="text-xl font-bold text-slate-500 dark:text-slate-400">Your secure digital vault is currently empty.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12">
            {/* Minimal Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                        <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vault Summary</p>
                        <p className="text-sm font-black">{data.totalCount} Secured Records</p>
                    </div>
                </div>

                <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="flex items-center gap-2 px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl font-bold text-xs transition-all active:scale-95"
                >
                    <ArrowUpCircle className="w-4 h-4" />
                    TOP
                </button>
            </div>

            {/* Timeline Sections */}
            <div className="space-y-10">
                {data.sections.map((section) => (
                    <div key={section.timePeriod} className="relative">
                        {/* Compact Section Header */}
                        <div
                            className={`
                                sticky top-0 z-20 flex items-center justify-between 
                                p-4 mb-4 cursor-pointer select-none
                                transition-all duration-300
                                ${expandedSections[section.timePeriod] !== false
                                    ? 'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b-2 border-indigo-500'
                                    : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                border-t border-x first:rounded-t-2xl last:rounded-b-2xl border-slate-100 dark:border-slate-800
                            `}
                            onClick={() => toggleSection(section.timePeriod)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center
                                    ${section.timePeriod === 'THIS_WEEK' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-500'}
                                `}>
                                    <ClockIcon className="w-5 h-5" period={section.timePeriod} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {section.displayName}
                                    </h2>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">
                                        {section.recordCount} Items
                                    </p>
                                </div>
                            </div>

                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center 
                                transition-transform duration-300
                                ${expandedSections[section.timePeriod] !== false ? 'rotate-180 bg-slate-100 dark:bg-slate-800' : ''}
                            `}>
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                            </div>
                        </div>

                        {/* Records List */}
                        {expandedSections[section.timePeriod] !== false && (
                            <div className="grid grid-cols-1 gap-4 px-2 animate-in fade-in slide-in-from-top-2 duration-300 mb-8 mt-2">
                                {section.records.map((record) => (
                                    <RecordCard
                                        key={record.id}
                                        record={record}
                                        onDownload={onDownload}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                        onSubmit={onSubmit}
                                        onView={onView}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClockIcon = ({ period, className }: { period: string; className?: string }) => {
    switch (period) {
        case 'THIS_WEEK':
            return <Calendar className={className} />;
        case 'THIS_MONTH':
            return <Calendar className={className} />;
        default:
            return <Clock className={className} />;
    }
};
