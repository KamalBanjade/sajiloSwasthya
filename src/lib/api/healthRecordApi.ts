import axiosInstance from '../utils/axios';

export interface CreateHealthRecordRequest {
    patientId: string;
    appointmentId?: string;
    vitals: {
        bloodPressureSystolic: number;
        bloodPressureDiastolic: number;
        heartRate: number;
        temperature: number;
        weight: number;
        height: number;
        spO2: number;
    };
    sections: {
        sectionName: string;
        attributes: {
            name: string;
            value: string;
            unit?: string;
            normalRangeMin?: number;
            normalRangeMax?: number;
            fieldType?: string;
        }[];
    }[];
    diagnosis: string;
    treatmentPlan: string;
    doctorNotes?: string;
    templateId?: string;  // Links the record to its source template for analysis filtering
    excludedFields?: string[]; // Field names the doctor explicitly deleted
}

export interface ProtocolDTO {
    id?: string;
    templateName: string;
    sections: {
        sectionName: string;
        fields: {
            fieldName: string;
            lastValue?: string;
            unit?: string;
            normalRange?: string;
            fieldType?: string;
        }[];
    }[];
}

export interface VitalsComparison {
    lastVisit?: any;
    suggested?: any;
    lockedFields: string[];
}

export interface VisitContext {
    type: 'FirstVisit' | 'FollowUp' | 'RoutineCheckup' | 'LongGapVisit';
    daysSinceLastVisit: number;
    lastDiagnosis?: string;
    prePopulateVitals: boolean;
    prePopulateProtocol: boolean;
    vitalsComparison: VitalsComparison;
    protocolToLoad?: ProtocolDTO;
    previousRecord?: any;
}

export const healthRecordApi = {
    createRecord: async (data: CreateHealthRecordRequest) => {
        const response = await axiosInstance.post('health-records', data);
        return response.data;
    },

    getRecord: async (id: string) => {
        const response = await axiosInstance.get(`health-records/${id}`);
        return response.data;
    },

    getPatientRecords: async (patientId: string) => {
        const response = await axiosInstance.get(`health-records/patient/${patientId}`);
        return response.data;
    },

    getVisitContext: async (patientId: string) => {
        const response = await axiosInstance.get(`health-records/visit-context/${patientId}`);
        return response.data;
    }
};
