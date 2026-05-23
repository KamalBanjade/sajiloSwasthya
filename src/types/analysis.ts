export interface StabilityWindow {
  from: string;
  to: string;
  averageValue: number;
}

export interface VitalTrend {
  vitalName: string;
  direction: 'Improving' | 'Degrading' | 'Stable' | 'Baseline';
  slope: number;
  volatility: number;
  currentValue: number | null;
  baselineValue: number | null;
  percentChangeFromBaseline: number | null;
  stabilityWindows: StabilityWindow[];
  humanInterpretation: string;
  actionStep: string;
  normalMin: number | null;
  normalMax: number | null;
  vitalUnit: string | null;
  sectionName: string | null;
  isAbnormal: boolean;
}

export interface VitalCorrelationDelta {
  vitalName: string;
  avgBefore: number;
  avgAfter: number;
  delta: number;
  interpretation: 'Improved' | 'Degraded' | 'Neutral';
  visitsBeforeCount: number;
  visitsAfterCount: number;
}

export interface MedicationCorrelation {
  medicationName: string;
  introducedAt: string;
  lastSeenAt: string;
  isCurrentlyActive: boolean;
  drugCategory: string;
  primaryMarkers: string[];
  vitalDeltas: VitalCorrelationDelta[];
}

export interface AttentionItem {
  title: string;
  description: string;
  actionStep: string;
  severity: 'High' | 'Medium' | 'Low';
  category: 'Vital' | 'Lab' | 'FollowUp' | 'Gap' | 'Baseline';
}

export interface AbnormalStreak {
  from: string;
  to: string;
  consecutiveCount: number;
  values: number[];
}

export interface AbnormalityPattern {
  vitalName: string;
  maxConsecutiveAbnormalVisits: number;
  streaks: AbnormalStreak[];
}

export interface QuarterlyStability {
  quarter: string;
  stabilityScore: number;
  totalVisits: number;
  abnormalReadingCount: number;
  hasLongGap: boolean;
  scoreInterpretation: 'Excellent' | 'Good' | 'Fair' | 'Poor';
}

export interface StabilityAlertDto {
  alertId: string;
  patientId: string;
  patientName: string;
  quarter: string;
  stabilityScore: number;
  scoreInterpretation: string;
  triggeredAt: string;
  isRead: boolean;
}

export interface StabilityTimeline {
  quarters: QuarterlyStability[];
}

export interface AnalysisSummary {
  patientId: string;
  patientAge: number;
  gender: string;
  bloodType: string | null;
  totalVisits: number;
  firstVisit: string;
  lastVisit: string;
  overallHealthTrend: 'Improving' | 'Degrading' | 'Stable' | 'Mixed';
  keyInsights: string[];
  activeMedications: string[];
  vitalTrends: VitalTrend[];
  latestStabilityScore: number;
  hasMissedFollowUp: boolean;
  baselineReliabilityWarning: boolean;
  nextFollowUpDate: string | null;
  itemsNeedingAttention: AttentionItem[];
  primaryCondition: string | null;
}
