import type { User } from "./user";

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  onlineUsers: number;
  newUsersToday: number;
}

export interface AdminState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;

  fetchStats: () => Promise<void>;
  refetch: () => Promise<void>;
  resetError: () => void;
}

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