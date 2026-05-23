import axiosInstance from '../utils/axios';

// ── Section Types ──────────────────────────────────────────────────────────
export interface DoctorProfileSection {
    title: string;
    institution?: string;
    startYear?: string;
    endYear?: string;
    description?: string;
}

export interface DoctorCertificationItem {
    name: string;
    issuingBody?: string;
    year?: string;
    description?: string;
}

export interface DoctorCustomAttribute {
    key: string;
    value: string;
}

// ── Full Profile Read Model ────────────────────────────────────────────────
export interface DoctorExtendedProfile {
    doctorId: string;
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    nmcLicense: string;
    departmentId: string;
    departmentName: string;
    specialization: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
    profilePictureUrl?: string;
    biography?: string;
    yearsOfExperience?: number;
    consultationFee?: string;
    consultationHours?: string;
    consultationLocation?: string;
    acceptsNewPatients?: boolean;
    education: DoctorProfileSection[];
    experience: DoctorProfileSection[];
    professionalCertifications: DoctorCertificationItem[];
    awards: DoctorProfileSection[];
    procedures: string[];
    languages: string[];
    customAttributes: DoctorCustomAttribute[];
    profileCompletionScore: number;
    missingProfileFields: string[];
}

// ── Update Request ─────────────────────────────────────────────────────────
export interface UpdateDoctorExtendedProfileRequest {
    specialization?: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
    biography?: string;
    yearsOfExperience?: number;
    consultationFee?: string;
    consultationHours?: string;
    consultationLocation?: string;
    acceptsNewPatients?: boolean;
    education?: DoctorProfileSection[];
    experience?: DoctorProfileSection[];
    professionalCertifications?: DoctorCertificationItem[];
    awards?: DoctorProfileSection[];
    procedures?: string[];
    languages?: string[];
    customAttributes?: DoctorCustomAttribute[];
}

// Legacy minimal interface kept for compatibility
export interface DoctorProfileData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    nmcLicense: string;
    department: string;
    specialization: string;
    hospitalAffiliation: string;
    contactNumber: string;
}

export interface UpdateDoctorProfileRequest {
    department?: string;
    specialization?: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
}

// ── Statistics & Dashboard ────────────────────────────────────────────────
export interface DoctorStatistics {
    totalAssignedPatients: number;
    pendingRecordReviews: number;
    totalCertifiedRecords: number;
    todayAppointments: number;
    upcomingAppointments: number;
    patientTrustScore: number;
    totalClinicalActions24h: number;
    appointmentTrend: Array<{ label: string; value: number }>;
    recordStatusDistribution: Array<{ label: string; value: number }>;
    patientGenderDistribution: Array<{ label: string; value: number }>;
    patientAgeGroups: Array<{ label: string; value: number }>;
    recordTypeDistribution: Array<{ label: string; value: number }>;
    appointmentReasonDistribution: Array<{ label: string; value: number }>;
    weeklyAvailability: AvailabilitySlot[];
    averageCertificationTimeHours: number;
    recentActions: ClinicalActivity[];
}

export interface AvailabilitySlot {
    day: string;
    timeRange: string;
    isAvailable: boolean;
    status?: string;
}

export interface DoctorDashboardStats {
    todayAppointments: number;
    pendingRecords: number;
    weekAppointments: number;
    monthPatients: number;
    recentScans: number;
    completionRate: number;
}

export interface RecordGrowthTrend {
    label: string;
    value: number;
    value2: number;
    value3: number;
    value4: number;
}

export interface PatientVolumeTrend {
    date: string;
    patientCount: number;
}

export interface TemplateUsage {
    templateId: string;
    templateName: string;
    usageCount: number;
}

export interface RecentScan {
    id: string;
    patientId: string;
    patientName: string;
    scannedAt: string;
    isEmergency: boolean;
    totpVerified: boolean;
}

export interface DaySchedule {
    date: string;
    count: number;
    scheduled: number;
    completed: number;
    cancelled: number;
}

export interface WeekSchedule {
    weekStart: string;
    days: DaySchedule[];
}

export interface ClinicalActivity {
    id: string;
    action: string;
    details: string;
    patientName?: string;
    timestamp: string;
    type: string;
}

// ── API Functions ──────────────────────────────────────────────────────────

// doctorApi moved to lib/api.ts
