'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { formatLocalTime, formatTime } from '@/lib/utils/dateUtils';
import { doctorApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Heart, Activity, Thermometer, Weight, Ruler, Droplets,
  Search, ScanLine, FileText, CheckCircle, AlertTriangle, Plus, ClipboardList,
  Layout, BookOpen, Save, ChevronRight, X, Sparkles, Clipboard,
  Clock, ArrowUpRight, ArrowDownRight, RefreshCw, Trash2, Pencil,
  History as HistoryIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserGroupIcon, CalendarDaysIcon } from '@heroicons/react/24/solid';
import { AddCustomFieldModal } from '@/components/doctor/AddCustomFieldModal';
import { TemplateBrowserModal } from '@/components/doctor/TemplateBrowserModal';
import { FormGrid } from '@/components/layout/ResponsiveGrid';
import toast from 'react-hot-toast';
import { healthRecordApi } from '@/lib/api/healthRecordApi';
import { templatesApi, VisibilityLevel } from '@/lib/api/templatesApi';
import { appointmentsApi, AppointmentDTO } from '@/lib/api/appointments';
import { FollowUpSchedulingModal, FollowUpData } from '@/components/consultation/FollowUpSchedulingModal';
import { ProgressBar, Step as FlowStep } from '@/components/doctor/ProgressBar';
import { CollapsibleSection } from '@/components/doctor/CollapsibleSection';
import { SmartFieldBuilder } from '@/components/doctor/SmartFieldBuilder';
import { SmartProtocolSuggestion } from '@/components/doctor/SmartProtocolSuggestion';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useVisitContext } from '@/hooks/useVisitContext';
import { VisitTypeSelector } from '@/components/doctor/VisitTypeSelector';
import { VitalsComparisonForm } from '@/components/doctor/VitalsComparisonForm';
import { ProtocolProgressForm } from '@/components/doctor/ProtocolProgressForm';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PatientInfo {
  id: string;
  name: string;
  age: number;
}

interface TemplateSection {
  section_name: string;
  display_order: number;
  fields: TemplateField[];
}

interface TemplateField {
  field_name: string;
  field_label: string;
  field_type: string;
  unit?: string;
  normal_range_min?: number;
  normal_range_max?: number;
  is_required: boolean;
  dropdown_options?: string[];
  last_value?: string;
  is_retired?: boolean;
  rename_history?: string[];
}

interface BaseVitalsForm {
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  temperature: string;
  weight: string;
  height: string;
  spO2: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

// ─── Vital Input Sub-Component ────────────────────────────────────────────

const vitalStatus = (type: string, value: string) => {
  if (!value) return null;
  const n = parseFloat(value);
  if (isNaN(n)) return null;
  switch (type) {
    case 'systolic': return n > 140 ? 'high' : n > 120 ? 'elevated' : 'normal';
    case 'diastolic': return n > 90 ? 'high' : n > 80 ? 'elevated' : 'normal';
    case 'hr': return n < 60 ? 'low' : n > 100 ? 'high' : 'normal';
    case 'temp': return n > 100.4 ? 'high' : n < 96.8 ? 'low' : 'normal';
    case 'spo2': return n < 95 ? 'low' : 'normal';
    default: return null;
  }
};

const VitalInput = ({ label, field, icon: Icon, type, unit, value, onChange }: {
  label: string, field: keyof BaseVitalsForm, icon: any, type: string, unit: string, value: string, onChange: (field: keyof BaseVitalsForm, value: string) => void
}) => {
  const status = vitalStatus(type, value);
  const statusColors: Record<string, string> = {
    high: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    elevated: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    low: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    normal: 'text-green-500 bg-green-50 dark:bg-green-900/20',
  };
  return (
    <div className={`relative flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 ${status && status !== 'normal'
      ? 'border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-900/10'
      : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30'
      }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${status === 'high' ? 'bg-red-100 text-red-500' :
        status === 'low' ? 'bg-blue-100 text-blue-500' :
          'bg-white dark:bg-gray-800 text-blue-500 shadow-sm'
        }`}>
        <Icon size={18} />
      </div>
      <div className="flex-grow min-w-0">
        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">{label}</label>
        <div className="flex items-baseline gap-1">
          <input
            type="number"
            className="bg-transparent text-2xl font-black text-gray-900 dark:text-white outline-none w-20 placeholder:text-gray-300"
            placeholder="—"
            value={value}
            onChange={e => onChange(field, e.target.value)}
          />
          {unit && <span className="text-xs text-gray-400 font-medium">{unit}</span>}
        </div>
      </div>
      {status && (
        <div className={`shrink-0 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${statusColors[status]}`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default function StructuredRecordEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // — Modal States
  const [isCustomFieldModalOpen, setIsCustomFieldModalOpen] = useState(false);
  const [activeSectionForCustomField, setActiveSectionForCustomField] = useState<string | null>(null);
  const [isTemplateBrowserOpen, setIsTemplateBrowserOpen] = useState(false);
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);

  // — Patient & Context
  const [patient, setPatient] = useState<PatientInfo | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [entrySource, setEntrySource] = useState<'qr' | 'directory' | 'appointment' | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // — Template State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | null>(null);
  const [localSections, setLocalSections] = useState<TemplateSection[]>([]);

  // — Field Data (flattened key: `${sectionName}_${fieldName}`)
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  // — Vitals
  const [baseVitals, setBaseVitals] = useState<BaseVitalsForm>({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRate: '',
    temperature: '',
    weight: '',
    height: '',
    spO2: ''
  });

  // — Notes & Saving
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [sourceTemplateId, setSourceTemplateId] = useState<string | null>(null);
  const [originalSchema, setOriginalSchema] = useState<any[]>([]);
  const [lastSavedRecordId, setLastSavedRecordId] = useState<string | null>(null);
  const [hasStructureChanges, setHasStructureChanges] = useState(false);
  const [latestRecord, setLatestRecord] = useState<any>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState<FlowStep>('patient');

  // — Field editing state
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [retiredFields, setRetiredFields] = useState<Array<{ sectionName: string; fieldName: string }>>([]);

  // — Follow-Up Flow
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isSchedulingFollowUp, setIsSchedulingFollowUp] = useState(false);
  const [todayAppointment, setTodayAppointment] = useState<AppointmentDTO | null>(null);

  // — Visit Context & Redesign
  const [overrideMode, setOverrideMode] = useState(false);
  const [visitOption, setVisitOption] = useState<'continue' | 'new'>('continue');
  const [isDerivedSession, setIsDerivedSession] = useState(false);

  const { data: visitContext } = useVisitContext(patient?.id);

  // Handle automatic chief complaint for follow-ups
  useEffect(() => {
    if (visitOption === 'continue' && visitContext?.type === 'FollowUp') {
      setChiefComplaint("Follow up on previous Diagnosis");
    }
  }, [visitOption, visitContext]);

  // — Pre-population Effect handles both Vitals and Protocol structures
  useEffect(() => {
    if (visitContext && visitOption === 'continue' && !overrideMode) {
      if (visitContext.prePopulateVitals && visitContext.vitalsComparison.suggested) {
        const s = visitContext.vitalsComparison.suggested;
        setBaseVitals({
          bloodPressureSystolic: s.bloodPressureSystolic?.toString() || '',
          bloodPressureDiastolic: s.bloodPressureDiastolic?.toString() || '',
          heartRate: s.heartRate?.toString() || '',
          temperature: s.temperature?.toString() || '',
          weight: s.weight?.toString() || '',
          height: s.height?.toString() || '',
          spO2: s.spO2?.toString() || ''
        });
      }

      if (visitContext.prePopulateProtocol && visitContext.protocolToLoad) {
        const p = visitContext.protocolToLoad;
        setSelectedTemplateName(p.templateName);

        const sections: TemplateSection[] = p.sections.map(s => ({
          section_name: s.sectionName,
          display_order: 1,
          fields: s.fields
            .filter((f: any) => !f.is_retired)  // exclude retired fields on load
            .map((f: any) => ({
              field_name: f.fieldName,
              field_label: f.fieldName.replace(/_/g, ' '),
              field_type: f.fieldType || 'Text',
              unit: f.unit,
              normal_range_min: f.normalRange ? parseFloat(f.normalRange.split('-')[0]) : undefined,
              normal_range_max: f.normalRange ? parseFloat(f.normalRange.split('-')[1]) : undefined,
              is_required: false
            }))
        }));
        setLocalSections(sections);
        setOriginalSchema(sections); // Set original schema for comparison
        setSourceTemplateId(p.id || null); // Set source template ID

        const initialData: Record<string, string> = {};
        p.sections.forEach(s => {
          s.fields.forEach(f => {
            if (f.lastValue) {
              initialData[`${s.sectionName}_${f.fieldName}`] = f.lastValue;
            }
          });
        });
        setTemplateData(prev => ({ ...prev, ...initialData }));
      }
    }
  }, [visitContext, visitOption, overrideMode]);

  // ─── Query Params ─────────────────────────────────────────────────────────

  useEffect(() => {
    const pId = searchParams.get('patientId');
    const source = searchParams.get('source');
    const apptId = searchParams.get('appointmentId');
    const fromQR = searchParams.get('fromQR');
    const stepParam = searchParams.get('step');

    if (source) setEntrySource(source as any);
    else if (fromQR === 'true') setEntrySource('qr');
    if (apptId) {
      setAppointmentId(apptId);
      loadAppointmentData(apptId);
    }
    if (pId) {
      loadPatientData(pId);
      if (!stepParam) setCurrentStep('vitals');
    }

    if (stepParam) {
      setCurrentStep(stepParam as FlowStep);
    }
  }, [searchParams]);

  async function loadAppointmentData(id: string) {
    try {
      const res = await appointmentsApi.getAppointment(id);
      if (res.success && res.data) {
        setTodayAppointment(res.data);
      }
    } catch (err) {
      console.error('Failed to load appointment details', err);
    }
  }

  // ─── Data Loading ─────────────────────────────────────────────────────────

  async function loadPatientData(pId: string) {
    try {
      setIsLoading(true);
      const res = await doctorApi.getPatientInfo(pId);
      if (res.success && res.data) {
        setPatient({
          id: res.data.id,
          name: `${res.data.firstName} ${res.data.lastName}`,
          age: calculateAge(res.data.dateOfBirth)
        });
      }

      // Load latest record for cloning
      const recordsRes = await healthRecordApi.getPatientRecords(pId);
      if (recordsRes.success && recordsRes.data && recordsRes.data.length > 0) {
        setLatestRecord(recordsRes.data[0]);
        setAllRecords(recordsRes.data);
      } else {
        setLatestRecord(null);
        setAllRecords([]);
      }
    } catch {
      toast.error('Failed to load patient data');
    } finally {
      setIsLoading(false);
    }
  }

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  // ─── Computed ─────────────────────────────────────────────────────────────

  const bmi = React.useMemo(() => {
    const w = parseFloat(baseVitals.weight);
    const h = parseFloat(baseVitals.height) / 100;
    if (!w || !h) return null;
    return (w / (h * h)).toFixed(1);
  }, [baseVitals.weight, baseVitals.height]);

  const bmiCategory = React.useMemo(() => {
    if (!bmi) return null;
    const v = parseFloat(bmi);
    if (v < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (v < 25) return { label: 'Normal', color: 'text-emerald-500' };
    if (v < 30) return { label: 'Overweight', color: 'text-orange-500' };
    return { label: 'Obese', color: 'text-rose-500' };
  }, [bmi]);

  const getTrendColor = (fieldName: string, current: string, previous: string, min?: number, max?: number) => {
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (isNaN(curr) || isNaN(prev)) return 'bg-slate-500/10 text-slate-500';

    const diff = curr - prev;
    if (Math.abs(diff) < 0.001) return 'bg-blue-500/10 text-blue-500';

    const name = fieldName.toLowerCase();
    
    // 1. Core Heuristic Detection (Highest confidence for known clinical metrics)
    const lowerIsBetter = name.includes('blood pressure') || name.includes('weight') ||
      name.includes('heart rate') || name.includes('pulse') ||
      name.includes('glucose') || name.includes('cholesterol') ||
      name.includes('bmi') || name.includes('sugar') || name.includes('hba1c') ||
      name.includes('temperature') || name.includes('fever') || name.includes('ldl') ||
      name.includes('triglyceride') || name.includes('creatinine') || name.includes('urea');

    const higherIsBetter = name.includes('spo2') || name.includes('oxygen') ||
      name.includes('hemoglobin') || name.includes('lung') ||
      name.includes('capacity') || name.includes('function') || name.includes('hdl') ||
      name.includes('gfr') || name.includes('egfr');

    // 2. Clinical Range-Aware Refinement
    if (min !== undefined && max !== undefined) {
      const isCurrInRange = curr >= min && curr <= max;
      const isPrevInRange = prev >= min && prev <= max;

      // Moving from Outside -> Inside (Excellent)
      if (!isPrevInRange && isCurrInRange) return 'bg-emerald-500/10 text-emerald-500';
      // Moving from Inside -> Outside (Warning)
      if (isPrevInRange && !isCurrInRange) return 'bg-rose-500/10 text-rose-500';

      // Both Outside - follow midpoint logic
      const mid = (min + max) / 2;
      const isImproving = Math.abs(curr - mid) < Math.abs(prev - mid);
      if (!isCurrInRange && !isPrevInRange) {
        return isImproving ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
      }
      
      // Both Inside - if it's a known directional metric, follow heuristic
      // e.g. An increase in LDL even within range is often negative.
      if (lowerIsBetter) return diff < 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
      if (higherIsBetter) return diff > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';

      return 'bg-blue-500/10 text-blue-500';
    }

    // 3. Fallback Heuristics
    if (lowerIsBetter) return diff < 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';
    if (higherIsBetter) return diff > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500';

    return 'bg-blue-500/10 text-blue-500';
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleVitalsChange = (field: string, value: string) =>
    setBaseVitals(prev => ({ ...prev, [field as keyof BaseVitalsForm]: value }));

  const handleFieldChange = (section: string, field: string, value: string) =>
    setTemplateData(prev => ({ ...prev, [`${section}_${field}`]: value }));

  const handleUseTemplate = (t: any) => {
    // Helper to check for empty values
    const isEmpty = (val: string) => !val || val === "—" || val === "--";

    const rawSections: TemplateSection[] = (t.schema?.sections || t.sections || []).map(
      (s: any) => ({
        ...s,
        // Exclude retired fields and enrich with historical values
        fields: (s.fields ?? []).filter((f: any) => !f.is_retired).map((f: any) => {
          let lastKnownValue = "";
          
          // Search for the most recent non-empty value in patient history
          for (const prev of allRecords) {
            const historicAttr = prev.sections
              ?.flatMap((ps: any) => ps.attributes)
              ?.find((pa: any) => pa.fieldName === f.field_name);

            if (historicAttr && !isEmpty(historicAttr.fieldValue)) {
              lastKnownValue = historicAttr.fieldValue;
              break; 
            }
          }

          return {
            ...f,
            last_value: lastKnownValue
          };
        })
      })
    );

    setSelectedTemplateName(t.templateName || t.name);
    setSourceTemplateId(t.id);
    setLocalSections(rawSections);
    setOriginalSchema(rawSections);
    setTemplateData({});
    setHasStructureChanges(false);
    setIsDerivedSession(true);
    setOverrideMode(true);
    setCurrentStep('summary');
    toast.success(`Protocol "${t.templateName || t.name}" loaded!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloneLastRecord = async () => {
    if (!latestRecord) return;

    // Fetch current template schema to know which field_names are retired
    let retiredFieldNames = new Set<string>();
    if (latestRecord.templateId) {
      try {
        const templateRes = await templatesApi.getTemplate(latestRecord.templateId);
        if (templateRes.success && templateRes.data?.schema?.sections) {
          for (const section of templateRes.data.schema.sections) {
            for (const field of section.fields ?? []) {
              if (field.is_retired) retiredFieldNames.add(field.field_name);
            }
          }
        }
      } catch {
        // Non-blocking — if template fetch fails, clone all fields (safe default)
      }
    }

    // Map latestRecord sections to TemplateSection format, skipping retired fields
    const clonedSections = latestRecord.sections.map((s: any) => ({
      section_name: s.sectionName,
      display_order: s.displayOrder,
      fields: s.attributes
        .filter((a: any) => !retiredFieldNames.has(a.fieldName)) // skip retired
        .map((a: any) => {
          // Parse NormalRange string "min-max" back to min/max if possible
          let min, max;
          if (a.normalRange && a.normalRange.includes('-')) {
            const parts = a.normalRange.split('-').map((p: any) => p.trim());
            min = parseFloat(parts[0]);
            max = parseFloat(parts[1]);
          }

          // Find most recent non-empty value across ALL history
          let lastKnownValue = a.fieldValue;
          const isEmpty = (val: string) => !val || val === "—" || val === "--";

          if (isEmpty(lastKnownValue)) {
            for (const prev of allRecords.slice(1)) {
              // Flatten sections to find attribute by name
              const historicAttr = prev.sections
                ?.flatMap((ps: any) => ps.attributes)
                ?.find((pa: any) => pa.fieldName === a.fieldName);

              if (historicAttr && !isEmpty(historicAttr.fieldValue)) {
                lastKnownValue = historicAttr.fieldValue;
                break;
              }
            }
          }

          return {
            field_name: a.fieldName,
            field_label: a.fieldLabel,
            field_type: a.fieldType,
            unit: a.fieldUnit,
            normal_range_min: min,
            normal_range_max: max,
            is_from_standard: a.isFromTemplate,
            last_value: lastKnownValue
          };
        })
    }));

    setLocalSections(clonedSections);
    setSelectedTemplateName(`Follow-up (from ${new Date(latestRecord.recordDate).toLocaleDateString()})`);
    // Preserve the source template ID so the atomic retire/rename sync can fire on save
    setSourceTemplateId(latestRecord.templateId || null);

    setTemplateData({}); // Keep current data fresh/empty
    setHasStructureChanges(true);
    setIsDerivedSession(true);
    setOverrideMode(true);
    setCurrentStep('summary');
    toast.success('Previous record structure cloned for reference!');
  };

  const handleStartFromScratch = () => {
    setSelectedTemplateName(null);
    setSourceTemplateId(null);
    setLocalSections([{ section_name: 'General Assessment', display_order: 1, fields: [] }]);
    setTemplateData({});
    setHasStructureChanges(false);
    setIsDerivedSession(false);
    setOverrideMode(true);
    setCurrentStep('summary');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAddCustomField = (sectionName?: string) => {
    setActiveSectionForCustomField(sectionName || null);
    setIsCustomFieldModalOpen(true);
  };

  const handleAddCustomField = (field: TemplateField, sectionName: string) => {
    setHasStructureChanges(true);
    setLocalSections(prev => {
      const existing = prev.find(s => s.section_name === sectionName);
      if (existing) {
        return prev.map(s => s.section_name === sectionName
          ? { ...s, fields: [...s.fields, field] }
          : s
        );
      }
      return [...prev, { section_name: sectionName, display_order: prev.length + 1, fields: [field] }];
    });
  };

  const handleRemoveField = useCallback((
    sectionName: string,
    fieldName: string
  ) => {
    // 1. Remove from localSections so it disappears from the form
    setLocalSections(prev =>
      prev.map(section =>
        section.section_name !== sectionName
          ? section
          : {
              ...section,
              fields: section.fields.filter(
                f => f.field_name !== fieldName
              )
            }
      )
    );

    // 2. Remove value from templateData so it is not submitted
    const key = `${sectionName}_${fieldName}`;
    setTemplateData(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });

    // 3. Track which fields have been retired this session
    // (used later during atomic template update on record save)
    setRetiredFields(prev => [...prev, { sectionName, fieldName }]);

    // DO NOT set hasStructureChanges here — retirement is handled
    // atomically on save, not via the existing modal prompt flow
  }, []);

  const handleRenameField = useCallback((
    sectionName: string,
    fieldName: string,
    newLabel: string
  ) => {
    if (!newLabel.trim()) return;

    setLocalSections(prev =>
      prev.map(section =>
        section.section_name !== sectionName
          ? section
          : {
              ...section,
              fields: section.fields.map(f =>
                f.field_name !== fieldName
                  ? f
                  : {
                      ...f,
                      // Store old label in rename_history before updating
                      rename_history: [
                        ...(f.rename_history ?? []),
                        f.field_label
                      ],
                      field_label: newLabel.trim()
                    }
              )
            }
      )
    );

    // field_name (the key) does NOT change, only field_label changes
    // so templateData keys are unaffected
    setHasStructureChanges(true);
  }, []);

  const handleCompleteAndSave = async () => {
    if (!patient) {
      toast.error('Please identify a patient first');
      return;
    }
    if (currentStep !== 'summary') {
      toast.error('Please complete the observations first');
      return;
    }
    setIsSaving(true);
    try {
      const formattedSections = localSections.map(s => ({
        sectionName: s.section_name,
        attributes: s.fields.map(f => ({
          name: f.field_name,
          value: templateData[`${s.section_name}_${f.field_name}`] || '',
          unit: f.unit,
          normalRangeMin: f.normal_range_min,
          normalRangeMax: f.normal_range_max,
          fieldType: f.field_type
        }))
      }));

      const res = await healthRecordApi.createRecord({
        patientId: patient.id,
        appointmentId: appointmentId || undefined,
        vitals: {
          bloodPressureSystolic: parseInt(baseVitals.bloodPressureSystolic) || 0,
          bloodPressureDiastolic: parseInt(baseVitals.bloodPressureDiastolic) || 0,
          heartRate: parseInt(baseVitals.heartRate) || 0,
          temperature: parseFloat(baseVitals.temperature) || 0,
          weight: parseFloat(baseVitals.weight) || 0,
          height: parseFloat(baseVitals.height) || 0,
          spO2: parseInt(baseVitals.spO2) || 0
        },
        sections: formattedSections,
        diagnosis,
        treatmentPlan,
        doctorNotes,
        templateId: sourceTemplateId || undefined, // stamps TemplateId on the record so analysis can resolve the active template schema
        excludedFields: retiredFields.length > 0 ? retiredFields.map(rf => rf.fieldName) : undefined
      });

      if (res.success) {
        setLastSavedRecordId(res.data.id);

        // ── Step 2: Atomically retire deleted fields in the template schema ──
        // ONLY for brand-new sessions (not clones or templates).
        // Deleting a field in a CLONED session is patient-specific — it must NOT
        // mutate the shared global template (which would affect all other patients).
        // Patient-scoped exclusion is handled via ExcludedFields in the record payload below.
        if (retiredFields.length > 0 && sourceTemplateId && !isDerivedSession) {
          try {
            const templateRes = await templatesApi.getTemplate(sourceTemplateId);
            if (templateRes.success && templateRes.data?.schema) {
              const currentSchema = templateRes.data.schema;

              const updatedSchema = {
                sections: (currentSchema.sections ?? []).map((section: any) => ({
                  ...section,
                  fields: (section.fields ?? []).map((field: any) => {
                    const isRetired = retiredFields.some(
                      r =>
                        r.sectionName === section.section_name &&
                        r.fieldName === field.field_name
                    );
                    return isRetired ? { ...field, is_retired: true } : field;
                  })
                }))
              };

              // Await the retirement PUT fully before proceeding
              await templatesApi.updateTemplate(sourceTemplateId, {
                schema: updatedSchema
              });

              // Propagate any field renames into the schema in the same pass
              if (hasStructureChanges) {
                const schemaWithRenames = {
                  sections: updatedSchema.sections.map((section: any) => ({
                    ...section,
                    fields: section.fields.map((field: any) => {
                      const localField = localSections
                        .find(s => s.section_name === section.section_name)
                        ?.fields.find(f => f.field_name === field.field_name);
                      if (localField?.rename_history?.length) {
                        return {
                          ...field,
                          rename_history: localField.rename_history,
                          field_label: localField.field_label
                        };
                      }
                      return field;
                    })
                  }))
                };
                await templatesApi.updateTemplate(sourceTemplateId, { schema: schemaWithRenames });
              }

              setRetiredFields([]);
            }
          } catch (err) {
            // Non-blocking — record is already saved. Log but don't abort navigation.
            console.error('Template retirement update failed:', err);
          }
        }

        // ── Step 3: Invalidate ALL clinical analysis caches ──────────────
        // Must happen AFTER the retirement PUT resolves so the backend
        // serves fresh data that already reflects the schema change.
        await queryClient.invalidateQueries({ queryKey: ['clinical_summary',      patient.id] });
        await queryClient.invalidateQueries({ queryKey: ['clinical_trends',       patient.id] });
        await queryClient.invalidateQueries({ queryKey: ['clinical_correlations', patient.id] });
        await queryClient.invalidateQueries({ queryKey: ['clinical_patterns',     patient.id] });
        await queryClient.invalidateQueries({ queryKey: ['clinical_timeline',     patient.id] });

        // ── Step 4: Navigate ─────────────────────────────────────────────
        // Follow-up modal fires here — all async work above is complete.
        setIsFollowUpModalOpen(true);
        toast.success('Clinical record saved successfully!');
      }
    } catch {
      toast.error('Failed to save health record');
    } finally {
      setIsSaving(false);
    }
  };

  const navigateToStep = (step: FlowStep) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('step', step);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleNextStep = () => {
    if (currentStep === 'patient' && patient) navigateToStep('vitals');
    else if (currentStep === 'vitals') {
      const defaultValue = "Follow up on previous Diagnosis";
      const actualReason = chiefComplaint || (visitOption === 'continue' ? defaultValue : "");

      if (!actualReason && visitOption === 'new') {
        toast.error("Please enter a chief complaint");
        return;
      }

      // If continuing and no reason was typed, ensure the default is set
      if (visitOption === 'continue' && (!chiefComplaint || chiefComplaint.trim() === "")) {
        setChiefComplaint("Follow up on previous Diagnosis");
      }

      navigateToStep('protocol');
    }
    else if (currentStep === 'protocol' && (selectedTemplateName || localSections.length > 0)) {
      navigateToStep('summary');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'vitals') navigateToStep('patient');
    else if (currentStep === 'protocol') navigateToStep('vitals');
    else if (currentStep === 'summary') navigateToStep('protocol');
  };

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    { combo: { key: 's', ctrl: true }, callback: handleCompleteAndSave },
    { combo: { key: 'n', alt: true }, callback: () => openAddCustomField() },
    { combo: { key: 'ArrowRight', alt: true }, callback: handleNextStep },
    { combo: { key: 'ArrowLeft', alt: true }, callback: handlePrevStep },
  ]);

  const handleSaveTemplate = async (updateExisting: boolean = false) => {
    const finalName = newTemplateName.trim() || (sourceTemplateId ? selectedTemplateName : '');
    if (!finalName) { toast.error('Please enter a protocol name'); return; }

    setIsSavingTemplate(true);
    try {
      let res;
      if (updateExisting && sourceTemplateId) {
        // Update existing template
        res = await templatesApi.updateTemplate(sourceTemplateId, {
          templateName: finalName || '',
          visibility: VisibilityLevel.Private,
          schema: {
            sections: localSections.map((s, i) => ({
              section_name: s.section_name,
              display_order: i + 1,
              fields: s.fields.map((f, j) => ({ ...f, display_order: j + 1 }))
            }))
          }
        });
      } else if (lastSavedRecordId) {
        // Save from record (post-save flow)
        res = await templatesApi.createTemplateFromRecord(lastSavedRecordId, {
          templateName: finalName || '',
          visibility: VisibilityLevel.Private
        });
      } else {
        // Direct save from builder
        res = await templatesApi.createTemplate({
          templateName: finalName || '',
          description: `Custom protocol: ${finalName}`,
          visibility: VisibilityLevel.Private,
          schema: {
            sections: localSections.map((s, i) => ({
              section_name: s.section_name,
              display_order: i + 1,
              fields: s.fields.map((f, j) => ({ ...f, display_order: j + 1 }))
            }))
          }
        });
      }
      if (res.success) {
        toast.success(`Protocol "${newTemplateName}" saved to your library!`);
        setShowSaveTemplateModal(false);
        setNewTemplateName('');
        router.push(`/doctor/patients/${patient?.id || 'dashboard'}`);
      }
    } catch {
      toast.error('Failed to save protocol');
    } finally {
      setIsSavingTemplate(false);
    }
  };

  const handleFollowUpConfirm = async (data: FollowUpData | null) => {
    if (data && patient?.id) {
      setIsSchedulingFollowUp(true);
      try {
        const res = await appointmentsApi.scheduleFollowUp({
          originalAppointmentId: appointmentId || undefined,
          patientId: !appointmentId ? patient.id : undefined,
          preferredFollowUpDate: data.preferredDate.toISOString()
        });

        if (res.data?.wasScheduled) {
          toast.success(res.data.message || 'Follow-up scheduled!');
        } else {
          toast.error(res.data?.message || 'Failed to schedule follow-up');
        }
      } catch (err) {
        toast.error('Error connecting to scheduling service');
      } finally {
        setIsSchedulingFollowUp(false);
      }
    }

    // Always navigate away after follow-up choice (even if skipped or error)
    setIsFollowUpModalOpen(false);

    // Logic: Only prompt to save if we actually have changes AND we didn't just come from a blank/scratch unless explicitly requested.
    // However, if we modified an existing template (isDerivedSession), we SKIP the prompt to keep the workflow fast.
    if (hasStructureChanges && !isDerivedSession) {
      setShowSaveTemplateModal(true);
    } else {
      router.push(`/doctor/patients/${patient?.id || 'dashboard'}`);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="w-full flex-1 flex flex-col pb-24">
      <ProgressBar
        currentStep={currentStep}
        onStepClick={(step) => {
          // Allow clicking if patient is identified or if it's a previous step
          const steps: FlowStep[] = ['patient', 'vitals', 'protocol', 'summary'];
          const targetIdx = steps.indexOf(step);
          const currentIdx = steps.indexOf(currentStep);
          if (targetIdx < currentIdx || patient) {
            navigateToStep(step);
          }
        }}
      />

      <div className="space-y-6">
        {currentStep === 'patient' && (
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-premium border border-white dark:border-slate-800">
            <div className="max-w-xl mx-auto text-center space-y-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-slate-500/10 rounded-3xl flex items-center justify-center text-slate-500">
                  <UserGroupIcon className="w-10 h-10" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Identify Patient</h2>
                <p className="text-slate-500 font-medium mt-2">Search or scan to begin clinical documentation</p>
              </div>

              {!patient && (
                <div className="space-y-4">
                  <div className="relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={24} />
                    <input
                      className="w-full h-16 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[1.25rem] pl-16 pr-6 text-lg font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-300"
                      placeholder="Name, Hospital ID, or Phone..."
                      value={patientSearch}
                      onChange={e => setPatientSearch(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="lg" className="w-full h-16 rounded-[1.25rem] border-dashed text-slate-500 hover:text-blue-500 hover:border-blue-500" onClick={() => setPatient({ id: 'P-DEMO', name: 'Demo Patient', age: 45 })}>
                    <ScanLine size={20} className="mr-2" /> Scan Patient Code
                  </Button>
                </div>
              )}

              {patient && (
                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="p-6 bg-blue-500/5 rounded-[2rem] border border-blue-500/10 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                      {patient.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="text-left">
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-tight">{patient.name}</p>
                      <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Age {patient.age} · {patient.id}</p>
                    </div>
                  </div>
                  <button onClick={() => setPatient(null)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </motion.div>
              )}

              {patient && (
                <Button onClick={handleNextStep} className="w-full h-16 rounded-[1.25rem] bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                  Proceed to Vitals <ChevronRight className="ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}

        {currentStep === 'vitals' && (
          <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[3rem] p-8 md:p-12 shadow-premium border border-white/40 dark:border-slate-800/50 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                  <Activity size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-[0.02em]">Chief Complaint & Vitals</h2>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1 opacity-70">Step 2: Core Clinical Observations</p>
                </div>
              </div>

              {visitContext?.type === 'FollowUp' && !overrideMode && (
                <div className="bg-blue-600/5 border border-blue-500/10 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-sm animate-in fade-in zoom-in duration-500">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 shadow-md">
                        <RefreshCw size={16} />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Follow-up Visit</h3>
                        <p className="text-[9px] font-bold text-blue-600/70 dark:text-blue-400 leading-none mt-1 whitespace-nowrap">
                            Last seen {visitContext.daysSinceLastVisit} days ago 
                            {visitContext.lastDiagnosis && <span className="text-slate-400 font-medium ml-2">• Prev. Diagnosis: {visitContext.lastDiagnosis}</span>}
                        </p>
                    </div>
                </div>
              )}
            </div>

            <div className="space-y-10">
              {/* Visit Selection for Follow-ups */}
              {visitContext?.type === 'FollowUp' && !overrideMode && (
                <VisitTypeSelector
                  lastDiagnosis={visitContext.lastDiagnosis}
                  daysSinceLastVisit={visitContext.daysSinceLastVisit}
                  selectedType={visitOption}
                  onContinue={() => {
                    setVisitOption('continue');
                    setChiefComplaint("Follow up on previous Diagnosis");
                  }}
                  onNewComplaint={() => {
                    setVisitOption('new');
                    setChiefComplaint("");
                  }}
                />
              )}

              <div className="space-y-4">
                <div className="flex items-center gap-2 px-1">
                  <FileText size={14} className="text-blue-500" />
                  <label className="text-[11px] font-black uppercase tracking-widest text-slate-400">Primary Reason for Visit</label>
                </div>
                <textarea
                  className="w-full h-32 bg-slate-50/50 dark:bg-slate-950/40 border-2 border-slate-100/50 dark:border-slate-800/50 rounded-[2rem] p-6 text-xl font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/50 transition-all focus:ring-8 focus:ring-blue-500/5 placeholder:text-slate-200 resize-none backdrop-blur-sm shadow-inner"
                  value={chiefComplaint}
                  placeholder={visitOption === 'continue' ? "Follow up on previous Diagnosis" : "E.g. Persistent cough for 3 days, sharp chest pain..."}
                  onChange={e => setChiefComplaint(e.target.value)}
                />
              </div>

              {/* Vitals Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Vital Signs</h3>
                  {visitContext?.vitalsComparison?.lastVisit && (
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                      <HistoryIcon size={12} /> Showing comparison with {new Date(visitContext.vitalsComparison.lastVisit.recordedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <VitalsComparisonForm
                  lastVitals={visitContext?.vitalsComparison?.lastVisit}
                  currentVitals={{
                    bloodPressureSystolic: parseInt(baseVitals.bloodPressureSystolic) || undefined,
                    bloodPressureDiastolic: parseInt(baseVitals.bloodPressureDiastolic) || undefined,
                    heartRate: parseInt(baseVitals.heartRate) || undefined,
                    temperature: parseFloat(baseVitals.temperature) || undefined,
                    weight: parseFloat(baseVitals.weight) || undefined,
                    height: parseFloat(baseVitals.height) || undefined,
                    spO2: parseInt(baseVitals.spO2) || undefined
                  }}
                  onChange={handleVitalsChange}
                  lockedFields={visitContext?.vitalsComparison?.lockedFields || []}
                  bmi={bmi}
                  bmiCategory={bmiCategory}
                />
              </div>
            </div>

            <div className="flex pt-8 border-t border-slate-100 dark:border-slate-800">
              <Button
                onClick={handleNextStep}
                className="ml-auto px-10 h-16 rounded-[1.25rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
              >
                {visitOption === 'continue' ? 'Next: Review Assessment' : 'Next: Choose Protocol'} <ChevronRight className="ml-2" />
              </Button>
              <Button variant="ghost" onClick={handlePrevStep} className="mr-auto text-slate-400 hover:text-slate-600 font-bold">Back</Button>
            </div>
          </div>
        )}

        {currentStep === 'protocol' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header for Step 3 */}
            <div className="px-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500 shadow-inner">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight tracking-[0.02em]">Clinical Protocol</h2>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5 opacity-70">Step 3: Assessment Framework</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="relative group max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                  <input
                    className="w-full h-10 bg-white/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/30 transition-all backdrop-blur-sm shadow-sm"
                    placeholder="Search protocols..."
                  />
                </div>
                <Button variant="ghost" size="compact" onClick={handleStartFromScratch} className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-500">
                  Skip to Blank Form <ChevronRight size={12} className="ml-1" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Primary Action (Hero) */}
              <div className="lg:col-span-8 space-y-6">
                {visitOption === 'continue' && latestRecord ? (
                  <motion.div 
                    initial={{ scale: 0.98, opacity: 0 }} 
                    animate={{ scale: 1, opacity: 1 }}
                    className="relative overflow-hidden group rounded-[2.5rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-600/10 via-emerald-600/5 to-transparent backdrop-blur-xl p-8 shadow-xl shadow-emerald-500/5 hover:border-emerald-500/40 transition-all cursor-default"
                  >
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                      <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-emerald-600/30 shrink-0 group-hover:scale-105 transition-transform duration-500">
                        <HistoryIcon size={32} />
                      </div>
                      <div className="flex-grow space-y-3">
                        <span className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-emerald-600/20">Recommended Action</span>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Clone Last Visit</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                          Replicate the previous clinical structure from <span className="text-emerald-600 dark:text-emerald-400">{new Date(latestRecord.recordDate).toLocaleDateString()}</span> to maintain continuity.
                        </p>
                        <div className="pt-2 flex items-center gap-4">
                          <Button 
                            onClick={handleCloneLastRecord}
                            className="h-12 px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                          >
                            Proceed with Clone <Plus size={16} className="ml-2" />
                          </Button>
                          <div className="flex -space-x-1.5">
                             {latestRecord.sections?.slice(0, 4).map((s: any, i: number) => (
                               <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-2 border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-slate-500 shadow-sm" title={s.sectionName}>
                                 {s.sectionName[0]}
                               </div>
                             ))}
                             {latestRecord.sections?.length > 4 && (
                               <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 border-2 border-emerald-500/20 flex items-center justify-center text-[9px] font-black text-slate-400">
                                 +{latestRecord.sections.length - 4}
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Decorative Background Elements */}
                    <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -left-8 -top-8 w-32 h-32 bg-emerald-600/5 rounded-full blur-2xl opacity-50" />
                  </motion.div>
                ) : (
                  <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-premium border border-white/40 dark:border-slate-800/50">
                    <SmartProtocolSuggestion
                      chiefComplaint={chiefComplaint}
                      patientId={patient?.id || ''}
                      onSelect={(id) => templatesApi.getTemplate(id).then(res => handleUseTemplate(res.data))}
                      onStartBlank={handleStartFromScratch}
                    />
                  </div>
                )}
              </div>

              {/* Secondary Actions / Reference */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 shadow-premium border border-white/40 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 mb-5 border-b border-slate-100 dark:border-slate-800/50 pb-4">
                    <Sparkles size={16} className="text-blue-500" />
                    <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.15em]">Alternative Paths</h4>
                  </div>
                  
                  <div className="space-y-3">
                    {visitOption === 'continue' ? (
                      <button 
                         onClick={() => setVisitOption('new')}
                         className="w-full p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left group"
                      >
                         <h5 className="text-[12px] font-black text-slate-900 dark:text-white mb-0.5 group-hover:text-blue-500 transition-colors">Full Assessment</h5>
                         <p className="text-[10px] font-bold text-slate-500 leading-tight opacity-70">Start fresh for new conditions.</p>
                      </button>
                    ) : (
                      latestRecord && (
                        <button 
                           onClick={handleCloneLastRecord}
                           className="w-full p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all text-left group"
                        >
                           <div className="flex items-center justify-between mb-1">
                             <h5 className="text-[12px] font-black text-emerald-600 dark:text-emerald-400">Reference Last Visit</h5>
                             <HistoryIcon size={12} className="text-emerald-500 group-hover:rotate-12 transition-transform" />
                           </div>
                           <p className="text-[10px] font-bold text-emerald-600/70 leading-tight">View previous diagnostic structure.</p>
                        </button>
                      )
                    )}
                    
                    <button 
                       onClick={() => setIsTemplateBrowserOpen(true)}
                       className="w-full p-4 rounded-xl border border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all text-left group"
                    >
                       <div className="flex items-center justify-between mb-1">
                         <h5 className="text-[12px] font-black text-slate-900 dark:text-white group-hover:text-blue-500 transition-colors">Protocol Library</h5>
                         <Layout size={12} className="text-blue-500" />
                       </div>
                       <p className="text-[10px] font-bold text-slate-500 leading-tight opacity-70">Browse standardized protocols.</p>
                    </button>
                  </div>
                </div>

                <div className="px-4 py-4 flex flex-col items-center">
                  <Button variant="ghost" onClick={handlePrevStep} className="text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[9px]">
                    Back to Symptoms & Vitals
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SECTION 3: Dynamic Protocol Sections ── */}
        {currentStep === 'summary' && (
          <div className="space-y-6">
            {/* Context Awareness Header / Override */}
            {visitContext?.type === 'FollowUp' && !overrideMode && (
              <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 border-indigo-500/20 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Visit-Aware Intelligence</p>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {visitOption === 'continue' ? "Follow-up protocol pre-populated from previous visit." : "New complaint flow initiated."}
                    </h3>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="compact"
                  onClick={() => {
                    setOverrideMode(true);
                    setVisitOption('new');
                    setCurrentStep('protocol');
                    toast.success("Switched to Full Assessment Mode");
                  }}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 px-4"
                >
                  Switch to Full Assessment
                </Button>
              </motion.div>
            )}

            {/* Form Header */}
            <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-premium border border-white/40 dark:border-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                  <ClipboardList size={28} />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                    {selectedTemplateName || 'General Assessment'}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{patient?.name}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-full uppercase tracking-widest">Final Review</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {!overrideMode && visitContext?.type === 'FollowUp' ? null : (
                  <Button variant="ghost" onClick={() => setCurrentStep('protocol')} className="text-slate-400 hover:text-indigo-500 font-bold">Change Protocol</Button>
                )}
                <Button onClick={handleCompleteAndSave} isLoading={isSaving} className="h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest px-8 shadow-xl shadow-blue-500/20">
                  Save Final Record
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {visitOption === 'continue' && visitContext?.protocolToLoad && !overrideMode ? (
                <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-premium border border-white/40 dark:border-slate-800/50">
                  <ProtocolProgressForm
                    protocol={visitContext.protocolToLoad}
                    data={templateData}
                    onChange={handleFieldChange}
                  />
                </div>
              ) : (
                localSections.map((section, sIdx) => (
                  <CollapsibleSection
                    key={`${section.section_name}-${sIdx}`}
                    title={section.section_name}
                    badgeCount={section.fields.length}
                    icon={<ClipboardList size={16} className="text-blue-500" />}
                    className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border-white/40 dark:border-slate-800/50"
                  >
                    {section.fields.length > 0 ? (
                      <FormGrid columns={3} className="py-2">
                        {section.fields.map(field => {
                          const value = templateData[`${section.section_name}_${field.field_name}`] || '';
                          const numValue = parseFloat(value);
                          const isAbnormal = field.field_type === 'Number' && value && field.normal_range_min !== undefined && field.normal_range_max !== undefined
                            && !isNaN(numValue) && (numValue < field.normal_range_min || numValue > field.normal_range_max);

                          return (
                            <div key={field.field_name} className="group relative overflow-hidden bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] border border-white/50 dark:border-slate-800/50 p-6 shadow-sm hover:shadow-xl hover:translate-y-[-2px] transition-all duration-300">
                              <div className="flex items-center justify-between mb-4">
                                {/* Label — click to rename, or inline input when editing */}
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  {editingFieldKey === `${section.section_name}_${field.field_name}` ? (
                                    <input
                                      autoFocus
                                      defaultValue={field.field_label}
                                      className="text-[10px] font-black uppercase tracking-[0.2em] bg-transparent border-b-2 border-blue-500 outline-none text-blue-500 px-1 w-full"
                                      onBlur={e => {
                                        handleRenameField(section.section_name, field.field_name, e.target.value);
                                        setEditingFieldKey(null);
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          handleRenameField(section.section_name, field.field_name, e.currentTarget.value);
                                          setEditingFieldKey(null);
                                        }
                                        if (e.key === 'Escape') setEditingFieldKey(null);
                                      }}
                                    />
                                  ) : (
                                    <label
                                      className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-blue-500 transition-colors px-1 cursor-pointer truncate"
                                      onClick={() => setEditingFieldKey(`${section.section_name}_${field.field_name}`)}
                                      title="Click to rename field"
                                    >
                                      {field.field_label}{field.is_required && <span className="text-rose-500 ml-1">*</span>}
                                    </label>
                                  )}
                                  {/* Pencil icon — subtle rename hint */}
                                  {!field.is_required && editingFieldKey !== `${section.section_name}_${field.field_name}` && (
                                    <button
                                      type="button"
                                      onClick={() => setEditingFieldKey(`${section.section_name}_${field.field_name}`)}
                                      className="opacity-0 group-hover:opacity-60 transition-opacity p-0.5 rounded text-slate-400 hover:text-blue-500 shrink-0"
                                      title="Rename field"
                                    >
                                      <Pencil size={9} />
                                    </button>
                                  )}
                                </div>

                                {/* Right side: abnormal badge + delete button */}
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  {isAbnormal && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                                      <AlertTriangle size={10} /> Abnormal
                                    </div>
                                  )}
                                  {/* Delete field button — only for non-required fields */}
                                  {!field.is_required && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveField(section.section_name, field.field_name)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-500"
                                      title="Remove this field from consultation"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="relative mb-6">
                                <div className="flex items-baseline gap-2">
                                  {field.field_type === 'Dropdown' ? (
                                    <select
                                      className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-full appearance-none cursor-pointer"
                                      value={value}
                                      onChange={e => handleFieldChange(section.section_name, field.field_name, e.target.value)}
                                    >
                                      <option value="">—</option>
                                      {field.dropdown_options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                  ) : (
                                    <input
                                      type={field.field_type === 'Number' ? 'number' : 'text'}
                                      className="bg-transparent text-3xl font-black text-slate-900 dark:text-white outline-none w-full placeholder:text-slate-200"
                                      placeholder="—"
                                      value={value}
                                      onChange={e => handleFieldChange(section.section_name, field.field_name, e.target.value)}
                                    />
                                  )}
                                  {field.unit && (
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest opacity-60">
                                      {field.unit}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Visual Range Indicator */}
                              {field.normal_range_min !== undefined && field.normal_range_max !== undefined && (
                                <div className="mb-6 space-y-2">
                                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-50 dark:border-slate-800/50 shadow-inner">
                                    {/* Normal Range Area (Central 50% for visualization) */}
                                    <div className="absolute inset-y-0 bg-blue-500/10 dark:bg-blue-500/20" style={{ 
                                      left: '25%', 
                                      right: '25%' 
                                    }} />
                                    {/* Current Value Marker */}
                                    {value && !isNaN(numValue) && (
                                      <motion.div 
                                        initial={{ scale: 0 }}
                                        animate={{ 
                                          scale: 1,
                                          left: `${Math.min(Math.max(((numValue - (field.normal_range_min * 0.5)) / (field.normal_range_max * 1.5 - field.normal_range_min * 0.5)) * 100, 2), 98)}%` 
                                        }}
                                        className={`absolute top-0 bottom-0 w-2 rounded-full shadow-lg z-10 transition-colors border border-white/40 ${isAbnormal ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                      />
                                    )}
                                  </div>
                                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 opacity-70 italic">
                                    <span>{field.normal_range_min}</span>
                                    <span className="text-slate-300">Reference Range</span>
                                    <span>{field.normal_range_max}</span>
                                  </div>
                                </div>
                              )}

                              {field.last_value && (
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400">
                                      <Clock size={14} />
                                    </div>
                                    <div>
                                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">History</p>
                                      <p className="text-[11px] font-black text-slate-900 dark:text-white mt-0.5">
                                        {field.last_value} {field.unit}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {value && !isNaN(parseFloat(value)) && field.last_value && !isNaN(parseFloat(field.last_value)) && (
                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-premium border border-white/20 ${
                                      getTrendColor(field.field_label, value, field.last_value, field.normal_range_min, field.normal_range_max)
                                    }`}>
                                      {parseFloat(value) > parseFloat(field.last_value) ? <ArrowUpRight size={12} strokeWidth={3} /> :
                                        parseFloat(value) < parseFloat(field.last_value) ? <ArrowDownRight size={12} strokeWidth={3} /> : <div className="w-3 h-0.5 bg-current rounded-full" />}
                                      {Math.abs(parseFloat(value) - parseFloat(field.last_value)).toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </FormGrid>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-center opacity-50">
                        <Search size={40} className="text-slate-300 mb-4" />
                        <p className="text-sm font-bold text-slate-400">Section is empty.</p>
                        <p className="text-xs text-slate-500 mt-1">Use the "Add Measurement" button below to populate.</p>
                      </div>
                    )}

                    <div className="mt-6 flex justify-center">
                      <button
                        onClick={() => openAddCustomField(section.section_name)}
                        className="group flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800/50 hover:bg-blue-600 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Plus size={14} className="group-hover:rotate-90 transition-transform" /> Add Field to {section.section_name}
                      </button>
                    </div>
                  </CollapsibleSection>
                ))
              )}

              {/* Clinical Notes */}
              <CollapsibleSection 
                title="Clinical Assessment & Plan" 
                icon={<FileText size={16} />} 
                defaultOpen={true}
                className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl border-white/40 dark:border-slate-800/50"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Final Diagnosis</label>
                    <textarea
                      rows={4}
                      className="w-full bg-white/50 dark:bg-slate-950/50 border border-white/50 dark:border-slate-800/50 rounded-2xl p-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-blue-500/30 transition-all resize-none placeholder:text-slate-300 shadow-inner"
                      placeholder="Describe the diagnosed condition..."
                      value={diagnosis}
                      onChange={e => setDiagnosis(e.target.value)}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Management Plan</label>
                    <textarea
                      rows={4}
                      className="w-full bg-white/50 dark:bg-slate-950/50 border border-white/50 dark:border-slate-800/50 rounded-2xl p-6 text-sm font-bold font-mono text-slate-900 dark:text-white outline-none focus:border-blue-500/30 transition-all resize-none placeholder:text-slate-300 shadow-inner"
                      placeholder={"1. Medications\n2. Lifestyle advice\n3. Follow-up"}
                      value={treatmentPlan}
                      onChange={e => setTreatmentPlan(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 px-1 flex items-center gap-2">
                      <AlertTriangle size={12} /> Private Doctor Observations
                    </label>
                    <textarea
                      rows={3}
                      className="w-full bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-amber-500/50 transition-all resize-none placeholder:text-amber-200/50 shadow-inner"
                      placeholder="Confidential clinical notes, internal thoughts, or mental health observations..."
                      value={doctorNotes}
                      onChange={e => setDoctorNotes(e.target.value)}
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </div>

            {/* Floating Action Menu */}
            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 p-3 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border border-white/50 dark:border-slate-800/50 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-500">
              <button
                onClick={() => openAddCustomField()}
                className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] transition-all active:scale-95 shadow-xl shadow-blue-500/30"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:rotate-90 transition-transform">
                  <Plus size={18} />
                </div>
                Add Measurement
              </button>
              <div className="w-[1px] h-10 bg-slate-200 dark:bg-white/10 mx-1" />
              <button
                onClick={handleCompleteAndSave}
                className="group flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-[0.1em] text-[11px] transition-all active:scale-95 shadow-xl shadow-emerald-500/30"
              >
                <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Save size={18} />
                </div>
                Finish Record
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Modals ═══ */}

      {/* Smart Field Builder */}
      <SmartFieldBuilder
        isOpen={isCustomFieldModalOpen}
        onClose={() => setIsCustomFieldModalOpen(false)}
        onAdd={handleAddCustomField}
        sections={localSections.map(s => s.section_name)}
      />

      <TemplateBrowserModal
        isOpen={isTemplateBrowserOpen}
        onClose={() => setIsTemplateBrowserOpen(false)}
        onSelect={handleUseTemplate}
      />

      {/* Save as Template Modal */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowSaveTemplateModal(false)} />
          <div className="relative bg-white/90 dark:bg-slate-900/90 rounded-[2.5rem] shadow-2xl border border-white/40 dark:border-slate-800/50 w-full max-w-md overflow-hidden backdrop-blur-xl">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20">
                <Sparkles size={32} className="text-white" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {sourceTemplateId ? "Update Protocol?" : "Save as Protocol?"}
              </h2>
              <p className="text-sm font-bold text-slate-500 mt-2 mb-8 max-w-xs mx-auto leading-relaxed">
                {sourceTemplateId
                  ? `You've modified the "${selectedTemplateName}" structure. Would you like to update the original or save as new?`
                  : "This clinical structure will be saved to your library for future use with any patient."}
              </p>

              <div className="text-left mb-8">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2 px-1">Protocol Name</label>
                <input
                  autoFocus
                  className="w-full border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-5 py-4 text-sm bg-slate-50/50 dark:bg-slate-950/30 focus:outline-none focus:border-blue-500/50 transition font-black text-slate-900 dark:text-white"
                  placeholder="e.g. Renal Function Profile, Diabetes Checkup..."
                  value={newTemplateName || (sourceTemplateId ? (selectedTemplateName || '') : '')}
                  onChange={e => setNewTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-500/20" onClick={() => handleSaveTemplate(false)} isLoading={isSavingTemplate}>
                  {sourceTemplateId ? "Save as New Protocol" : "Save Protocol"}
                </Button>
                {sourceTemplateId && (
                  <Button variant="ghost" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-blue-600 dark:text-blue-400 hover:bg-blue-500/5" onClick={() => handleSaveTemplate(true)} isLoading={isSavingTemplate}>
                    Update Existing Protocol
                  </Button>
                )}
                <Button variant="ghost" className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-rose-500" onClick={() => { setShowSaveTemplateModal(false); if (lastSavedRecordId) router.push('/doctor/dashboard'); }}>
                  Don't Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Follow-Up Scheduling Modal */}
      <FollowUpSchedulingModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        onConfirm={handleFollowUpConfirm}
        patientName={patient?.name || ''}
        todayAppointmentTime={todayAppointment?.appointmentDate ? formatLocalTime(todayAppointment.appointmentDate, 'HH:mm') : ''}
        isLoading={isSchedulingFollowUp}
      />
    </div>
  );
}
