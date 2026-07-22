import type { User } from "./user";

export interface UserResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  users: User[];
}

export interface AdminActionResponse {
  success: boolean;
  message: string;
  user?: User;
}

export interface UserStatsSummary {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  inactiveUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  newUsersMonth: number;
}

export interface UserDistribution {
  name: string;
  value: number;
}

export interface NewUsersChartItem {
  day: number;
  users: number;
}

export interface UserStatsResponse {
  summary: UserStatsSummary;
  distribution: UserDistribution[];
  newUsersChart: NewUsersChartItem[];
}

export interface AuditLogItem {
  _id?: string;
  id?: string;
  createdAt?: string;
  actor?: {
    _id?: string;
    displayName?: string;
    username?: string;
    avatarUrl?: string;
    role?: string;
  };
  actorName?: string;
  actorRole?: string;
  module?: string;
  action?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  description?: string;
  details?: Record<string, unknown> | string;
  ipAddress?: string;
  status?: string;
  severity?: string;
}

export interface AuditLogFilters {
  module?: string;
  action?: string;
  status?: string;
  severity?: string;
  actor?: string;
  actorRole?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditLogListResponse {
  success: boolean;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  logs: AuditLogItem[];
}

export interface AuditLogStatsResponse {
  success: boolean;
  stats: {
    totalLogs: number;
    logsToday: number;
    failedActions: number;
    userActions: number;
    adminActions: number;
    authenticationActions: number;
  };
}

export interface AdminState {
  users: User[];
  page: number;
  total: number;
  totalPages: number;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;

  getAllUser: (page?: number, limit?: number) => Promise<void>;

  deleteUser: (userId: string) => Promise<void>;

  promoteUser: (userId: string) => Promise<void>;

  demoteUser: (userId: string) => Promise<void>;

  blockUser: (userId: string) => Promise<void>;

  activeUser: (userId: string) => Promise<void>;
  getUserStats: () => Promise<void>;
  statsLoading: boolean;
  summary: UserStatsSummary | null;
  distribution: UserDistribution[];
  newUsersChart: NewUsersChartItem[];

  auditLogs: AuditLogItem[];
  auditLogsPage: number;
  auditLogsTotal: number;
  auditLogsTotalPages: number;
  auditLogsLoading: boolean;
  auditLogStats: AuditLogStatsResponse["stats"] | null;
  auditLogStatsLoading: boolean;
  auditLogError: string | null;

  getAuditLogs: (page?: number, limit?: number, filters?: AuditLogFilters) => Promise<void>;
  getAuditLogStats: () => Promise<void>;

  clearError: () => void;
}