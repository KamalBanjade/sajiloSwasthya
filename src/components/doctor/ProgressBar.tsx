import React from 'react';
import { motion } from 'framer-motion';
import { Check, User, Activity, BookOpen, Save } from 'lucide-react';

export type Step = 'patient' | 'vitals' | 'protocol' | 'summary';

interface ProgressBarProps {
    currentStep: Step;
    onStepClick?: (step: Step) => void;
}

const STEPS = [
    { id: 'patient', label: 'Patient', icon: User, activeColor: 'bg-slate-700', shadowColor: 'rgba(51,65,85,0.4)' },
    { id: 'vitals', label: 'Vitals', icon: Activity, activeColor: 'bg-rose-600', shadowColor: 'rgba(225,29,72,0.4)' },
    { id: 'protocol', label: 'Protocol', icon: BookOpen, activeColor: 'bg-amber-600', shadowColor: 'rgba(217,119,6,0.4)' },
    { id: 'summary', label: 'Save', icon: Save, activeColor: 'bg-emerald-600', shadowColor: 'rgba(5,150,105,0.4)' },
];

export const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, onStepClick }) => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    return (
        <div className="relative mb-8 pt-4">
            {/* Progress Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -translate-y-1/2 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-blue-500"
                    initial={{ width: '0%' }}
                    animate={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
                {STEPS.map((step, index) => {
                    const isActive = step.id === currentStep;
                    const isCompleted = index < currentIndex;
                    const Icon = step.icon;

                    return (
                        <div key={step.id} className="flex flex-col items-center">
                            <motion.div 
                                onClick={() => onStepClick?.(step.id as Step)}
                                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors z-10 cursor-pointer ${
                                    isActive 
                                        ? `${step.activeColor} border-white/20 text-white shadow-[0_0_15px_${step.shadowColor}]` 
                                        : isCompleted 
                                            ? 'bg-emerald-600 border-emerald-400 text-white' 
                                            : 'bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500'
                                }`}
                                animate={isActive ? { scale: 1.15 } : { scale: 1 }}
                                whileHover={{ scale: 1.1 }}
                            >
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </motion.div>
                            <span className={`mt-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
                                isActive ? 'text-white' : isCompleted ? 'text-emerald-500' : 'text-slate-500'
                            }`}>
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
