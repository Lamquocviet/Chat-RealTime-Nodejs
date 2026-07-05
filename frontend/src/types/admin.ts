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
