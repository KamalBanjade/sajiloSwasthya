import { useQueryClient, QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { adminApi, doctorApi, patientApi } from '@/lib/api';
import { medicalRecordsApi } from '@/lib/api/medicalRecords';

type PrefetchFn = (qc: QueryClient) => void;

// ─── Route → prefetch map ─────────────────────────────────────────────────────
// Covers all three roles. staleTime here should match the hook's staleTime.

const PREFETCH_MAP: Record<string, PrefetchFn> = {

  // ── Admin routes ────────────────────────────────────────────────────────────
  '/admin/dashboard': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.systemStats(),
    queryFn: adminApi.getSystemStats,
    staleTime: 1000 * 10,
  }),

  '/admin/users': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.users.list(1, undefined),
    queryFn: () => adminApi.getUsers({ page: 1, searchTerm: undefined }),
    staleTime: 1000 * 60 * 2,
  }),

  '/admin/doctors': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.doctors.list(1, undefined, undefined, undefined),
    queryFn: () => adminApi.getDoctors({ page: 1, department: undefined, searchTerm: undefined, isActive: undefined }),
    staleTime: 1000 * 60 * 2,
  }),

  '/admin/departments': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.departments.list(),
    queryFn: adminApi.getDepartments,
    staleTime: 1000 * 60 * 10,
  }),

  '/admin/patients': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.patients.list(1, undefined, undefined),
    queryFn: () => adminApi.getPatients({ page: 1, searchTerm: undefined, isActive: undefined }),
    staleTime: 1000 * 60 * 2,
  }),

  '/admin/audit-logs': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.auditLogs.list(1),
    queryFn: () => adminApi.getAuditLogs({ page: 1 }),
    staleTime: 1000 * 30,
  }),

  '/admin/statistics': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.admin.systemStats(),
    queryFn: adminApi.getSystemStats,
    staleTime: 1000 * 10,
  }),

  // ── Doctor routes ───────────────────────────────────────────────────────────
  '/doctor/dashboard': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.dashboardStats(),
    queryFn: doctorApi.getDashboardStats,
    staleTime: 1000 * 60 * 2,
  }),

  '/doctor/pending-records': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.pendingRecords.list(1),
    queryFn: () => doctorApi.getPendingRecords(1),
    staleTime: 1000 * 30,
  }),

  '/doctor/certified-records': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.certifiedRecords.list(1),
    queryFn: () => doctorApi.getCertifiedRecords(1),
    staleTime: 1000 * 60 * 10,
  }),

  '/doctor/patients': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.patients.list(1, undefined),
    queryFn: () => doctorApi.getMyPatients(1, undefined),
    staleTime: 1000 * 60 * 2,
  }),

  '/doctor/appointments': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.appointments.list(1), // Standardizing to match hook
    queryFn: () => doctorApi.getAppointments(1),
    staleTime: 1000 * 60 * 2,
  }),

  '/doctor/availability': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.doctor.availability(),
    queryFn: doctorApi.getAvailability,
    staleTime: 1000 * 60 * 10,
  }),

  // ── Patient routes ──────────────────────────────────────────────────────────
  '/dashboard': (qc) => qc.prefetchQuery({
    queryKey: ['patient-medical-records'],
    queryFn: () => medicalRecordsApi.getMyRecords(),
    staleTime: 1000 * 60 * 2,
  }),

  '/records': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.patient.records.list(1),
    queryFn: () => medicalRecordsApi.getMyRecords(),
    staleTime: 1000 * 60 * 2,
  }),

  '/appointments': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.patient.appointments.list(1),
    queryFn: () => patientApi.getAppointments(1),
    staleTime: 1000 * 60 * 2,
  }),

  '/qr-codes': (qc) => qc.prefetchQuery({
    queryKey: queryKeys.patient.qrCodes.list(),
    queryFn: patientApi.getQRCodes,
    staleTime: 1000 * 60 * 2,
  }),
};

/**
 * usePrefetchRoute
 * Returns an onMouseEnter handler. Attach it to any Link or nav item.
 */
export function usePrefetchRoute(href: string) {
  const queryClient = useQueryClient();

  return () => {
    const prefetch = PREFETCH_MAP[href];
    if (prefetch) {
      prefetch(queryClient as any);
    }
  };
}
