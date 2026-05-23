import axiosInstance from '../utils/axios';
import { DoctorExtendedProfile } from './doctor';

export interface PatientProfileData {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    address: string;
    occupation?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelationship?: string;
    allergies: string;
    chronicConditions: string;
    profilePictureUrl?: string;
}

export interface DoctorBasicInfo {
    id: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
}

export interface DoctorSuggestionItem {
    id: string;
    fullName: string;
    department: string;
    suggestionType: 'Appointment' | 'Primary' | 'Recent';
    suggestionLabel?: string;
    profilePictureUrl?: string;
}

export interface SmartDoctorSuggestionDTO {
    recommendedDoctor: DoctorSuggestionItem | null;
    upcomingAppointmentDoctor: DoctorSuggestionItem | null;
    primaryDoctor: DoctorSuggestionItem | null;
    recentDoctors: DoctorSuggestionItem[];
}

export interface UpdatePatientProfileRequest {
    bloodType?: string;
    address?: string;
    occupation?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    allergies?: string;
    chronicConditions?: string;
    gender?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
}

export interface EmergencySettingsDTO {
    bloodType?: string;
    allergies?: string;
    currentMedications?: string;
    chronicConditions?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    emergencyNotesToResponders?: string;
    lastUpdated?: string;
}

export interface TimeSeriesDataPoint {
    label: string;
    value: number;
    value2?: number;
    value3?: number;
}

export interface PatientStatisticsDTO {
    firstName: string;
    totalRecords: number;
    certifiedRecords: number;
    pendingRecords: number;
    upcomingAppointments: number;
    totpEnabled: boolean;
    trustedDevicesCount: number;
    activeShareCount: number;
    emergencyDataLastUpdated?: string;
    recordTypeDistribution: TimeSeriesDataPoint[];
    recordGrowthTrend: { 
        label: string; 
        total: number;
        certified: number;
        pending: number;
        draft: number;
        emergency: number;
        archived: number;
        resolution?: string;
    }[];
    scanTrend: TimeSeriesDataPoint[];
    appointmentStatusDistribution: TimeSeriesDataPoint[];
    recentActivities: {
        id: string;
        action: string;
        details: string;
        timestamp: string;
        type: string;
    }[];
    totalNormalScans: number;
    totalEmergencyScans: number;
}

export const patientApi = {
    getProfile: async () => {
        const response = await axiosInstance.get('patient/profile');
        return response.data;
    },

    updateProfile: async (data: UpdatePatientProfileRequest) => {
        const response = await axiosInstance.put('patient/profile', data);
        return response.data;
    },

    getDepartments: async (): Promise<{ success: boolean; message: string; data: string[] }> => {
        const response = await axiosInstance.get('patient/doctors/departments');
        return response.data;
    },

    getDoctorsByDepartment: async (department: string): Promise<{ success: boolean; message: string; data: DoctorBasicInfo[] }> => {
        const response = await axiosInstance.get(`patient/doctors?department=${encodeURIComponent(department)}`);
        return response.data;
    },

    getSmartDoctorSuggestions: async (): Promise<{ success: boolean; message: string; data: SmartDoctorSuggestionDTO }> => {
        const response = await axiosInstance.get('medical-records/smart-doctor-suggestions');
        return response.data;
    },

    setPrimaryDoctor: async (doctorId: string): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put('patient/set-primary-doctor', { doctorId });
        return response.data;
    },

    getEmergencySettings: async (): Promise<{ success: boolean; message: string; data: EmergencySettingsDTO }> => {
        const response = await axiosInstance.get('patient/emergency-settings');
        return response.data;
    },

    updateEmergencySettings: async (data: EmergencySettingsDTO): Promise<{ success: boolean; message: string }> => {
        const response = await axiosInstance.put('patient/emergency-settings', data);
        return response.data;
    },

    getDoctorById: async (doctorId: string): Promise<{ success: boolean; message: string; data: DoctorExtendedProfile }> => {
        const response = await axiosInstance.get(`patient/doctors/${doctorId}`);
        return response.data;
    },

    getQRCodes: async (): Promise<{ success: boolean; message: string; data: any[] }> => {
        const response = await axiosInstance.get('qr/my-codes');
        return response.data;
    },

    getAppointments: async (page = 1) => {
        const response = await axiosInstance.get('patient/appointments', {
            params: { page }
        });
        return response.data;
    },

    uploadProfilePicture: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('patient/profile/picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    deleteProfilePicture: () =>
        axiosInstance.delete('/patient/profile/picture'),

    // ── Health Analysis ───────────────────────────────────────────────────────
    getAnalysisSummary: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/summary`),

    getFullAnalysis: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/full`),

    getVitalTrends: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/trends`),

    getMedicationCorrelations: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/medication-correlation`),

    getAbnormalityPatterns: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/abnormality-patterns`),

    getStabilityTimeline: (patientId: string) =>
        axiosInstance.get(`analysis/patient/${patientId}/stability-timeline`),

    generateAnalysisReport: (patientId: string, fullName: string) =>
        axiosInstance.post(`analysis/patient/${patientId}/report/generate?patientFullName=${encodeURIComponent(fullName)}`),

    downloadAnalysisReport: (reportId: string) =>
        axiosInstance.get(`analysis/report/${reportId}/download`, { responseType: 'blob' }),

    getDashboardStats: async (): Promise<{ success: boolean; message: string; data: PatientStatisticsDTO }> => {
        const response = await axiosInstance.get('patient/statistics/dashboard');
        return response.data;
    },

    getLabMetadata: () =>
        axiosInstance.get(`analysis/lab-metadata`)
};
