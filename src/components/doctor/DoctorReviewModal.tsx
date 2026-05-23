'use client';

import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, FileText, Loader2, Search, User, File } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { doctorApi, medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import toast from 'react-hot-toast';
import { FullScreenRecordModal } from '@/components/ui/FullScreenRecordModal';

interface DoctorReviewModalProps {
    record: MedicalRecordResponseDTO;
    onClose: () => void;
    onSuccess: (updatedRecord: MedicalRecordResponseDTO) => void;
}

export const DoctorReviewModal = ({ record, onClose, onSuccess }: DoctorReviewModalProps) => {
    const queryClient = useQueryClient();
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [action, setAction] = useState<'certify' | 'reject' | null>(null);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handlePreview = async () => {
        setPreviewLoading(true);
        try {
            const url = await medicalRecordsApi.previewRecordForDoctor(record.id);
            if (url) setPreviewUrl(url);
        } catch (err) {
            // Toast is handled in API
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleCertify = async () => {
        setLoading(true);
        try {
            const response = await doctorApi.certifyRecord(record.id, notes);
            toast.success('Record certified successfully');
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.pendingRecords.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.dashboardStats() });
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to certify record');
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async () => {
        if (!notes.trim()) {
            toast.error('Please provide a rejection reason');
            return;
        }
        setLoading(true);
        try {
            const response = await doctorApi.rejectRecord(record.id, notes);
            toast.success('Record rejected and returned to patient');
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.pendingRecords.all() });
            queryClient.invalidateQueries({ queryKey: queryKeys.doctor.dashboardStats() });
            onSuccess(response.data);
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reject record');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
            <div className="bg-white dark:bg-slate-950 rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden border border-slate-200/50 dark:border-slate-800 animate-in fade-in zoom-in duration-300 mx-2">
                {/* Compact Header */}
                <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <FileText size={16} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black tracking-tight uppercase">Verify Record</h3>
                            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mt-0.5">Clinical Protocol</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Vertical Stack */}
                <div className="p-6 space-y-5">
                    {/* Patient & Document Brief */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Patient Details</label>
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <User size={14} className="text-primary" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate leading-none">{record.patientName || 'Anonymous Patient'}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tight">{record.recordType} Protocol</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">File Information</label>
                            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <File size={14} className="text-slate-400" />
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{record.originalFileName}</p>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1">{record.fileSizeFormatted} • {record.recordType}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePreview}
                            disabled={previewLoading}
                            className="w-full flex items-center justify-center space-x-2 h-10 bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all shadow-lg active:scale-[0.98] disabled:opacity-50"
                        >
                            {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                            <span>{previewLoading ? 'Decrypting...' : 'Review Document'}</span>
                        </button>
                    </div>

                    {!action ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setAction('reject')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/10 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 transition-all font-black text-[10px] uppercase tracking-widest group active:scale-95"
                                >
                                    <AlertCircle size={14} className="group-hover:scale-110 transition-transform" />
                                    <span>Reject</span>
                                </button>
                                <button
                                    onClick={() => setAction('certify')}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/10 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 transition-all font-black text-[10px] uppercase tracking-widest group active:scale-95"
                                >
                                    <CheckCircle size={14} className="group-hover:scale-110 transition-transform" />
                                    <span>Certify</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            {action === 'reject' && (
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest ml-1">
                                        Reason for Rejection
                                    </label>
                                    <textarea
                                        autoFocus
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/10 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 h-24 resize-none transition-all"
                                        placeholder="Briefly state why this record cannot be certified..."
                                    />
                                </div>
                            )}

                            {action === 'certify' && (
                                <div className="py-4 px-4 bg-emerald-50/10 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex items-center gap-4">
                                    <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                        <CheckCircle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirm Verification</h4>
                                        <p className="text-[10px] font-bold text-slate-500">I attest to the authenticity of this record.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={action === 'certify' ? handleCertify : handleReject}
                                    disabled={loading}
                                    className={`w-full h-11 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 ${action === 'certify'
                                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-600/20'
                                        : 'bg-rose-600 dark:bg-rose-500 text-white shadow-rose-600/20'
                                        }`}
                                >
                                    {loading ? <Loader2 size={14} className="animate-spin" /> : <span>Finalize {action === 'certify' ? 'Certification' : 'Rejection'}</span>}
                                </button>
                                <button
                                    onClick={() => { setAction(null); setNotes(''); }}
                                    className="w-full py-2 text-[9px] font-black text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 uppercase tracking-widest transition-colors"
                                >
                                    ← Choose Different Action
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Compact Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-primary animate-pulse"></span>
                        Encrypted Clinical Decision Terminal
                    </p>
                </div>
            </div>

            {/* Preview Modal remains same */}
            {previewUrl && (
                <FullScreenRecordModal
                    pdfUrl={previewUrl}
                    onClose={() => setPreviewUrl(null)}
                />
            )}
        </div>
    );
};

