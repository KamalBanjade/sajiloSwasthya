'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, ShieldAlert, X } from 'lucide-react';

interface RegenerateKeysModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    doctorName: string;
}

export const RegenerateKeysModal: React.FC<RegenerateKeysModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    doctorName
}) => {
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);

    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (confirmText !== 'REGENERATE') return;

        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Failed to regenerate keys:', error);
        } finally {
            setLoading(false);
            setConfirmText('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-amber-100 p-3 rounded-xl">
                            <ShieldAlert className="text-amber-600" size={24} />
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2">High-Friction Action Required</h3>
                    <p className="text-slate-600 text-sm mb-6">
                        You are about to regenerate RSA-2048 keys for <span className="font-semibold">{doctorName}</span>.
                        This action will invalidate all pre-certified records for this doctor and require them to sign future records with a new key.
                    </p>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                            Type "REGENERATE" to confirm
                        </label>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
                            placeholder="REGENERATE"
                        />
                    </div>

                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            className="flex-1 bg-amber-600 hover:bg-amber-700 border-none flex items-center justify-center gap-2"
                            disabled={confirmText !== 'REGENERATE' || loading}
                            onClick={handleConfirm}
                        >
                            {loading ? <RefreshCw className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                            Regenerate Keys
                        </Button>
                    </div>
                </div>

                <div className="bg-amber-50 px-6 py-3 flex items-center gap-2 text-amber-700 text-xs font-medium border-t border-amber-100">
                    <AlertTriangle size={14} />
                    This cannot be undone. Audit logs will be generated.
                </div>
            </div>
        </div>
    );
};
