'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
    X, 
    FileText, 
    Check, 
    RefreshCw, 
    Search,
    Info
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { medicalRecordsApi, MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import { appointmentsApi } from '@/lib/api/appointments';

interface LinkRecordsModalProps {
    appointmentId: string;
    patientId: string;
    alreadyLinkedItemIds?: string[];
    onClose: () => void;
    onSuccess: () => void;
}

interface SelectedRecord {
    id: string;
    notes: string;
}

export const LinkRecordsModal: React.FC<LinkRecordsModalProps> = ({ 
    appointmentId, 
    patientId, 
    alreadyLinkedItemIds = [], 
    onClose, 
    onSuccess 
}) => {
    const [selectedRecords, setSelectedRecords] = useState<SelectedRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const { data: recordsResponse, isLoading, error } = useQuery({
        queryKey: ['patient-records', patientId],
        queryFn: () => medicalRecordsApi.getPatientRecordsForDoctor(patientId),
    });

    const allRecords = recordsResponse?.data || [];
    
    // Filter out records already linked at higher level or filter them in display
    const availableRecords = allRecords.filter(r => 
        r.originalFileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.recordType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleRecord = (recordId: string) => {
        if (alreadyLinkedItemIds.includes(recordId)) return;
        
        setSelectedRecords(prev => {
            const exists = prev.find(r => r.id === recordId);
            if (exists) {
                return prev.filter(r => r.id !== recordId);
            } else {
                return [...prev, { id: recordId, notes: '' }];
            }
        });
    };

    const updateNotes = (recordId: string, notes: string) => {
        setSelectedRecords(prev => prev.map(r => 
            r.id === recordId ? { ...r, notes: notes.slice(0, 200) } : r
        ));
    };

    const handleLink = async () => {
        if (selectedRecords.length === 0) return;
        
        setIsLinking(true);
        setProgress({ current: 0, total: selectedRecords.length });
        
        let successCount = 0;
        let failCount = 0;

        for (const record of selectedRecords) {
            try {
                const result = await appointmentsApi.linkRecord(appointmentId, {
                    medicalRecordId: record.id,
                    notes: record.notes || 'Linked during consultation'
                });
                if (result.success) successCount++;
                else failCount++;
            } catch (err) {
                failCount++;
            }
            setProgress(prev => ({ ...prev, current: prev.current + 1 }));
        }

        setIsLinking(false);
        if (successCount > 0) {
            toast.success(`Successfully linked ${successCount} record(s)`);
            onSuccess();
        }
        if (failCount > 0) {
            toast.error(`Failed to link ${failCount} record(s)`);
        }
    };

    const isSelected = (id: string) => !!selectedRecords.find(r => r.id === id);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 h-[85vh]">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Link Medical Records</h3>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Subheader / Search */}
                <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search records by name or type..."
                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-transparent rounded-2xl font-medium text-sm focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Record List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-3">
                            <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Scanning Vault...</span>
                        </div>
                    ) : availableRecords.length > 0 ? (
                        availableRecords.map((record) => {
                            const linked = alreadyLinkedItemIds.includes(record.id);
                            const selected = isSelected(record.id);
                            const selRec = selectedRecords.find(r => r.id === record.id);

                            return (
                                <div 
                                    key={record.id}
                                    className={`relative group rounded-3xl border-2 transition-all p-4 ${
                                        linked ? 'opacity-60 bg-slate-50 border-slate-100 cursor-not-allowed' :
                                        selected ? 'bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-800' :
                                        'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                                    }`}
                                >
                                    <div 
                                        className={`flex items-start gap-4 ${linked ? '' : 'cursor-pointer'}`}
                                        onClick={() => toggleRecord(record.id)}
                                    >
                                        <div className={`mt-1 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                            linked ? 'bg-slate-200 border-slate-200' :
                                            selected ? 'bg-indigo-600 border-indigo-600' : 
                                            'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                        }`}>
                                            {(selected || linked) && <Check className="w-3.5 h-3.5 text-white" />}
                                        </div>
                                        
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="font-black text-slate-900 dark:text-white leading-tight">{record.originalFileName}</p>
                                                {linked && <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-200 px-2 py-0.5 rounded-full">Already Linked</span>}
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                                                <span>{record.recordType}</span>
                                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                                <span>{format(parseISO(record.uploadedAt), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Inline Notes Field for Selected Record */}
                                    {selected && !linked && (
                                        <div className="mt-4 pt-4 border-t border-indigo-100 dark:border-indigo-900/30 animate-in slide-in-from-top-2 duration-300">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Info className="w-3 h-3 text-indigo-400" />
                                                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Discussion Notes (Optional)</label>
                                            </div>
                                            <input 
                                                type="text" 
                                                placeholder="e.g., Discussed biopsy results during visit"
                                                className="w-full px-4 py-2 bg-white dark:bg-slate-800/50 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                                value={selRec?.notes || ''}
                                                onChange={(e) => updateNotes(record.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-2">
                            <span className="text-sm font-bold text-slate-400">No records found for this patient.</span>
                        </div>
                    )}
                </div>

                {/* Footer with Linked Summary and Actions */}
                <div className="p-8 bg-slate-50/80 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 space-y-6">
                    {alreadyLinkedItemIds.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Already Linked:</span>
                            {allRecords.filter(r => alreadyLinkedItemIds.includes(r.id)).map(r => (
                                <div key={r.id} className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[9px] font-bold text-slate-500">
                                    <FileText className="w-2.5 h-2.5 text-indigo-400" />
                                    <span className="truncate max-w-[80px]">{r.originalFileName}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px]" 
                            onClick={onClose}
                            disabled={isLinking}
                        >
                            Cancel
                        </Button>
                        <Button 
                            className="flex-[2] h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 dark:shadow-none bg-indigo-600 hover:bg-indigo-700" 
                            onClick={handleLink}
                            isLoading={isLinking}
                            disabled={selectedRecords.length === 0}
                        >
                            {isLinking ? `Linking... (${progress.current}/${progress.total})` : `Link Selected Records (${selectedRecords.length})`}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
