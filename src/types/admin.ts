export interface Doctor {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    nmcLicense: string;
    department: string;
    specialization: string;
    qualificationDetails: string | null;
    createdAt: string;
    hasKeys: boolean;
}

export interface UpdateDoctorRequest {
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    nmcLicense: string;
    department: string;
    specialization: string;
    qualificationDetails?: string;
    isActive: boolean;
}
