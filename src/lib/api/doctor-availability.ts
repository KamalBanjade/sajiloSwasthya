import axiosInstance from '../utils/axios';
import { ApiResponse } from '../types';

export interface DoctorAvailabilityDTO {
  id: string;
  doctorId: string;
  dayOfWeek?: number;
  specificDate?: string;
  startTime: string; // "HH:mm:ss"
  endTime: string;
  isAvailable: boolean;
  recurrenceType: number | string;
  reason?: string;
}

export interface SetWorkingHoursRequest {
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string;
  breakStartTime?: string;
  breakEndTime?: string;
}

export interface BlockTimeRequest {
  startDateTime: string;
  endDateTime: string;
  reason: string;
}

export const doctorAvailabilityApi = {
  getSchedule: async (startDate: string, endDate: string): Promise<ApiResponse<DoctorAvailabilityDTO[]>> => {
    const response = await axiosInstance.get('doctor/availability/schedule', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  setWorkingHours: async (data: SetWorkingHoursRequest): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('doctor/availability/working-hours', data);
    return response.data;
  },

  blockTime: async (data: BlockTimeRequest): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.post('doctor/availability/block', data);
    return response.data;
  },

  unblockTime: async (id: string): Promise<ApiResponse<any>> => {
    const response = await axiosInstance.delete(`doctor/availability/${id}`);
    return response.data;
  },

  getSlots: async (doctorId: string, date: string): Promise<ApiResponse<string[]>> => {
    const response = await axiosInstance.get(`doctor/availability/slots/${doctorId}`, {
      params: { date }
    });
    return response.data;
  }
};
