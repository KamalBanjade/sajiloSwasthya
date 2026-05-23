import React from 'react';
import { Info } from 'lucide-react';
import { ProtocolDTO } from '@/lib/api/healthRecordApi';

interface ProtocolProgressFormProps {
    protocol: ProtocolDTO;
    data: Record<string, string>;
    onChange: (section: string, field: string, value: string) => void;
}

export const ProtocolProgressForm: React.FC<ProtocolProgressFormProps> = ({
    protocol,
    data,
    onChange
}) => {
    return (
        <div className="space-y-10">
            {protocol.sections.map((section, sIdx) => (
                <div key={section.sectionName} className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                            <span className="text-xs font-black">{sIdx + 1}</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            {section.sectionName}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.fields.map((field) => {
                            const value = data[`${section.sectionName}_${field.fieldName}`] || '';
                            const isNumeric = field.fieldType === 'Number' || !!field.unit;
                            
                            return (
                                <div 
                                    key={field.fieldName}
                                    className="p-6 rounded-[2rem] bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-sm space-y-4 hover:border-indigo-500/20 transition-all"
                                >
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {field.fieldName.replace(/_/g, ' ')}
                                        </label>
                                        {field.unit && (
                                            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                                                {field.unit}
                                            </span>
                                        )}
                                    </div>

                                    <div className="relative">
                                        {isNumeric ? (
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all placeholder:text-slate-200"
                                                value={value}
                                                onChange={(e) => onChange(section.sectionName, field.fieldName, e.target.value)}
                                                placeholder="---"
                                            />
                                        ) : (
                                            <textarea
                                                className="w-full bg-slate-50/50 dark:bg-slate-950/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500/50 transition-all min-h-[100px] resize-none placeholder:text-slate-200"
                                                value={value}
                                                onChange={(e) => onChange(section.sectionName, field.fieldName, e.target.value)}
                                                placeholder="Observations..."
                                            />
                                        )}
                                    </div>

                                    {field.lastValue && (
                                        <div className="flex items-start gap-2 p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                                            <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-tight">Last Visit Value</p>
                                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {field.lastValue} {field.unit}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {field.normalRange && (
                                        <div className="flex items-center gap-2 px-1">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                Normal Range: {field.normalRange} {field.unit}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
