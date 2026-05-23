import axiosInstance from '../utils/axios';
import { SmartDoctorSuggestionDTO, DoctorSuggestionItem } from './patient';

export interface AppointmentDTO {
    id: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
    doctorId: string;
    doctorName: string;
    doctorDepartment: string;
    doctorProfilePictureUrl?: string;
    appointmentDate: string;
    duration: number;
    status: string;
    reasonForVisit?: string;
    consultationNotes?: string;
    linkedRecordsCount: number;
    linkedRecords: LinkedRecordSummaryDTO[];
    canCancel: boolean;
    canReschedule: boolean;
    createdAt: string;
    completedAt?: string;
}

export interface LinkedRecordSummaryDTO {
    recordId: string;
    recordFileName: string;
    recordType: string;
    linkedAt: string;
    notes?: string;
}

export interface CreateAppointmentDTO {
    doctorId: string;
    appointmentDate: string;
    duration: number;
    reasonForVisit: string;
}

export interface TimeSlot {
    startTime: string;
    endTime: string;
    isAvailable: boolean;
}

export interface DoctorAvailabilityDTO {
    doctorId: string;
    doctorName: string;
    date: string;
    availableSlots: TimeSlot[];
}

export interface CancelAppointmentDTO {
    cancellationReason: string;
}

export interface RescheduleAppointmentDTO {
    newAppointmentDate: string;
}

export interface CompleteAppointmentDTO {
    consultationNotes?: string;
}

export interface LinkRecordDTO {
    medicalRecordId: string;
    notes?: string;
}

export interface DoctorAppointmentStats {
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    cancelledAppointments: number;
    pendingConfirmation: number;
    todayAppointments: number;
}

export interface DailyAvailability {
    date: string;
    isAvailable: boolean;
}

export const appointmentsApi = {
    requestAppointment: async (data: CreateAppointmentDTO) => {
        const response = await axiosInstance.post('appointments/request', data);
        return response.data;
    },

    getPatientAppointments: async (includeHistory: boolean = false) => {
        const response = await axiosInstance.get(`appointments/patient?includeHistory=${includeHistory}`);
        return response.data;
    },

    getDoctorAppointments: async (date?: string, includeHistory: boolean = false) => {
        let url = 'appointments/doctor';
        const params = new URLSearchParams();
        if (date) params.append('date', date);
        if (includeHistory) params.append('includeHistory', 'true');

        const queryString = params.toString();
        if (queryString) url += `?${queryString}`;

        const response = await axiosInstance.get(url);
        return response.data;
    },

    getDoctorStats: async () => {
        const response = await axiosInstance.get('appointments/doctor/stats');
        return response.data;
    },

    getAppointment: async (id: string) => {
        const response = await axiosInstance.get(`appointments/${id}`);
        return response.data;
    },

    cancelAppointment: async (id: string, data: CancelAppointmentDTO) => {
        const response = await axiosInstance.put(`appointments/${id}/cancel`, data);
        return response.data;
    },

    rescheduleAppointment: async (id: string, data: RescheduleAppointmentDTO) => {
        const response = await axiosInstance.put(`appointments/${id}/reschedule`, data);
        return response.data;
    },

    completeAppointment: async (id: string, data: CompleteAppointmentDTO) => {
        const response = await axiosInstance.put(`appointments/${id}/complete`, data);
        return response.data;
    },

    confirmAppointment: async (id: string) => {
        const response = await axiosInstance.put(`appointments/${id}/confirm`);
        return response.data;
    },

    markAsNoShow: async (id: string) => {
        const response = await axiosInstance.put(`appointments/${id}/noshow`);
        return response.data;
    },

    linkRecord: async (id: string, data: LinkRecordDTO) => {
        const response = await axiosInstance.post(`appointments/${id}/link-record`, data);
        return response.data;
    },

    getAvailability: async (doctorId: string, date: string, duration: number = 30): Promise<{ data: TimeSlot[] }> => {
        const response = await axiosInstance.get(`doctor/availability/slots/${doctorId}?date=${date}&duration=${duration}`);
        return response.data;
    },

    getMonthlyAvailability: async (doctorId: string, month: string): Promise<{ data: DailyAvailability[] }> => {
        const response = await axiosInstance.get(`doctor/availability/calendar/${doctorId}?month=${month}`);
        return response.data;
    },

    getSmartSuggestions: async () => {
        const response = await axiosInstance.get('appointments/smart-suggestions');
        return response.data;
    },

    suggestByReason: async (reason: string) => {
        const response = await axiosInstance.get(`appointments/suggest-by-reason?reason=${encodeURIComponent(reason)}`);
        return response.data;
    },

    scheduleFollowUp: async (data: ScheduleFollowUpRequest): Promise<{ data: FollowUpAppointmentResult }> => {
        const response = await axiosInstance.post('appointments/follow-up', data);
        return response.data;
    }
};

// ── Follow-Up Types ───────────────────────────────────────────────────────────

export interface ScheduleFollowUpRequest {
    originalAppointmentId?: string; // Optional if patientId is provided
    patientId?: string;            // Required if originalAppointmentId is null
    preferredFollowUpDate: string; // ISO DateTime string
}

export interface FollowUpAppointmentResult {
    wasScheduled: boolean;
    newAppointmentId?: string;
    scheduledFor?: string; // ISO date string
    message?: string;
}
