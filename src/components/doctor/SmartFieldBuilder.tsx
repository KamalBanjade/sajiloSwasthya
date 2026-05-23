'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Plus, X, Hash, Thermometer, Droplets, 
    Activity, Clipboard, Info, Check, PlusCircle, 
    Sparkles, Trash2, ArrowRight
} from 'lucide-react';
import { useLabUnitSearch, useCreateCustomLabUnit } from '@/hooks/useLabUnitSearch';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LabUnit } from '@/lib/api/labUnitsApi';

interface SmartFieldBuilderProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (field: any, sectionName: string) => void;
    sections: string[];
}

export const SmartFieldBuilder: React.FC<SmartFieldBuilderProps> = ({ 
    isOpen, 
    onClose, 
    onAdd, 
    sections 
}) => {
    const [search, setSearch] = useState('');
    const [selectedUnit, setSelectedUnit] = useState<LabUnit | null>(null);
    const [targetSection, setTargetSection] = useState(sections[0] || 'General Assessment');
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);
    const [isAddingSection, setIsAddingSection] = useState(false);
    const [newSectionName, setNewSectionName] = useState('');
    
    // Custom field states
    const [customLabel, setCustomLabel] = useState('');
    const [customUnit, setCustomUnit] = useState('');
    const [customType, setCustomType] = useState<'Number' | 'Text'>('Number');
    const [customMin, setCustomMin] = useState<string>('');
    const [customMax, setCustomMax] = useState<string>('');

    const { data: suggestions, isLoading } = useLabUnitSearch(search);
    const createCustomMutation = useCreateCustomLabUnit();

    const searchRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && searchRef.current) {
            searchRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSelectSuggestion = (unit: LabUnit) => {
        setSelectedUnit(unit);
        setSearch('');
        
        // Logical Grouping: Automatically set the target section to the unit's clinical category
        if (unit.category && unit.category !== 'General') {
            setTargetSection(unit.category);
        }
    };

    const handleAdd = () => {
        if (!selectedUnit && !customLabel) return;

        const field = selectedUnit ? {
            field_name: selectedUnit.measurementType.toLowerCase().replace(/\s+/g, '_'),
            field_label: selectedUnit.measurementType,
            field_type: 'Number',
            unit: selectedUnit.defaultUnit || selectedUnit.commonUnits[0],
            normal_range_min: selectedUnit.normalRangeLow,
            normal_range_max: selectedUnit.normalRangeHigh,
            is_from_standard: true
        } : {
            field_name: customLabel.toLowerCase().replace(/\s+/g, '_'),
            field_label: customLabel.charAt(0).toUpperCase() + customLabel.slice(1),
            field_type: customType,
            unit: customUnit,
            normal_range_min: (customType === 'Number' && customMin) ? parseFloat(customMin) : undefined,
            normal_range_max: (customType === 'Number' && customMax) ? parseFloat(customMax) : undefined,
            is_from_standard: false
        };

        if (!selectedUnit && customLabel && customType === 'Number') {
            createCustomMutation.mutate({
                measurementType: customLabel.charAt(0).toUpperCase() + customLabel.slice(1),
                commonUnits: [customUnit],
                defaultUnit: customUnit,
                normalRangeLow: customMin ? parseFloat(customMin) : undefined,
                normalRangeHigh: customMax ? parseFloat(customMax) : undefined,
                category: 'Custom'
            });
        }

        onAdd(field, targetSection);
        onClose();
        reset();
    };

    const reset = () => {
        setSearch('');
        setSelectedUnit(null);
        setCustomLabel('');
        setCustomUnit('');
        setCustomType('Number');
        setCustomMin('');
        setCustomMax('');
        setIsCreatingCustom(false);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    onClick={onClose}
                />

                <motion.div 
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-2xl bg-white/80 dark:bg-slate-900/90 border border-white/40 dark:border-slate-800/50 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col backdrop-blur-2xl"
                >
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-white/20 dark:border-slate-800/50 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-600/10 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-500/10">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Add Measurement</h3>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Search or define custom field</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-8 overflow-y-auto max-h-[70vh]">
                        {/* Target Section Selection */}
                        <div className="mb-8">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">Add to Section</label>
                            <div className="flex flex-wrap gap-2">
                                {sections.map(s => (
                                    <button 
                                        key={s}
                                        onClick={() => setTargetSection(s)}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                            targetSection === s 
                                                ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                                {isAddingSection ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            autoFocus
                                            className="bg-slate-800 border-slate-700 border rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-blue-500"
                                            placeholder="Section name..."
                                            value={newSectionName}
                                            onChange={e => setNewSectionName(e.target.value)}
                                            onKeyDown={e => {
                                                if (e.key === 'Enter' && newSectionName.trim()) {
                                                    setTargetSection(newSectionName);
                                                    setIsAddingSection(false);
                                                } else if (e.key === 'Escape') {
                                                    setIsAddingSection(false);
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                if (newSectionName.trim()) {
                                                    setTargetSection(newSectionName);
                                                    setIsAddingSection(false);
                                                }
                                            }}
                                            className="p-2 text-blue-400 hover:text-blue-300"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => setIsAddingSection(true)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold border border-dashed border-slate-700 text-slate-500 hover:border-slate-500 hover:text-slate-300 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={14} /> New Section
                                    </button>
                                )}
                            </div>
                        </div>

                        {!selectedUnit && !isCreatingCustom ? (
                            <div className="space-y-6">
                                {/* Search Box */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <Search size={20} />
                                    </div>
                                    <input 
                                        ref={searchRef}
                                        type="text"
                                        placeholder="Search measurement (e.g. HbA1c, Sodium, BP...)"
                                        className="w-full h-16 bg-white/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl pl-14 pr-6 text-lg font-bold text-slate-900 dark:text-white placeholder:text-slate-200 focus:border-blue-500/50 outline-none transition-all focus:ring-8 focus:ring-blue-500/5 backdrop-blur-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                    {isLoading && (
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                                        </div>
                                    )}
                                </div>

                                {/* Results */}
                                <div className="space-y-2">
                                    {suggestions?.length === 0 && search.length >= 2 && (
                                        <div className="flex flex-col items-center justify-center p-8 bg-slate-950/30 rounded-2xl border border-dotted border-slate-800">
                                            <p className="text-slate-500 font-medium mb-4 text-sm">No standardized measurement found for "{search}"</p>
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    setCustomLabel(search);
                                                    setIsCreatingCustom(true);
                                                }}
                                                className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                            >
                                                Create Custom Field
                                            </Button>
                                        </div>
                                    )}

                                    {suggestions?.map((unit: LabUnit) => (
                                        <motion.button
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={unit.id}
                                            onClick={() => handleSelectSuggestion(unit)}
                                            className="w-full p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between group transition-all"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-colors">
                                                    <Hash size={18} />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-slate-200">{unit.measurementType}</p>
                                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{unit.category}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {unit.defaultUnit && (
                                                    <span className="text-[10px] font-black text-slate-500 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg uppercase">
                                                        {unit.defaultUnit}
                                                    </span>
                                                )}
                                                <PlusCircle size={18} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                        </motion.button>
                                    ))}

                                    {!search && (
                                        <div className="grid grid-cols-2 gap-3 mt-4">
                                            <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 flex flex-col items-center text-center">
                                                <Activity className="text-blue-400 mb-2" size={24} />
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Smart Guidance</p>
                                                <p className="text-xs text-slate-500 mt-1">Search to see normal ranges and standard units.</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsCreatingCustom(true)}
                                                className="p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-2xl border border-slate-800 transition-all flex flex-col items-center text-center cursor-pointer group"
                                            >
                                                <Plus className="text-slate-500 group-hover:text-white mb-2" size={24} />
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 uppercase tracking-widest">Manual Setup</p>
                                                <p className="text-xs text-slate-600 group-hover:text-slate-500 mt-1">Define your own field, units and ranges.</p>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="space-y-6"
                            >
                                <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-sm font-bold text-blue-400 uppercase tracking-widest">Field Configuration</h4>
                                        <button onClick={reset} className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider flex items-center gap-1">
                                            <Trash2 size={12} /> Clear
                                        </button>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Measurement Label</label>
                                            <Input 
                                                value={selectedUnit ? selectedUnit.measurementType : customLabel}
                                                onChange={e => setCustomLabel(e.target.value)}
                                                disabled={!!selectedUnit}
                                                className="bg-slate-900 border-slate-800 h-12 rounded-xl font-bold"
                                                placeholder="e.g. Salt Intake"
                                            />
                                        </div>

                                        {!selectedUnit && (
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Value Type</label>
                                                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                                                    <button 
                                                        onClick={() => setCustomType('Number')}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${customType === 'Number' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        Number
                                                    </button>
                                                    <button 
                                                        onClick={() => setCustomType('Text')}
                                                        className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${customType === 'Text' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                                    >
                                                        Text / Observational
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {customType === 'Number' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Unit</label>
                                                    {selectedUnit ? (
                                                        <select className="w-full h-12 bg-slate-900 border border-slate-800 rounded-xl px-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500/20">
                                                            {selectedUnit.commonUnits.map(u => <option key={u} value={u}>{u}</option>)}
                                                        </select>
                                                    ) : (
                                                        <Input 
                                                            value={customUnit}
                                                            onChange={e => setCustomUnit(e.target.value)}
                                                            placeholder="mg/dL, %, etc"
                                                            className="bg-slate-900 border-slate-800 h-12 rounded-xl font-bold"
                                                        />
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Category</label>
                                                    <Input 
                                                        value={selectedUnit?.category || 'Custom'}
                                                        disabled
                                                        className="bg-slate-800 border-slate-800 h-12 rounded-xl font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {customType === 'Number' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Normal Low</label>
                                                    <Input 
                                                        type="number"
                                                        value={selectedUnit ? selectedUnit.normalRangeLow : customMin}
                                                        onChange={e => setCustomMin(e.target.value)}
                                                        className="bg-slate-900 border-slate-800 h-12 rounded-xl font-bold"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-bold text-slate-500 uppercase px-1">Normal High</label>
                                                    <Input 
                                                        type="number"
                                                        value={selectedUnit ? selectedUnit.normalRangeHigh : customMax}
                                                        onChange={e => setCustomMax(e.target.value)}
                                                        className="bg-slate-900 border-slate-800 h-12 rounded-xl font-bold"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <Button 
                                        onClick={handleAdd}
                                        className="flex-1 h-14 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20"
                                    >
                                        Add to Record <ArrowRight size={18} />
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={reset}
                                        className="h-14 border-slate-700 hover:bg-slate-800 rounded-2xl px-6 text-slate-400 font-bold"
                                    >
                                        Back
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
