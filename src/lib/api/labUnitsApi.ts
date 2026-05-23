import axiosInstance from '../utils/axios';

export interface LabUnit {
    id: string;
    measurementType: string;
    commonUnits: string[];
    defaultUnit?: string;
    normalRangeLow?: number;
    normalRangeHigh?: number;
    normalRangeUnit?: string;
    aliases: string[];
    category?: string;
}

export interface CreateCustomLabUnitRequest {
    measurementType: string;
    commonUnits: string[];
    defaultUnit?: string;
    normalRangeLow?: number;
    normalRangeHigh?: number;
    normalRangeUnit?: string;
    category?: string;
}

export const labUnitsApi = {
    search: async (query: string): Promise<LabUnit[]> => {
        const response = await axiosInstance.get(`labunits/search?query=${query}`);
        return response.data.data;
    },

    createCustom: async (data: CreateCustomLabUnitRequest): Promise<LabUnit> => {
        const response = await axiosInstance.post('labunits/custom', data);
        return response.data.data;
    }
};
