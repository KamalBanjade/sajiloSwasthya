'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Fullscreen, Lock, FileKey } from 'lucide-react';
import { MedicalRecordResponseDTO } from '@/lib/api/medicalRecords';
import toast from 'react-hot-toast';
import axiosInstance from '@/lib/utils/axios';
import { motion, AnimatePresence } from 'framer-motion';

interface RecordPreviewModalProps {
    record: MedicalRecordResponseDTO;
    onClose: () => void;
}

export const RecordPreviewModal: React.FC<RecordPreviewModalProps> = ({ record, onClose }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isPdf = record.mimeType.toLowerCase().includes('pdf');

    useEffect(() => {
        const fetchFile = async () => {
            try {
                setLoading(true);
                const response = await axiosInstance.get(`patient/records/${record.id}/download`, {
                    responseType: 'blob'
                });

                const blob = new Blob([response.data], { type: response.headers['content-type'] });
                const url = URL.createObjectURL(blob);
                setBlobUrl(url);
            } catch (err: any) {
                console.error('Preview error:', err);
                toast.error('Failed to load preview');
                onClose();
            } finally {
                setLoading(false);
            }
        };

        fetchFile();

        return () => {
            if (blobUrl) URL.revokeObjectURL(blobUrl);
        };
    }, [record.id]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    const handleDownload = () => {
        if (!blobUrl) return;
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = record.originalFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="fixed inset-0 z-[100] flex items-center justify-center cursor-alias"
            >
                {/* Deep Blurred Background */}
                <motion.div
                    className="absolute inset-0 backdrop-blur-sm"
                    onClick={onClose}
                    title="Click outside to close"
                />

                {/* Floating Document */}
                <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{
                        type: "spring",
                        stiffness: 180,
                        damping: 20
                    }}
                    className={`relative flex items-center justify-center z-[105] pointer-events-none ${isPdf && blobUrl ? 'h-[92vh] aspect-[1/1.414]' : 'w-[92vw] h-[92vh] max-w-6xl max-h-[95vh]'}`}
                >
                    <div className="w-full h-full flex items-center justify-center pointer-events-auto">
                        {loading ? (
                            <motion.div
                                className="flex flex-col items-center justify-center space-y-8"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                {/* Advanced Decryption Animation */}
                                <div className="relative flex items-center justify-center">
                                    <motion.div
                                        className="absolute w-32 h-32 rounded-full border border-indigo-500/30 border-dashed"
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                    />
                                    <motion.div
                                        className="absolute w-24 h-24 rounded-full border-t-2 border-r-2 border-indigo-400/50"
                                        animate={{ rotate: -360 }}
                                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    />

                                    <div className="w-16 h-16 bg-slate-900 rounded-2xl border border-white/10 shadow-[0_0_40px_rgba(99,102,241,0.2)] flex items-center justify-center relative z-10">
                                        <motion.div
                                            animate={{ opacity: [0.5, 1, 0.5], scale: [0.95, 1.05, 0.95] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                                        >
                                            <Lock className="w-6 h-6 text-indigo-400" />
                                        </motion.div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex items-center gap-2 text-indigo-400">
                                        <FileKey className="w-4 h-4" />
                                        <span className="text-xs font-black uppercase tracking-[0.3em]">Decrypting Record</span>
                                    </div>
                                    <div className="flex gap-1.5 items-center justify-center">
                                        {[0, 1, 2].map((i) => (
                                            <motion.div
                                                key={i}
                                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                                className="w-1.5 h-1.5 rounded-full bg-indigo-500/80"
                                            />
                                        ))}
                                    </div>
                                    <p className="text-[10px] text-white/40 uppercase tracking-widest font-mono mt-2">
                                        Establishing secure tunnel...
                                    </p>
                                </div>
                            </motion.div>
                        ) : blobUrl ? (
                            isPdf ? (
                                <div className="w-full h-full overflow-hidden bg-white shadow-2xl rounded-sm drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]">
                                    <iframe
                                        src={`${blobUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-[102%] h-[102%] -ml-[1%] -mt-[1%] border-0 bg-transparent"
                                        title="PDF Preview"
                                    />
                                </div>
                            ) : (
                                <img
                                    src={blobUrl}
                                    alt="Preview"
                                    className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-[0_40px_40px_rgba(0,0,0,0.6)]"
                                />
                            )
                        ) : (
                            <div className="text-center text-white/60 space-y-6">
                                <Fullscreen className="w-16 h-16 text-white/20 mx-auto mb-6" />
                                <p className="text-lg font-medium">Preview not available</p>
                                <button
                                    onClick={handleDownload}
                                    className="px-6 py-3 bg-white text-black rounded-full font-medium hover:scale-95 transition"
                                >
                                    Download File
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};
