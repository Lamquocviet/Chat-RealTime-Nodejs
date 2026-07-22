import api from "@/lib/axios";
import type { AdminActionResponse, AuditLogFilters, AuditLogListResponse, AuditLogStatsResponse, UserResponse } from "@/types/admin";

export const adminService = {
  async getAllUser(page = 1, limit = 10): Promise<UserResponse> {
    const res = await api.get("admin/", { params: { page, limit } });

    return res.data;
  },

  // Delete user
  async deleteUser(userId: string): Promise<AdminActionResponse> {
    const res = await api.delete(`/admin/${userId}`);
    return res.data;
  },

  // Promote -> Admin
  async promoteUser(userId: string): Promise<AdminActionResponse> {
    const res = await api.patch(`/admin/${userId}/promote`);
    return res.data;
  },

  // Demote -> User
  async demoteUser(userId: string): Promise<AdminActionResponse> {
    const res = await api.patch(`/admin/${userId}/demote`);
    return res.data;
  },

  // Block user
  async blockUser(userId: string): Promise<AdminActionResponse> {
    const res = await api.patch(`/admin/${userId}/block`);
    return res.data;
  },

  // Activate user
  async activeUser(userId: string): Promise<AdminActionResponse> {
    const res = await api.patch(`/admin/${userId}/active`);
    return res.data;
  },

  async getUserStats() {
    const res = await api.get("/admin/stats/users");
    return res.data;
  },

  async getAuditLogs(page = 1, limit = 20, filters: AuditLogFilters = {}): Promise<AuditLogListResponse> {
    const params: Record<string, string | number> = { page, limit };

    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "All Actions" && value !== "All Status" && value !== "All Admins") {
        params[key] = value;
      }
    });

    const res = await api.get("/admin/audit-log", { params });
    return res.data;
  },

  async getAuditLogStats(): Promise<AuditLogStatsResponse> {
    const res = await api.get("/admin/stats-log");
    return res.data;
  },
};
