'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Plus, AlertTriangle, Layers, Type, Hash, 
  CheckSquare, Calendar, List, Info, Database,
  Settings, Eye, ChevronRight, Check, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCreateCustomLabUnit } from '@/hooks/useLabUnitSearch';

interface AddCustomFieldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (field: any, sectionName: string) => void;
  existingSections: string[];
}

const FIELD_TYPES = [
  { value: 'Number', label: 'Clinical Value', desc: 'Numeric with units & ranges', icon: Hash, color: 'text-blue-500' },
  { value: 'Text', label: 'Short Note', desc: 'Single line observation', icon: Type, color: 'text-slate-500' },
  { value: 'LongText', label: 'Detailed Note', desc: 'Multi-line clinical notes', icon: List, color: 'text-amber-500' },
  { value: 'Boolean', label: 'Status/Toggle', desc: 'Yes/No or Present/Absent', icon: CheckSquare, color: 'text-emerald-500' },
  { value: 'Date', label: 'Date Pick', desc: 'Specific event timestamp', icon: Calendar, color: 'text-rose-500' },
  { value: 'Dropdown', label: 'Choice List', desc: 'Select from predefined options', icon: Database, color: 'text-violet-500' },
];

const COMMON_UNITS = [
  '', 'mg/dL', 'mmol/L', 'g/dL', '%', 'kg', 'cm', 'mmHg', 'bpm', '°F', '°C'
];

export function AddCustomFieldModal({ isOpen, onClose, onAdd, existingSections }: AddCustomFieldModalProps) {
  const [sectionType, setSectionType] = useState<'existing' | 'new'>('existing');
  const [selectedSection, setSelectedSection] = useState(existingSections[0] || '');
  const [newSectionName, setNewSectionName] = useState('');
  
  const [fieldLabel, setFieldLabel] = useState('');
  const [fieldType, setFieldType] = useState('Number');
  const [unit, setUnit] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [isRequired, setIsRequired] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState('');

  const activeFieldType = useMemo(() => 
    FIELD_TYPES.find(f => f.value === fieldType) || FIELD_TYPES[0]
  , [fieldType]);

  const createCustomMutation = useCreateCustomLabUnit();

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!fieldLabel) return;
    const finalSectionName = sectionType === 'existing' ? selectedSection : newSectionName;
    if (!finalSectionName) return;

    const newField = {
      field_name: fieldLabel.replace(/[^a-zA-Z0-9]/g, ''),
      field_label: fieldLabel,
      field_type: fieldType === 'LongText' ? 'Text' : fieldType,
      is_multiline: fieldType === 'LongText',
      unit: fieldType === 'Number' ? unit : undefined,
      normal_range_min: fieldType === 'Number' && min ? parseFloat(min) : undefined,
      normal_range_max: fieldType === 'Number' && max ? parseFloat(max) : undefined,
      is_required: isRequired,
      dropdown_options: fieldType === 'Dropdown' ? dropdownOptions.split(',').map(s => s.trim()).filter(s => s) : undefined
    };

    if (fieldType === 'Number') {
        createCustomMutation.mutate({
            measurementType: fieldLabel,
            commonUnits: unit ? [unit] : [],
            defaultUnit: unit,
            normalRangeLow: min ? parseFloat(min) : undefined,
            normalRangeHigh: max ? parseFloat(max) : undefined,
            category: 'Custom'
        });
    }

    onAdd(newField, finalSectionName);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
          onClick={onClose} 
        />
        
        {/* Modal Content */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative bg-white/80 dark:bg-slate-900/90 rounded-[2.5rem] shadow-premium border border-white/40 dark:border-slate-800/50 w-full max-w-4xl h-[min(800px,90vh)] overflow-hidden flex flex-col md:flex-row shadow-2xl backdrop-blur-2xl"
        >
          {/* Left Panel: Configuration */}
          <div className="flex-1 p-8 md:p-10 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* 1. Section Header */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600/10 dark:bg-blue-600/20 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-500/10">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">Define Clinical Attribute</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Step 1: Choose Location & Label</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Target Location Toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Protocol Section</label>
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">Placement</span>
                </div>
                <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-950/50 rounded-[1.25rem] border border-white/20 dark:border-slate-800/50 backdrop-blur-sm">
                  <button 
                    onClick={() => setSectionType('existing')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                      sectionType === 'existing' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Layers size={14} /> Existing Section
                  </button>
                  <button 
                    onClick={() => setSectionType('new')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                      sectionType === 'new' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Plus size={14} /> Create New
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={sectionType}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3"
                  >
                    {sectionType === 'existing' ? (
                      <select 
                        className="w-full h-12 bg-white/50 dark:bg-slate-950/50 border border-white/20 dark:border-slate-800/50 rounded-2xl px-4 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-blue-500/5 appearance-none cursor-pointer backdrop-blur-sm"
                        value={selectedSection}
                        onChange={(e) => setSelectedSection(e.target.value)}
                      >
                        {existingSections.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <Input 
                        placeholder="e.g. Kidney Function Assessment"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        className="h-12 rounded-2xl shadow-sm bg-white/50 border-white/20"
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Field Label */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Attribute Name (Doctor-facing Label)</label>
                <Input 
                  placeholder="e.g. Creatinine Level, Daily Fluid Intake..."
                  value={fieldLabel}
                  onChange={(e) => setFieldLabel(e.target.value)}
                  className="h-14 rounded-2xl text-lg font-bold placeholder:text-slate-300 shadow-sm"
                />
              </div>

              {/* Grid Type Picker */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Clinical Data Genre</label>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {FIELD_TYPES.map((type) => {
                    const isActive = fieldType === type.value;
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        onClick={() => setFieldType(type.value)}
                        className={`p-4 rounded-[1.5rem] border text-left transition-all duration-300 ${
                          isActive 
                            ? 'bg-white dark:bg-slate-800 border-blue-500/50 shadow-xl shadow-blue-500/5 ring-4 ring-blue-500/5' 
                            : 'bg-white/30 dark:bg-slate-950/30 border-white/40 dark:border-slate-800 hover:border-blue-500/30 backdrop-blur-sm'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${isActive ? 'bg-blue-600 text-white' : `bg-slate-100 dark:bg-slate-800 ${type.color}`}`}>
                          <Icon size={18} />
                        </div>
                        <p className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-blue-600' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</p>
                        <p className="text-[9px] text-slate-400 font-bold mt-1 line-clamp-1">{type.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Advanced Validation Card */}
              {(fieldType === 'Number' || fieldType === 'Dropdown' || true) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-950 p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-sm space-y-5"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Settings size={14} className="text-secondary" />
                    <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Clinical Validation & Logic</span>
                  </div>

                  {fieldType === 'Number' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                       <div className="flex flex-wrap gap-2">
                          {COMMON_UNITS.map(u => (
                            <button 
                              key={u} 
                              onClick={() => setUnit(u)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-black border transition-all ${
                                unit === u ? 'bg-secondary text-white border-secondary' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {u === '' ? 'No Unit' : u}
                            </button>
                          ))}
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <Input label="Normal Min" type="number" placeholder="Lower" value={min} onChange={e => setMin(e.target.value)} className="h-10 rounded-xl" />
                          <Input label="Normal Max" type="number" placeholder="Upper" value={max} onChange={e => setMax(e.target.value)} className="h-10 rounded-xl" />
                       </div>
                    </div>
                  )}

                  {fieldType === 'Dropdown' && (
                    <Input 
                      label="Selectable Options (Split by comma)"
                      placeholder="High, Medium, Low, Not Observed..."
                      value={dropdownOptions}
                      onChange={e => setDropdownOptions(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  )}

                  <label className="flex items-center gap-4 cursor-pointer group pt-2 border-t border-slate-50 dark:border-slate-900">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${isRequired ? 'bg-primary border-primary' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                        {isRequired && <Check size={14} className="text-white" />}
                        <input type="checkbox" className="hidden" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} />
                      </div>
                      <div className="flex-grow">
                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">Enforce Field Completeness</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Record cannot be finalized without this value</p>
                      </div>
                  </label>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Panel: Preview & Summary */}
          <div className="w-full md:w-[340px] bg-white dark:bg-slate-950 p-8 md:p-10 border-l border-white dark:border-slate-800 flex flex-col justify-between overflow-y-auto custom-scrollbar">
            <div>
              <div className="flex items-center gap-2 mb-8">
                <Eye size={16} className="text-primary" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Preview</span>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={`${fieldLabel}-${fieldType}-${unit}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-[#EBEEF2] dark:bg-slate-900 p-6 rounded-[2rem] border border-white dark:border-slate-800 shadow-inner relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Database size={80} />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const Icon = activeFieldType.icon;
                          return <Icon size={14} className="text-primary" />;
                        })()}
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest">{fieldType}</p>
                      </div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                        {fieldLabel || "Untitled Attribute"}
                        {isRequired && <span className="text-rose-500 ml-1 italic font-bold text-sm">*Required</span>}
                      </h4>
                    </div>

                    <div className="h-14 bg-white dark:bg-slate-950 rounded-2xl border border-white dark:border-slate-800 flex items-center px-4 justify-between shadow-premium hover:scale-[1.02] transition-transform cursor-text">
                      <span className="text-sm font-bold text-slate-300 italic">Expected Value...</span>
                      {unit && <span className="bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-lg text-[10px] font-black text-slate-400 border border-slate-100 dark:border-slate-800 uppercase">{unit}</span>}
                    </div>

                    {(min || max) && (
                      <div className="flex items-center gap-2 p-3 bg-white/50 dark:bg-slate-950/50 rounded-xl border border-white dark:border-slate-800">
                        <AlertTriangle size={12} className="text-amber-500" />
                        <p className="text-[9px] font-black text-slate-500 tracking-tight uppercase">
                          Ref Range: <span className="text-slate-900 dark:text-white">{min || '0'} – {max || '∞'}</span>
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10 flex items-start gap-3">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed text-primary/80 font-bold uppercase tracking-tight">
                  This attribute will be appended to <span className="text-primary font-black">"{sectionType === 'existing' ? selectedSection : newSectionName || 'New Section'}"</span>. It will be immediately available in the clinical form.
                </p>
              </div>
            </div>

            <div className="space-y-3 mt-10 md:mt-0">
              <Button 
                onClick={handleAdd} 
                disabled={!fieldLabel || (sectionType === 'new' && !newSectionName)}
                className="w-full h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-[1.25rem] text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 disabled:opacity-50 transition-all active:scale-95"
              >
                Insert to Record <ChevronRight size={18} />
              </Button>
              <button 
                onClick={onClose}
                className="w-full text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-[0.2em] transition-colors py-2"
              >
                Close Without Saving
              </button>
            </div>
          </div>

          {/* Close Icon (Top Right) */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:rotate-90 md:hidden"
          >
            <X size={20} />
          </button>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
