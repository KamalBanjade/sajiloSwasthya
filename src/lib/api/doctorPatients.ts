import axiosInstance from "../utils/axios";

export interface PatientListResponseDTO {
    id: string; // Patient ID
    userId: string; // Identity User ID
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    dateOfBirth: string; // ISO String
    gender: string;
    bloodType?: string;
    allergies?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelationship?: string;
    sharedRecordsCount: number;
    appointmentCount: number;
    latestSharedRecordDate?: string;
    lastAppointmentDate?: string;
    isPrimary: boolean;
    profilePictureUrl?: string;
}


export const doctorPatientsApi = {
    /**
     * Gets all patients who have assigned/shared records with the authenticated doctor
     */
    getDoctorPatients: async (): Promise<PatientListResponseDTO[]> => {
        const response = await axiosInstance.get('/doctor/patients');
        return response.data.data;
    },

    /**
     * Creates a new patient account directly by the doctor
     */
    createPatient: async (data: any): Promise<any> => {
        const response = await axiosInstance.post('/doctor/patients', data);
        return response.data;
    },
    /**
     * Deletes a patient and all their associated data from the system
     */
    deletePatient: async (id: string): Promise<any> => {
        const response = await axiosInstance.delete(`/doctor/patients/${id}`);
        return response.data;
    }
};
