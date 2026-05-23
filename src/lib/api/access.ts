import axiosInstance from '../utils/axios';
import { TemplateDTO } from './templates';

export interface SuggestedTemplateDTO {
    template: TemplateDTO;
    matchScore: number;
    matchReason: string;
}

export interface AccessInfoDTO {
    success: boolean;
    patientName: string;
    requiresTOTP: boolean;
    tokenType: 'Normal' | 'Emergency';
    isEmergency: boolean;
    message: string;
}

export interface EmergencyAccessDTO {
    patientName: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    allergies: string;
    currentMedications: string;
    chronicConditions: string;
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    notesToResponders?: string;
    lastUpdated: string;
    warning: string;
}

export interface SessionRecordDTO {
    id: string;
    originalFileName: string;
    recordType: string;
    description?: string;
    uploadedAt: string;
    fileSizeFormatted: string;
    mimeType: string;
}

export interface SessionStatusDTO {
    patientName: string;
    sessionExpiresAt: string;
    remainingMinutes: number;
    records: SessionRecordDTO[];
    isEmergencyAccess?: boolean;
    criticalInfo?: any;
}

const SESSION_TOKEN_KEY = 'sajilo_access_session';

export const accessApi = {
    getAccessInfo: async (token: string): Promise<{ success: boolean; data: AccessInfoDTO }> => {
        const response = await axiosInstance.get(`access/${token}`);
        return response.data;
    },

    verifyAccess: async (token: string, totpCode: string): Promise<{ 
        success: boolean; 
        message: string; 
        data?: { 
            sessionToken: string; 
            expiresAt: string; 
            remainingMinutes: number;
            patientId: string;
            patientName: string;
            scannerRole: string;
            permissions: string[];
            suggestedTemplates: SuggestedTemplateDTO[];
        } 
    }> => {
        const response = await axiosInstance.post(`access/${token}/verify`, { totpCode });
        if (response.data.success && response.data.data?.sessionToken) {
            sessionStorage.setItem(SESSION_TOKEN_KEY, response.data.data.sessionToken);
        }
        return response.data;
    },

    getEmergencyAccess: async (token: string): Promise<{ success: boolean; data: EmergencyAccessDTO }> => {
        const response = await axiosInstance.get(`access/emergency/${token}`);
        return response.data;
    },

    getSessionRecords: async (): Promise<{ success: boolean; data: SessionStatusDTO }> => {
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
        const response = await axiosInstance.get('access/session/records', {
            headers: { 'X-Session-Token': token || '' }
        });
        return response.data;
    },

    downloadSessionRecord: async (recordId: string) => {
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
        const response = await axiosInstance.get(`access/session/records/${recordId}/download`, {
            headers: { 'X-Session-Token': token || '' },
            responseType: 'blob'
        });

        const contentDisposition = response.headers['content-disposition'];
        let fileName = 'medical_record';
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename="?([^";]+)"?/);
            if (fileNameMatch?.[1]) fileName = fileNameMatch[1];
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    logoutSession: async (): Promise<{ success: boolean }> => {
        const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
        const response = await axiosInstance.post('access/session/logout', {}, {
            headers: { 'X-Session-Token': token || '' }
        });
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        return response.data;
    }
};
