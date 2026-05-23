'use client';

import React from 'react';
import {
    FileText,
    Download,
    Trash2,
    AlertCircle,
    CheckCircle,
    Clock,
    FileImage,
    ChevronRight,
    Search,
    Edit2,
    Loader2,
    SendHorizontal,
    UserCircle
} from 'lucide-react';
import { MedicalRecordResponseDTO, medicalRecordsApi } from '@/lib/api/medicalRecords';
import Link from 'next/link';
import { RecordVerificationBadge } from './RecordVerificationBadge';
import { getRelativeTimeString, formatDate } from '@/lib/utils/dateUtils';
import { Card } from '@/components/ui/Card';
import { Stack } from '@/components/ui/Stack';
import { Button } from '@/components/ui/Button';
import { Text, H3 } from '@/components/ui/Typography';

interface RecordCardProps {
    record: MedicalRecordResponseDTO;
    onDownload: (id: string, fileName: string) => void;
    onDelete: (id: string) => void;
    onEdit: (record: MedicalRecordResponseDTO) => void;
    onSubmit?: (record: MedicalRecordResponseDTO) => void;
    onView?: (record: MedicalRecordResponseDTO, url: string) => void;
}

const RecordCardInner: React.FC<RecordCardProps> = ({
    record,
    onDownload,
    onDelete,
    onEdit,
    onSubmit,
    onView
}) => {
    const [viewLoading, setViewLoading] = React.useState(false);
    const isPdf = record.mimeType.toLowerCase().includes('pdf');
    const isImage = record.mimeType.toLowerCase().includes('image');

    const handleViewClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onView) return;

        setViewLoading(true);
        try {
            const url = await medicalRecordsApi.previewRecord(record.id);
            if (url) onView(record, url);
        } catch (error) {
            // Handled by API
        } finally {
            setViewLoading(false);
        }
    };

    const getStatusConfig = (state: number) => {
        switch (state) {
            case 0: // Draft (or Rejected)
                return {
                    label: record.rejectionReason ? '⚠️ Action Required' : '📝 Draft',
                    colorClass: record.rejectionReason
                        ? 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400',
                    icon: record.rejectionReason ? <AlertCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />
                };
            case 1: // Pending
                return {
                    label: '⏳ Awaiting Review',
                    colorClass: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300',
                    icon: <Clock className="w-5 h-5" />
                };
            case 2: // Certified
                return {
                    label: '✅ Certified Authentic',
                    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400',
                    icon: <CheckCircle className="w-5 h-5" />
                };
            case 4: // Archived
                return {
                    label: '📁 Archived',
                    colorClass: 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-800 dark:text-slate-500',
                    icon: <Clock className="w-5 h-5" />
                };
            default:
                return {
                    label: record.stateLabel,
                    colorClass: 'bg-slate-100 text-slate-700 border-slate-200',
                    icon: <Clock className="w-5 h-5" />
                };
        }
    };

    const status = getStatusConfig(record.state);

    return (
        <Card
            className={`
                relative group overflow-hidden transition-all duration-300
                hover:shadow-md hover:translate-y-[-2px]
                ${record.rejectionReason ? 'border-rose-200 dark:border-rose-900/50' : ''}
            `}
        >
            {/* Compact Header: Status + Category + Doctor */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
                {record.state === 2 ? (
                    <RecordVerificationBadge recordId={record.id} isCertified={true} />
                ) : (
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-black border shadow-sm flex items-center justify-center gap-1 ${status.colorClass}`}>
                        <div className="flex items-center justify-center shrink-0 [&>svg]:w-3 [&>svg]:h-3">
                            {status.icon}
                        </div>
                        <span className="leading-none pt-[1px]">
                            {status.label.replace('✅ ', '').replace('⏳ ', '').replace('📝 ', '').replace('📁 ', '').replace('⚠️ ', '')}
                        </span>
                    </div>
                )}

                <div className="px-2 py-0.5 rounded-md bg-primary/5 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/10">
                    {record.recordType}
                </div>

                {(record.uploadedBy?.startsWith('Dr.') || record.assignedDoctorName || record.certifiedBy) && (
                    <div className="flex items-center gap-1.5 ml-auto md:ml-0 bg-emerald-50/50 dark:bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                        <span className="text-[9px] font-black text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-tight">Under</span>
                        {(record.certifiedById || record.assignedDoctorId) ? (
                            <Link
                                href={`/records/doctor/${record.certifiedById || record.assignedDoctorId}`}
                                className="text-xs text-emerald-800 dark:text-emerald-100 underline hover:no-underline font-black truncate max-w-[180px]"
                            >
                                {(() => {
                                    const name = (record.certifiedBy || record.assignedDoctorName || record.uploadedBy || '').trim();
                                    if (!name || name === 'Dr.') return 'Clinical Team';
                                    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
                                })()}
                            </Link>
                        ) : (
                            <span className="text-xs text-emerald-800 dark:text-emerald-100 font-black truncate max-w-[180px]">
                                {(() => {
                                    const name = (record.certifiedBy || record.assignedDoctorName || record.uploadedBy || '').trim();
                                    if (!name || name === 'Dr.') return 'Clinical Team';
                                    return name.startsWith('Dr.') ? name : `Dr. ${name}`;
                                })()}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Main Content Area: Simplified */}
            <Stack
                direction="row"
                align="center"
                spacing="sm"
                className="cursor-pointer group/content"
                onClick={handleViewClick as any}
            >
                <div className={`
                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                    shadow-sm border border-black/5 dark:border-white/5
                    ${record.uploadedBy?.startsWith('Dr.')
                        ? 'bg-secondary/10 text-secondary'
                        : isPdf ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20' :
                            isImage ? 'bg-primary/10 text-primary' :
                                'bg-slate-50 text-slate-600 dark:bg-slate-800'}
                `}>
                    {isPdf ? <FileText className="w-5 h-5" /> :
                        isImage ? <FileImage className="w-5 h-5" /> :
                            <FileText className="w-5 h-5" />}
                </div>

                <Stack direction="col" spacing="xs" className="min-w-0 flex-1">
                    <H3 className="text-sm md:text-base truncate font-black leading-tight text-slate-800 dark:text-slate-100">
                        {record.originalFileName}
                    </H3>
                    <Text variant="muted" className="text-[11px] font-bold uppercase tracking-tight opacity-70">
                        Uploaded on {formatDate(record.uploadedAt)}
                    </Text>
                </Stack>

                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/content:bg-indigo-600 group-hover/content:text-white transition-all scale-0 group-hover/content:scale-100 duration-200">
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
            </Stack>

            {/* Action Buttons */}
            <div className="flex flex-wrap md:flex-nowrap items-center w-full gap-2 mt-4">
                <Button
                    onClick={handleViewClick as any}
                    disabled={viewLoading}
                    aria-busy={viewLoading}
                    className="flex-1 bg-indigo-50/50 text-indigo-700 border border-indigo-200/50 dark:bg-indigo-500/5 dark:text-indigo-300 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all font-black py-2.5 h-auto gap-2 justify-center shadow-sm"
                >
                    {viewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {viewLoading ? 'Viewing...' : 'View'}
                </Button>

                {record.canDownload && (
                    <Button
                        onClick={() => onDownload(record.id, record.originalFileName)}
                        className="flex-1 bg-emerald-50/50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/5 dark:text-emerald-300 dark:border-emerald-500/20 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all font-black py-2.5 h-auto gap-2 justify-center shadow-sm"
                    >
                        <Download className="w-4 h-4" />
                        Download
                    </Button>
                )}

                {(record.state === 0 || record.state === 1) && (
                    <Button
                        onClick={() => onEdit(record)}
                        className="flex-1 bg-amber-50/50 text-amber-700 border border-amber-200/50 dark:bg-amber-500/5 dark:text-amber-300 dark:border-amber-500/20 hover:bg-amber-600 hover:text-white hover:border-amber-600 transition-all font-black py-2.5 h-auto gap-2 justify-center shadow-sm"
                    >
                        <Edit2 className="w-4 h-4" />
                        Edit
                    </Button>
                )}

                {record.state === 0 && onSubmit && (
                    <Button
                        variant="primary"
                        onClick={() => onSubmit(record)}
                        className="flex-1 h-auto py-2.5 gap-2 font-black shadow-lg shadow-indigo-500/20"
                    >
                        <SendHorizontal className="w-4 h-4" />
                        Submit
                    </Button>
                )}

                {record.state !== 4 && (
                    <Button
                        onClick={() => onDelete(record.id)}
                        className="flex-1 bg-rose-50/50 text-rose-700 border border-rose-200/50 dark:bg-rose-500/5 dark:text-rose-300 dark:border-rose-500/20 hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all font-black py-2.5 h-auto gap-2 justify-center shadow-sm"
                    >
                        <Trash2 className="w-4 h-4" />
                        Delete
                    </Button>
                )}
            </div>

            {/* Rejection Message if applicable */}
            {record.rejectionReason && (
                <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-100 dark:border-rose-900/30">
                    <Text variant="label" className="text-rose-800 dark:text-rose-300 mb-1">Feedback:</Text>
                    <Text variant="muted" className="text-rose-700 dark:text-rose-400 italic">
                        "{record.rejectionReason}"
                    </Text>
                </div>
            )}
        </Card>
    );
};

// Memoized export: prevents RecordCard from re-rendering when parent state
// changes (e.g. date filter, category toggle) — massive win for lists of 10+ cards.
export const RecordCard = React.memo(RecordCardInner);
