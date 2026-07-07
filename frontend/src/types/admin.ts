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
  clearError: () => void;
}