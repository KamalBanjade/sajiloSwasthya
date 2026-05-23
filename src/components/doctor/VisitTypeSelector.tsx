import { RefreshCw, PlusCircle } from 'lucide-react';

interface VisitTypeSelectorProps {
    lastDiagnosis?: string;
    daysSinceLastVisit: number;
    onContinue: () => void;
    onNewComplaint: () => void;
    selectedType: 'continue' | 'new';
}

export const VisitTypeSelector: React.FC<VisitTypeSelectorProps> = ({
    lastDiagnosis,
    daysSinceLastVisit,
    onContinue,
    onNewComplaint,
    selectedType
}) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={onContinue}
                    className={`group p-4 rounded-2xl border transition-all text-left relative overflow-hidden backdrop-blur-sm ${
                        selectedType === 'continue' 
                            ? "border-blue-500 bg-blue-600/5 shadow-lg shadow-blue-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-blue-500/20 bg-white/30 dark:bg-slate-900/40"
                    }`}
                >
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                selectedType === 'continue' ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                                <RefreshCw size={20} />
                            </div>
                            <div className="pr-6">
                                <h4 className="text-base font-black text-slate-900 dark:text-white mb-0.5">Continue Management</h4>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px]">
                                    Review and update existing treatment plan. Pre-filled with previous structure.
                                </p>
                            </div>
                        </div>
                        {selectedType === 'continue' && (
                            <div className="absolute top-0 right-0 p-3">
                                <div className="w-3 h-3 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </button>

                <button
                    onClick={onNewComplaint}
                    className={`group p-4 rounded-2xl border transition-all text-left relative overflow-hidden backdrop-blur-sm ${
                        selectedType === 'new' 
                            ? "border-emerald-500 bg-emerald-600/5 shadow-lg shadow-emerald-500/10" 
                            : "border-slate-100 dark:border-slate-800 hover:border-emerald-500/20 bg-white/30 dark:bg-slate-900/40"
                    }`}
                >
                    <div className="flex flex-col h-full justify-between relative z-10">
                        <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                                selectedType === 'new' ? "bg-emerald-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                            }`}>
                                <PlusCircle size={20} />
                            </div>
                            <div className="pr-6">
                                <h4 className="text-base font-black text-slate-900 dark:text-white mb-0.5">New Complaint</h4>
                                <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px]">
                                    Different issue from last visit. Start fresh assessment while keeping history.
                                </p>
                            </div>
                        </div>
                        {selectedType === 'new' && (
                            <div className="absolute top-0 right-0 p-3">
                                <div className="w-3 h-3 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                                    <div className="w-1 h-1 bg-white rounded-full" />
                                </div>
                            </div>
                        )}
                    </div>
                </button>
            </div>
        </div>
    );
};
