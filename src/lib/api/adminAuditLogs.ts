import axiosInstance from "../utils/axios";

export enum AuditSeverity {
    Info = 0,
    Warning = 1,
    Error = 2,
    Critical = 3
}

export interface AuditLogResponseDTO {
    id: string;
    userId?: string;
    userName?: string;
    userEmail?: string;
    action: string;
    details: string;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
    entityType?: string;
    entityId?: string;
    severity: AuditSeverity;
    severityLabel: string;
}

export interface PaginatedAuditLogsDTO {
    logs: AuditLogResponseDTO[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface AuditLogFilters {
    page?: number;
    pageSize?: number;
    searchTerm?: string;
    action?: string;
    severity?: AuditSeverity;
    fromDate?: string;
    toDate?: string;
}

export interface RecentCriticalEventDTO {
    id: string;
    action: string;
    details: string;
    userName?: string;
    userEmail?: string;
    timestamp: string;
    severity: string;
}

export interface TimeSeriesDataPointDTO {
    label: string;
    value: number;
    value2: number;
    value3: number;
    value4: number;
    isActivityDay: boolean;
}

export interface SystemStatisticsDTO {
    adminFirstName: string;
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    totalAdmins: number;
    activeUsers: number;
    newUsersThisMonth: number;
    totalRecordsUploaded: number;
    totalRecordsDraft: number;
    totalRecordsPending: number;
    totalRecordsCertified: number;
    totalRecordsEmergency: number;
    totalRecordsArchived: number;
    recordsUploadedThisMonth: number;
    totalQRScans: number;
    normalQRScans: number;
    emergencyQRScans: number;
    activeAccessSessions: number;
    totalAppointments: number;
    completedAppointments: number;
    upcomingAppointments: number;
    totalAuditLogs: number;
    criticalEvents24h: number;
    warningEvents24h: number;
    recentCriticalEvents: RecentCriticalEventDTO[];
    userGrowthTrend: TimeSeriesDataPointDTO[];
    qrScanTrend: TimeSeriesDataPointDTO[];
}

export interface SecurityAlertDTO {
    alertType: string;
    title: string;
    description: string;
    severity: string; // Low, Medium, High, Critical
    detectedAt: string;
    relatedUserId?: string;
    relatedUserEmail?: string;
    relatedUserName?: string;
    eventCount: number;
    ipAddress?: string;
}

export const adminAuditLogsApi = {
    getAuditLogs: async (filters: AuditLogFilters): Promise<PaginatedAuditLogsDTO> => {
        const response = await axiosInstance.get('admin/audit-logs', { params: filters });
        return response.data.data;
    },

    getSystemStatistics: async (): Promise<SystemStatisticsDTO> => {
        const response = await axiosInstance.get('admin/dashboard/stats');
        return response.data.data;
    },

    getSecurityAlerts: async (): Promise<SecurityAlertDTO[]> => {
        const response = await axiosInstance.get('admin/security-alerts');
        return response.data.data;
    },

    applyRetentionPolicy: async (retentionDays: number): Promise<{ deletedCount: number; retentionDays: number }> => {
        const response = await axiosInstance.post(`admin/apply-retention?retentionDays=${retentionDays}`);
        return response.data.data;
    },

    exportLogs: async (filters?: Omit<AuditLogFilters, 'page' | 'pageSize'>): Promise<Blob> => {
        const response = await axiosInstance.get('admin/export-logs', {
            params: filters,
            responseType: 'blob'
        });
        return response.data;
    }
};
