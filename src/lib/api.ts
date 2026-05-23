import axiosInstance from './utils/axios';
export * from './api/medicalRecords';
export * from './api/patient';
export * from './api/chatApi';

// ─── Standardized Types ──────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        totalCount: number;
        page: number;
        pageSize: number;
        totalPages: number;
    };
}

export interface UserOverview {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailConfirmed: boolean;
    createdAt: string;
    lastLoginAt?: string;
    phoneNumber?: string;
}

export interface Doctor {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    nmcLicense: string;
    department: string;
    specialization: string;
    isActive: boolean;
    profilePictureUrl?: string;
}

export interface MedicalRecord {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    title: string;
    recordType: string;
    description: string;
    fileUrl: string;
    createdAt: string;
    isCertified: boolean;
}

export interface Appointment {
    id: string;
    patientId: string;
    patientName: string;
    doctorId: string;
    doctorName: string;
    dateTime: string;
    status: string;
    reason: string;
}

// ── Doctor Profile & Statistics Types ─────────────────────────────────────────

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
    departmentName?: string;
    specialization?: string;
    hospitalAffiliation?: string;
    contactNumber?: string;
}

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
    firstName: string;
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

// ─── Admin API ────────────────────────────────────────────────────────────────

import { doctorPatientsApi } from './api/doctorPatients';

export const adminApi = {
    getDashboardStats: async () => {
        const response = await axiosInstance.get('admin/dashboard/stats');
        return response.data.data;
    },

    getAuditLogs: async (filters: { page?: number; pageSize?: number; action?: string; searchTerm?: string }) => {
        const response = await axiosInstance.get('admin/audit-logs', { params: filters });
        const result = response.data.data;
        return {
            data: result.logs,
            pagination: { totalCount: result.totalCount, page: result.page, pageSize: result.pageSize }
        };
    },

    createPatient(data: any): Promise<any> {
        return axiosInstance.post('/admin/patients', data).then(res => res.data);
    },

    getUsers: async (filters: { page?: number; pageSize?: number; searchTerm?: string; role?: string; isActive?: boolean }): Promise<PaginatedResponse<UserOverview>> => {
        const response = await axiosInstance.get('admin/users', {
            params: filters
        });
        const result = response.data.data;
        return {
            data: result.users,
            pagination: result.pagination
        };
    },

    getUserById: async (id: string) => {
        const response = await axiosInstance.get(`admin/users/${id}`);
        return response.data.data;
    },

    getDoctors: async (filters: { page?: number; pageSize?: number; searchTerm?: string; department?: string; isActive?: boolean }): Promise<PaginatedResponse<Doctor>> => {
        const response = await axiosInstance.get('admin/doctors', {
            params: filters
        });
        const result = response.data.data;
        return {
            data: result.doctors,
            pagination: result.pagination
        };
    },

    getDoctorDetails: async (id: string) => {
        const response = await axiosInstance.get(`admin/doctors/${id}`);
        return response.data.data;
    },

    getDoctorProfile: async (id: string) => {
        const response = await axiosInstance.get(`admin/doctors/${id}/profile`);
        return response.data.data;
    },

    deleteDoctor: async (id: string) => {
        const response = await axiosInstance.delete(`admin/doctors/${id}`);
        return response.data;
    },

    getDepartments: async () => {
        const response = await axiosInstance.get('departments');
        return response.data.data;
    },

    getPatients: async (filters: { page?: number; pageSize?: number; searchTerm?: string; isActive?: boolean } = {}): Promise<PaginatedResponse<UserOverview>> => {
        const response = await axiosInstance.get('admin/users', {
            params: { ...filters, role: 'Patient' }
        });
        const result = response.data.data;
        return {
            data: result.users,
            pagination: result.pagination
        };
    },

    getSystemStats: async () => {
        const response = await axiosInstance.get('admin/dashboard/stats');
        return response.data.data;
    },

    updateUserStatus: async (id: string, isActive: boolean) => {
        const response = await axiosInstance.put(`admin/users/${id}/status`, { isActive });
        return response.data;
    },

    updateUser: async (id: string, data: any) => {
        const response = await axiosInstance.put(`admin/users/${id}`, data);
        return response.data;
    },

    inviteDoctor: async (data: any) => {
        const response = await axiosInstance.post('admin/doctors/invite', data);
        return response.data;
    },

    updateDoctor: async (id: string, data: any) => {
        const response = await axiosInstance.put(`admin/doctors/${id}`, data);
        return response.data;
    },

    regenerateKeys: async (id: string) => {
        const response = await axiosInstance.post(`admin/doctors/${id}/regenerate-keys`);
        return response.data;
    }
};

// ─── Doctor API ───────────────────────────────────────────────────────────────

export const doctorApi = {
    getDashboardStats: async () => {
        // Backend: DoctorStatisticsController -> [HttpGet("dashboard")] on [Route("api/doctor/statistics")]
        // Returns raw object, not ApiResponse wrapped
        const response = await axiosInstance.get('doctor/statistics/dashboard');
        return response.data;
    },

    getPendingRecords: async (page = 1) => {
        const response = await axiosInstance.get('doctor/pending-records', {
            params: { page }
        });
        return response.data.data;
    },

    getCertifiedRecords: async (page = 1) => {
        const response = await axiosInstance.get('doctor/certified-records', {
            params: { page }
        });
        return response.data.data;
    },

    getMyPatients: async (page = 1, search?: string) => {
        const response = await axiosInstance.get('doctor/patients', {
            params: { page, searchTerm: search }
        });
        return response.data.data;
    },

    getPatientInfo: async (id: string) => {
        const response = await axiosInstance.get(`doctor/patients/${id}`);
        return response.data;
    },

    getAppointments: async (page = 1) => {
        const response = await axiosInstance.get('doctor/appointments', {
            params: { page }
        });
        return response.data.data;
    },

    async getRecordGrowth() {
        const response = await axiosInstance.get('doctor/statistics/record-growth');
        return response.data;
    },

    async getPatientVolume() {
        const response = await axiosInstance.get('doctor/statistics/patient-volume');
        return response.data;
    },

    async getTemplateUsage() {
        const response = await axiosInstance.get('doctor/statistics/template-usage');
        return response.data;
    },

    async getRecentScans(limit: number = 5) {
        const response = await axiosInstance.get(`doctor/statistics/recent-scans?limit=${limit}`);
        return response.data;
    },

    async getWeekSchedule() {
        const response = await axiosInstance.get('doctor/statistics/week-schedule');
        return response.data;
    },

    getAvailability: async () => {
        const response = await axiosInstance.get('doctor/availability');
        return response.data;
    },

    certifyRecord: async (id: string, notes?: string) => {
        const response = await axiosInstance.post(`doctor/records/${id}/certify`, { certificationNotes: notes });
        return response.data;
    },

    rejectRecord: (id: string, reason: string) => {
        return axiosInstance.post(`doctor/records/${id}/reject`, { rejectionReason: reason });
    },

    getProfile: async () => {
        const response = await axiosInstance.get('doctor/profile');
        return response.data;
    },

    updateProfile: async (data: UpdateDoctorExtendedProfileRequest) => {
        const response = await axiosInstance.put('doctor/profile', data);
        return response.data;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('doctor/profile/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteProfilePicture: async () => {
        const response = await axiosInstance.delete('doctor/profile/picture');
        return response.data;
    },

    getVitalTrends: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/trends`),

    getMedicationCorrelations: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/medication-correlation`),

    getAbnormalityPatterns: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/abnormality-patterns`),

    getStabilityTimeline: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/stability-timeline`),

    getAnalysisSummary: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/summary`),

    getFullAnalysis: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/full`),

    generateAnalysisReport: (patientId: string, fullName: string) =>
        axiosInstance.post(`analysis/patient/${patientId}/report/generate?patientFullName=${encodeURIComponent(fullName)}`),

    listAnalysisReports: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/report/list`),

    downloadAnalysisReport: (reportId: string) =>
        axiosInstance.get(`analysis/report/${reportId}/download`, { responseType: 'blob' }),

    getLabMetadata: () =>
        axiosInstance.get(`analysis/lab-metadata`)
};

// ─── Patient API ──────────────────────────────────────────────────────────────

// patientApi is now exported from ./api/patient and ./api/medicalRecords via the exports at the top.
// Component code should use the exported constants directly.

