import api from '../utils/axios';
import toast from 'react-hot-toast';

export interface UploadMedicalRecordDTO {
    file: File;
    recordType: string;
    description?: string;
    recordDate?: string;
    assignedDoctorId?: string;
    tags?: string;
}

export interface MedicalRecordResponseDTO {
    id: string;
    patientId: string;
    originalFileName: string;
    recordType: string;
    description?: string;
    recordDate?: string;
    fileSize: number;
    fileSizeFormatted: string;
    mimeType: string;
    state: number; // 0=Draft, 1=Pending, 2=Certified, 3=Emergency, 4=Archived
    stateLabel: string; // Human-readable: 'Draft', 'Awaiting Review', 'Certified', etc.
    rejectionReason?: string; // Populated when state is Draft after rejection
    uploadedAt: string;
    uploadedBy?: string;
    patientName?: string;
    assignedDoctorName?: string;
    assignedDoctorId?: string;
    assignedDepartment?: string;
    isCertified: boolean;
    certifiedBy?: string;
    certifiedById?: string;
    certifiedAt?: string;
    version: number;
    canDownload: boolean;
    relativeTimeString: string;
    timePeriod: string;
    tags?: string;
}

export interface UpdateMedicalRecordMetadataDTO {
    recordType?: string;
    description?: string;
    recordDate?: string;
    tags?: string;
}

export interface RecordSectionDTO {
    timePeriod: string;
    displayName: string;
    recordCount: number;
    isExpanded: boolean;
    records: MedicalRecordResponseDTO[];
}

export interface GroupedMedicalRecordsDTO {
    totalCount: number;
    sections: RecordSectionDTO[];
}

const MEDICAL_RECORDS_API = 'patient/records';

export const medicalRecordsApi = {
    // Upload a new medical record
    uploadRecord: async (data: UploadMedicalRecordDTO): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const formData = new FormData();
        formData.append('File', data.file);
        formData.append('RecordType', data.recordType);
        if (data.description) formData.append('Description', data.description);
        if (data.recordDate) formData.append('RecordDate', data.recordDate);
        if (data.assignedDoctorId) formData.append('AssignedDoctorId', data.assignedDoctorId);
        if (data.tags) formData.append('Tags', data.tags);

        const response = await api.post(`${MEDICAL_RECORDS_API}/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 60000, // 60s timeout for large files
        });
        return response.data;
    },

    // Get all patient records (grouped for elderly-friendly timeline)
    getMyRecords: async (): Promise<{ success: boolean; message: string; data: GroupedMedicalRecordsDTO }> => {
        const response = await api.get(MEDICAL_RECORDS_API);
        return response.data;
    },

    // Get record details
    getRecordDetails: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.get(`${MEDICAL_RECORDS_API}/${id}`);
        return response.data;
    },

    // Update record metadata
    updateRecordMetadata: async (id: string, data: UpdateMedicalRecordMetadataDTO): Promise<{ success: boolean; message: string }> => {
        const response = await api.put(`${MEDICAL_RECORDS_API}/${id}/metadata`, data);
        return response.data;
    },

    // Delete/Soft-delete a record
    deleteRecord: async (id: string): Promise<{ success: boolean; message: string }> => {
        const response = await api.delete(`${MEDICAL_RECORDS_API}/${id}`);
        return response.data;
    },

    // Download a record (handles the Blob response to decrypt and download)
    downloadRecord: async (id: string): Promise<void> => {
        try {
            const response = await api.get(`${MEDICAL_RECORDS_API}/${id}/download`, {
                responseType: 'blob', // crucial for handling binary data stream
            });

            // Get filename from Content-Disposition header if available
            let filename = 'downloaded_record';
            const disposition = response.headers['content-disposition'];
            if (disposition && disposition.indexOf('attachment') !== -1) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches != null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            // Create a Blob from the response data
            const url = window.URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type'] }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();

            // Cleanup
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading record:', error);
            throw error;
        }
    },

    // FSM: Submit a Draft record for doctor review
    submitForReview: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`${MEDICAL_RECORDS_API}/${id}/submit`);
        return response.data;
    },

    // FSM: Archive a Certified record
    archiveRecord: async (id: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`${MEDICAL_RECORDS_API}/${id}/archive`);
        return response.data;
    },

    // FSM: Doctor certifies a record
    certifyRecord: async (id: string, notes?: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`doctor/records/${id}/certify`, { certificationNotes: notes });
        return response.data;
    },

    // FSM: Doctor rejects a record
    rejectRecord: async (id: string, reason: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO }> => {
        const response = await api.post(`doctor/records/${id}/reject`, { rejectionReason: reason });
        return response.data;
    },

    // Get all pending records for doctor review
    getPendingRecords: async (): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO[] }> => {
        const response = await api.get('doctor/pending-records');
        return response.data;
    },

    // ─────────────────────────────────────────────────────────
    // STREAMING DOWNLOAD — uses the pipelined backend endpoint.
    // Session-scoped cache: instant re-open on second click.
    // ─────────────────────────────────────────────────────────

    /**
     * Triggered when a user clicks "Download" on a certified record.
     * Uses streaming endpoint → attachment mode → triggers Save As dialog.
     * AbortController allows cancellation if the component unmounts.
     */
    downloadRecordForDoctor: async (id: string, signal?: AbortSignal): Promise<void> => {
        try {
            const baseUrl = '/api';

            const response = await fetch(`${baseUrl}/doctor/records/${id}/stream-download`, {
                credentials: 'include', // cookie-based auth (same as Axios withCredentials)
                signal,
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('Access denied');
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const contentDisposition = response.headers.get('content-disposition') ?? '';
            const filenameMatch = /filename="?([^";\n]+)"?/i.exec(contentDisposition);
            const filename = filenameMatch?.[1] ?? 'medical_record';

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 10_000);
        } catch (error: any) {
            if (error?.name === 'AbortError') return;
            console.error('[medicalRecordsApi] downloadRecordForDoctor failed:', error);
            toast.error('Failed to download secure record');
        }
    },

    /**
     * Triggered when a user clicks "View" on a certified record.
     * Uses streaming /view endpoint → inline Content-Disposition → browser opens natively.
     *
     /**
     * Retrieves the streaming URL for a certified record (Doctor view).
     * Returns the ObjectURL to use in an iframe.
     * Caches the URL for instant second access.
     */
    previewRecordForDoctor: async (id: string, signal?: AbortSignal): Promise<string> => {
        const cached = _viewUrlCache.get(id);
        if (cached) return cached;

        try {
            const baseUrl = '/api';

            const response = await fetch(`${baseUrl}/doctor/records/${id}/view`, {
                credentials: 'include',
                signal,
            });

            if (!response.ok) {
                if (response.status === 403) {
                    toast.error('Access denied. You are not authorized to view this record.');
                    throw new Error('Access denied');
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            _viewUrlCache.set(id, url);
            setTimeout(() => {
                URL.revokeObjectURL(url);
                _viewUrlCache.delete(id);
            }, 5 * 60 * 1000);

            return url;
        } catch (error: any) {
            if (error?.name === 'AbortError') throw error;
            console.error('[medicalRecordsApi] previewRecordForDoctor failed:', error);
            toast.error('Failed to open record. Please try again.');
            throw error;
        }
    },

    /**
     * Retrieves the streaming URL for a patient's own record.
     */
    previewRecord: async (id: string, signal?: AbortSignal): Promise<string> => {
        const cached = _viewUrlCache.get(id);
        if (cached) return cached;

        try {
            const baseUrl = '/api';

            const response = await fetch(`${baseUrl}/medical-records/view/${id}`, {
                credentials: 'include',
                signal,
            });

            if (!response.ok) {
                if (response.status === 403) throw new Error('Access denied');
                throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            _viewUrlCache.set(id, url);
            setTimeout(() => {
                URL.revokeObjectURL(url);
                _viewUrlCache.delete(id);
            }, 5 * 60 * 1000);

            return url;
        } catch (error: any) {
            if (error?.name === 'AbortError') throw error;
            console.error('[medicalRecordsApi] previewRecord failed:', error);
            toast.error('Failed to open record. Please try again.');
            throw error;
        }
    },

    /** Manually evict a record from the view cache (e.g., after it has been updated). */
    evictViewCache: (id: string): void => {
        const url = _viewUrlCache.get(id);
        if (url) URL.revokeObjectURL(url);
        _viewUrlCache.delete(id);
    },

    // Verify digital signature integrity
    verifySignature: async (id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            isValid: boolean;
            message: string;
            isCertified: boolean;
            certifiedBy: string;
            certifiedAt: string;
            recordHash: string;
            signature: string;
            hashMatchesCurrentFile: boolean;
            integrityStatus: string;
        }
    }> => {
        const response = await api.post(`medical-records/${id}/verify-signature`);
        return response.data;
    },

    // Get a specific patient's records (for doctors)
    getPatientRecordsForDoctor: async (patientId: string): Promise<{ success: boolean; message: string; data: MedicalRecordResponseDTO[] }> => {
        const response = await api.get(`medical-records/patient/${patientId}`);
        return response.data;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Session-scoped ObjectURL cache
// Keys: record ID → ObjectURL blob string
// Lifetime: current browser tab session only (GC'd on refresh)
// ─────────────────────────────────────────────────────────────────────────────
const _viewUrlCache = new Map<string, string>();
