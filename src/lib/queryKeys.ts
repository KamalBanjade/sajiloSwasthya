// Single source of truth for all React Query cache keys.
// This prevents typos and makes cache invalidation predictable.
// Triggering re-evaluation of types.

export const queryKeys = {
  // ── Admin ────────────────────────────────────────────────────────────────
  admin: {
    dashboardStats: () => ['admin', 'dashboardStats'] as const,
    users: {
      all: () => ['admin', 'users'] as const,
      list: (page: number, search?: string, role?: string, isActive?: boolean) => ['admin', 'users', 'list', page, search, role, isActive] as const,
      detail: (id: string) => ['admin', 'users', 'detail', id] as const,
    },
    doctors: {
      all: () => ['admin', 'doctors'] as const,
      list: (page: number, dept?: string, search?: string, isActive?: boolean) => ['admin', 'doctors', 'list', page, dept, search, isActive] as const,
      detail: (id: string) => ['admin', 'doctors', 'detail', id] as const,
    },
    departments: {
      list: () => ['admin', 'departments', 'list'] as const,
    },
    patients: {
      all: () => ['admin', 'patients'] as const,
      list: (page: number, search?: string, isActive?: boolean) => ['admin', 'patients', 'list', page, search, isActive] as const,
    },
    auditLogs: {
      all: () => ['admin', 'auditLogs'] as const,
      list: (page: number) => ['admin', 'auditLogs', 'list', page] as const,
    },
    systemStats: () => ['admin', 'systemStats'] as const,
  },

  // ── Doctor ───────────────────────────────────────────────────────────────
  doctor: {
    dashboardStats: () => ['doctor', 'dashboardStats'] as const,
    pendingRecords: {
      all: () => ['doctor', 'pendingRecords'] as const,
      list: (page: number) => ['doctor', 'pendingRecords', 'list', page] as const,
    },
    certifiedRecords: {
      all: () => ['doctor', 'certifiedRecords'] as const,
      list: (page: number) => ['doctor', 'certifiedRecords', 'list', page] as const,
    },
    patients: {
      all: () => ['doctor', 'patients'] as const,
      list: (page: number, search?: string) => ['doctor', 'patients', 'list', page, search] as const,
    },
    appointments: {
      all: () => ['doctor', 'appointments'] as const,
      list: (page: number) => ['doctor', 'appointments', 'list', page] as const,
    },
    availability: () => ['doctor', 'availability'] as const,
    schedule: (start: string, end: string) => ['doctor', 'availability', 'schedule', start, end] as const,
    profile: () => ['doctor', 'profile'] as const,
  },

  // ── Patient ──────────────────────────────────────────────────────────────
  patient: {
    dashboardStats: () => ['patient', 'dashboardStats'] as const,
    records: {
      all: () => ['patient', 'records'] as const,
      list: (page: number, search?: string) => ['patient', 'records', 'list', page, search] as const,
      detail: (id: string) => ['patient', 'records', 'detail', id] as const,
    },
    appointments: {
      all: () => ['patient', 'appointments'] as const,
      list: (page: number) => ['patient', 'appointments', 'list', page] as const,
    },
    qrCodes: {
      list: () => ['patient', 'qrCodes', 'list'] as const,
    },
    profile: () => ['patient', 'profile'] as const,
    doctorDetail: (id: string) => ['patient', 'doctors', 'detail', id] as const,
  },

  // ── Chat ─────────────────────────────────────────────────────────────────
  chat: {
    conversations: () => ['chat', 'conversations'] as const,
    conversation: (otherUserId: string, page: number) => ['chat', 'conversation', otherUserId, page] as const,
    unreadCount: () => ['chat', 'unreadCount'] as const,
    onlineStatus: (userId: string) => ['chat', 'onlineStatus', userId] as const,
  },
};
