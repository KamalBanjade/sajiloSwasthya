import { Activity, Heart, Thermometer, Droplets, Weight, Ruler, Lock, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface VitalSigns {
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    spO2?: number;
}

interface VitalsComparisonFormProps {
    lastVitals?: VitalSigns;
    currentVitals: VitalSigns;
    onChange: (field: string, value: string) => void;
    lockedFields: string[];
    bmi?: string | null;
    bmiCategory?: { label: string; color: string } | null;
}

export const VitalsComparisonForm: React.FC<VitalsComparisonFormProps> = ({
    lastVitals,
    currentVitals,
    onChange,
    lockedFields,
    bmi,
    bmiCategory
}) => {
    const renderVital = (
        label: string, 
        field: keyof VitalSigns, 
        Icon: React.ElementType, 
        unit: string, 
        color: string
    ) => {
        const isLocked = lockedFields.includes(field.charAt(0).toUpperCase() + field.slice(1));
        const lastVal = lastVitals?.[field];
        const currentVal = currentVitals[field];
        
        let ComparisonIcon = null;
        let comparisonColor = "text-slate-400";
        
        if (lastVal && currentVal) {
            const diff = currentVal - lastVal;
            if (Math.abs(diff) < 0.1) {
                comparisonColor = "text-slate-400";
            } else {
                const isIncrease = diff > 0;
                ComparisonIcon = isIncrease ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />;
                
                // Medical Logic: Determine if increase or decrease is "better"
                const lowerIsBetter = ['weight', 'bloodPressureSystolic', 'bloodPressureDiastolic', 'heartRate', 'temperature'].includes(field);
                const higherIsBetter = ['spO2'].includes(field);

                if (lowerIsBetter) {
                    comparisonColor = isIncrease ? "text-rose-500" : "text-emerald-500";
                } else if (higherIsBetter) {
                    comparisonColor = isIncrease ? "text-emerald-500" : "text-rose-500";
                } else {
                    comparisonColor = isIncrease ? "text-blue-500" : "text-slate-500";
                }
            }
        }

        return (
            <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between h-full bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm ${
                isLocked ? "border-slate-100 dark:border-slate-800 opacity-80" : "border-slate-100 dark:border-slate-800 hover:border-blue-500/30"
            }`}>
                <div className="flex items-center justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                        <Icon size={20} />
                    </div>
                    {isLocked && (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <Lock size={14} />
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                    <div className="flex items-baseline gap-2">
                        <input
                            type="number"
                            disabled={isLocked}
                            className={`bg-transparent text-3xl font-black outline-none w-24 transition-all ${
                                isLocked ? "text-slate-400" : "text-slate-900 dark:text-white placeholder:text-slate-200"
                            }`}
                            value={currentVal || ''}
                            onChange={(e) => onChange(String(field), e.target.value)}
                            placeholder="---"
                        />
                        <span className="text-sm font-bold text-slate-400">{unit}</span>
                    </div>
                </div>

                {lastVal && (
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Historical Reference:</span>
                        <span className="text-xs font-black text-slate-500">{lastVal} {unit}</span>
                        {ComparisonIcon && (
                            <div className={`flex items-center gap-0.5 font-bold text-[10px] ${comparisonColor}`}>
                                {ComparisonIcon}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Special handling for BP */}
                <div className="sm:col-span-2 lg:col-span-1 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 backdrop-blur-md shadow-sm flex flex-col justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4">
                        <Activity size={20} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Blood Pressure</label>
                        <div className="flex items-baseline gap-2">
                            <input 
                                type="number" 
                                className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-200" 
                                value={currentVitals.bloodPressureSystolic || ''} 
                                onChange={(e) => onChange('bloodPressureSystolic', e.target.value)}
                                placeholder="SYS" 
                            />
                            <span className="text-slate-200 text-2xl">/</span>
                            <input 
                                type="number" 
                                className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-20 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-slate-200" 
                                value={currentVitals.bloodPressureDiastolic || ''} 
                                onChange={(e) => onChange('bloodPressureDiastolic', e.target.value)}
                                placeholder="DIA" 
                            />
                            <span className="text-sm font-bold text-slate-400">mmHg</span>
                        </div>
                    </div>
                    {lastVitals?.bloodPressureSystolic && (
                        <div className="mt-4 pt-4 border-t border-slate-100/50 dark:border-slate-800 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Historical Reference:</span>
                            <span className="text-xs font-black text-slate-500">
                                {lastVitals.bloodPressureSystolic}/{lastVitals.bloodPressureDiastolic} mmHg
                            </span>
                        </div>
                    )}
                </div>

                {renderVital("Heart Rate", "heartRate", Heart, "bpm", "bg-blue-500/10 text-blue-500")}
                {renderVital("Temperature", "temperature", Thermometer, "°F", "bg-orange-500/10 text-orange-500")}
                {renderVital("SpO₂", "spO2", Droplets, "%", "bg-sky-500/10 text-sky-500")}
                {renderVital("Weight", "weight", Weight, "kg", "bg-indigo-500/10 text-indigo-500")}
                {renderVital("Height", "height", Ruler, "cm", "bg-emerald-500/10 text-emerald-500")}

                {/* BMI Card */}
                <div className={`p-6 rounded-[2rem] border transition-all flex flex-col justify-between h-full bg-blue-600/5 backdrop-blur-md shadow-sm border-blue-500/20`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                            <Activity size={20} />
                        </div>
                        {bmiCategory && (
                            <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 ${bmiCategory.color} border border-current opacity-80`}>
                                {bmiCategory.label}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Body Mass Index</label>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${bmi ? 'text-slate-900 dark:text-white' : 'text-slate-200'}`}>
                                {bmi || '---'}
                            </span>
                            <span className="text-sm font-bold text-slate-400">kg/m²</span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-blue-500/10 flex items-center gap-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight italic">
                            {bmi ? "Calculated automatically from weight & height" : "Enter weight and height to calculate"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
