import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { adminApi, doctorApi, patientApi } from '@/lib/api';
import { doctorAvailabilityApi } from '@/lib/api/doctor-availability';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';
import axiosInstance from '@/lib/utils/axios';
import { useAuthStore } from '@/store/authStore';

// ─── Shared stale times ───────────────────────────────────────────────────────
const STALE = {
  short: 1000 * 30,        // 30s  — security-sensitive (audit logs)
  default: 1000 * 60 * 2,  // 2min — most pages
  long: 1000 * 60 * 10,    // 10min — rarely-changing data (departments, availability)
  live: 1000 * 10,         // 10s  — live metrics (system stats)
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useAdminDashboardStats() {
  return useQuery({
    queryKey: queryKeys.admin.dashboardStats(),
    queryFn: adminApi.getDashboardStats,
    staleTime: STALE.default,
  });
}

export interface UserFilters { page?: number; pageSize?: number; searchTerm?: string; role?: string; isActive?: boolean }

export function useAdminUsers(filters: UserFilters = { page: 1 }) {
  const searchTerm = filters.searchTerm || undefined;
  return useQuery({
    queryKey: queryKeys.admin.users.list(filters.page || 1, searchTerm, filters.role || undefined, filters.isActive),
    queryFn: () => adminApi.getUsers({ ...filters, searchTerm }),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: queryKeys.admin.users.detail(id),
    queryFn: () => adminApi.getUserById(id),
    enabled: !!id,
  });
}

export interface DoctorFilters { page?: number; pageSize?: number; searchTerm?: string; department?: string; isActive?: boolean }

export function useAdminDoctors(filters: DoctorFilters = { page: 1 }) {
  const searchTerm = filters.searchTerm || undefined;
  const department = filters.department || undefined;
  return useQuery({
    queryKey: queryKeys.admin.doctors.list(filters.page || 1, department, searchTerm, filters.isActive),
    queryFn: () => adminApi.getDoctors({ ...filters, searchTerm, department }),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function useAdminDepartments() {
  return useQuery({
    queryKey: queryKeys.admin.departments.list(),
    queryFn: adminApi.getDepartments,
    staleTime: STALE.long,
  });
}

export function useAdminPatients(page = 1, search?: string, isActive?: boolean) {
  const searchTerm = search || undefined;
  return useQuery({
    queryKey: queryKeys.admin.patients.list(page, searchTerm, isActive),
    queryFn: () => adminApi.getPatients({ page, searchTerm, isActive }),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function useAuditLogs(page = 1) {
  return useQuery({
    queryKey: queryKeys.admin.auditLogs.list(page),
    queryFn: () => adminApi.getAuditLogs({ page }),
    staleTime: STALE.short,
    placeholderData: (prev) => prev,
  });
}

export function useSystemStats() {
  return useQuery({
    queryKey: queryKeys.admin.systemStats(),
    queryFn: adminApi.getSystemStats,
    staleTime: STALE.live,
    refetchInterval: STALE.live,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useDoctorDashboardStats() {
  return useQuery({
    queryKey: queryKeys.doctor.dashboardStats(),
    queryFn: doctorApi.getDashboardStats,
    staleTime: STALE.default,
  });
}

export function useDoctorRecordGrowth() {
  return useQuery({
    queryKey: ['doctor', 'record-growth'],
    queryFn: async () => {
      const res = await axiosInstance.get('doctor/statistics/record-growth');
      return res.data;
    },
    staleTime: STALE.default,
  });
}

export function useDoctorPendingRecords(page = 1) {
  return useQuery({
    queryKey: queryKeys.doctor.pendingRecords.list(page),
    queryFn: () => doctorApi.getPendingRecords(page),
    staleTime: STALE.short,
    placeholderData: (prev) => prev,
  });
}

export function useDoctorCertifiedRecords(page = 1) {
  return useQuery({
    queryKey: queryKeys.doctor.certifiedRecords.list(page),
    queryFn: () => doctorApi.getCertifiedRecords(page),
    staleTime: STALE.long,
    placeholderData: (prev) => prev,
  });
}

export function useDoctorPatients(page = 1, search?: string) {
  const searchTerm = search || undefined;
  return useQuery({
    queryKey: queryKeys.doctor.patients.list(page, searchTerm),
    queryFn: () => doctorApi.getMyPatients(page, searchTerm),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function useDoctorAppointments(page = 1) {
  return useQuery({
    queryKey: queryKeys.doctor.appointments.list(page),
    queryFn: () => doctorApi.getAppointments(page),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function useDoctorAvailability() {
  return useQuery({
    queryKey: queryKeys.doctor.availability(),
    queryFn: doctorApi.getAvailability,
    staleTime: STALE.long,
  });
}

export function useDoctorProfile() {
  return useQuery({
    queryKey: queryKeys.doctor.profile(),
    queryFn: doctorApi.getProfile,
    staleTime: STALE.default,
  });
}

export function useDoctorSchedule(start: string, end: string) {
  return useQuery({
    queryKey: queryKeys.doctor.schedule(start, end),
    queryFn: () => doctorAvailabilityApi.getSchedule(start, end),
    staleTime: STALE.default,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function usePatientRecords(page = 1, search?: string) {
  return useQuery({
    queryKey: queryKeys.patient.records.list(page, search),
    queryFn: () => medicalRecordsApi.getMyRecords(),
    placeholderData: (prev) => prev,
  });
}

export function usePatientRecordsGroups() {
  return useQuery({
    queryKey: queryKeys.patient.records.all(),
    queryFn: () => medicalRecordsApi.getMyRecords(),
    staleTime: STALE.default,
  });
}

export function usePatientRecord(id: string) {
  return useQuery({
    queryKey: queryKeys.patient.records.detail(id),
    queryFn: () => medicalRecordsApi.getRecordDetails(id),
    enabled: !!id,
    staleTime: STALE.long,
  });
}

export function usePatientAppointments(page = 1) {
  return useQuery({
    queryKey: queryKeys.patient.appointments.list(page),
    queryFn: () => patientApi.getAppointments(page),
    staleTime: STALE.default,
    placeholderData: (prev) => prev,
  });
}

export function usePatientQRCodes() {
  return useQuery({
    queryKey: queryKeys.patient.qrCodes.list(),
    queryFn: patientApi.getQRCodes,
    staleTime: STALE.default,
  });
}

export function usePatientProfile() {
  return useQuery({
    queryKey: queryKeys.patient.profile(),
    queryFn: patientApi.getProfile,
    staleTime: STALE.default,
  });
}

export function usePatientDoctorDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.patient.doctorDetail(id),
    queryFn: () => patientApi.getDoctorById(id),
    enabled: !!id,
    staleTime: STALE.long,
  });
}

export function usePatientDoctorSuggestions() {
  return useQuery({
    queryKey: ['patient', 'doctorSuggestions'],
    queryFn: patientApi.getSmartDoctorSuggestions,
    staleTime: STALE.default,
  });
}

export function useUserDevices() {
  const { getUserDevices } = useAuthStore.getState();
  return useQuery({
    queryKey: ['auth', 'devices'],
    queryFn: getUserDevices,
    staleTime: STALE.default,
  });
}
