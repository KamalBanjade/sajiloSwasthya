'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, ArrowRight, ClipboardList, 
    Clock, Star, ChevronRight, Activity, Search,
    Trash2, AlertTriangle, Loader2, Edit2
} from 'lucide-react';
import { templatesApi } from '@/lib/api/templatesApi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface SmartProtocolSuggestionProps {
    chiefComplaint: string;
    patientId: string;
    onSelect: (templateId: string) => void;
    onStartBlank: () => void;
}

export const SmartProtocolSuggestion: React.FC<SmartProtocolSuggestionProps> = ({
    chiefComplaint,
    patientId,
    onSelect,
    onStartBlank
}) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isExploringAll, setIsExploringAll] = React.useState(false);
    
    // Management states
    const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [editTemplate, setEditTemplate] = React.useState<any | null>(null);
    const [newName, setNewName] = React.useState('');
    const [isRenaming, setIsRenaming] = React.useState(false);

    const queryClient = useQueryClient();
    const { user } = useAuthStore();

    const { data, isLoading } = useQuery({
        queryKey: ['templates', 'suggest', chiefComplaint, patientId],
        queryFn: () => templatesApi.suggestTemplates({ chiefComplaint, patientId }),
        staleTime: 1000 * 60 * 5,
    });

    const allSuggestions = data?.data || [];
    const filteredSuggestions = allSuggestions.filter((s: any) => 
        s.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const suggestionsToShow = isExploringAll ? filteredSuggestions : filteredSuggestions.slice(0, 2);
    const hasMore = filteredSuggestions.length > 2;

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteConfirmId(id);
    };

    const handleEditClick = (e: React.MouseEvent, template: any) => {
        e.stopPropagation();
        setEditTemplate(template);
        setNewName(template.templateName);
    };

    const confirmDeletion = async () => {
        if (!deleteConfirmId) return;
        setIsDeleting(true);
        try {
            const res = await templatesApi.deleteTemplate(deleteConfirmId);
            if (res.success) {
                toast.success('Protocol permanently removed');
                queryClient.invalidateQueries({ queryKey: ['templates'] });
                setDeleteConfirmId(null);
            } else {
                toast.error(res.message || 'Failed to delete protocol');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete protocol');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleUpdateName = async () => {
        if (!editTemplate || !newName.trim()) return;
        setIsRenaming(true);
        try {
            const res = await templatesApi.updateTemplate(editTemplate.id, {
                templateName: newName.trim(),
                description: editTemplate.description,
                visibility: editTemplate.visibility,
                schema: editTemplate.schema
            });
            if (res.success) {
                toast.success('Protocol renamed successfully');
                queryClient.invalidateQueries({ queryKey: ['templates'] });
                setEditTemplate(null);
            } else {
                toast.error(res.message || 'Failed to rename protocol');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to rename protocol');
        } finally {
            setIsRenaming(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 backdrop-blur-sm">
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Suggested Protocols</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clinical assessment structures</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input 
                            type="text"
                            placeholder="Search protocols..."
                            className="bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all w-64 backdrop-blur-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {!isLoading && (
                        <button 
                            onClick={onStartBlank}
                            className="h-[42px] px-6 bg-slate-900 dark:bg-blue-600/10 hover:bg-slate-800 dark:hover:bg-blue-600 text-slate-400 dark:text-blue-400 hover:text-white border border-slate-800 dark:border-blue-500/20 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg shadow-blue-500/5"
                        >
                            Skip to Blank Form <ArrowRight size={14} />
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {isLoading ? (
                        [1, 2].map(i => (
                            <div key={i} className="h-28 bg-slate-900 animate-pulse rounded-2xl border border-slate-800" />
                        ))
                    ) : (
                        suggestionsToShow.map((template: any, index: number) => (
                            <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelect(template.id)}
                                className="group relative p-6 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800/50 hover:border-blue-500/50 rounded-3xl text-left transition-all hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                                        <ClipboardList size={22} />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {template.createdBy === user?.id && (
                                            <>
                                                <button 
                                                    onClick={(e) => handleEditClick(e, template)}
                                                    className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-500/10 rounded-xl transition-all"
                                                    title="Rename Protocol"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDeleteClick(e, template.id)}
                                                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                                                    title="Delete Protocol"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </>
                                        )}
                                        {template.usageCount > 10 && (
                                            <div className="flex items-center gap-1 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[9px] font-black text-amber-500 uppercase tracking-tight">
                                                <Star size={10} fill="currentColor" /> Popular Choice
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <h4 className="text-lg font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-1">
                                    {template.templateName}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-bold mb-4 uppercase tracking-wide opacity-60">
                                    {template.description || 'Predefined clinical assessment structure'}
                                </p>

                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                                        <Clock size={12} className="text-blue-500" /> {template.averageEntryTimeSeconds ? `${Math.round(template.averageEntryTimeSeconds / 60)} min` : '5 min'}
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg">
                                        <Activity size={12} className="text-emerald-500" /> {template.schema?.sections?.length || 0} Sections
                                    </div>
                                </div>

                                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-blue-500">
                                    <ChevronRight size={24} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {!isLoading && hasMore && (
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={() => setIsExploringAll(!isExploringAll)}
                        className="px-8 py-3 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-blue-500 hover:border-blue-500/30 transition-all flex items-center gap-2"
                    >
                        {isExploringAll ? "Show Suggested" : `Explore All Protocols (${filteredSuggestions.length})`}
                        <ChevronRight className={`transition-transform duration-300 ${isExploringAll ? '-rotate-90' : 'rotate-90'}`} size={16} />
                    </button>
                </div>
            )}

            {/* Standard Delete Confirmation Modal */}
            <Modal 
                isOpen={!!deleteConfirmId} 
                onClose={() => setDeleteConfirmId(null)}
                maxWidth="sm"
            >
                <div className="text-center">
                    <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-rose-500 border border-rose-500/20">
                        <AlertTriangle size={28} />
                    </div>
                    
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Delete Protocol?</h3>
                    <p className="text-xs font-bold text-slate-500 mb-8 max-w-[240px] mx-auto leading-relaxed">
                        This will permanently remove the protocol and all its clinical field definitions.
                    </p>

                    <div className="flex flex-col gap-2.5">
                        <Button 
                            className="w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-500 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-rose-500/20" 
                            onClick={confirmDeletion} 
                            isLoading={isDeleting}
                        >
                            Delete Forever
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600" 
                            onClick={() => setDeleteConfirmId(null)}
                            disabled={isDeleting}
                        >
                            Keep Protocol
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Rename Protocol Modal */}
            <Modal
                isOpen={!!editTemplate}
                onClose={() => setEditTemplate(null)}
                maxWidth="sm"
            >
                <div className="space-y-6">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-11 h-11 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-600 border border-blue-500/10">
                            <Edit2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Rename Protocol</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clinical Protocol</p>
                        </div>
                    </div>

                    <Input
                        label="New Protocol Name"
                        placeholder="e.g. Chronic Kidney Disease Review"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        autoFocus
                        className="h-11 text-sm"
                    />

                    <div className="pt-2 flex flex-col gap-2.5">
                        <Button 
                            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-500/20" 
                            onClick={handleUpdateName} 
                            isLoading={isRenaming}
                            disabled={!newName.trim() || newName === editTemplate?.templateName}
                        >
                            Save Changes
                        </Button>
                        <Button 
                            variant="ghost" 
                            className="w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600" 
                            onClick={() => setEditTemplate(null)}
                            disabled={isRenaming}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal>

            {!isLoading && allSuggestions.length === 0 && (
                <div className="p-8 bg-slate-950/30 rounded-2xl border border-dotted border-slate-800 flex flex-col items-center justify-center text-center">
                    <p className="text-slate-500 text-sm font-medium mb-4">No specific protocols match this chief complaint.</p>
                    <button 
                        onClick={onStartBlank}
                        className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                        Use Regular Form
                    </button>
                </div>
            )}
        </div>
    );
};
