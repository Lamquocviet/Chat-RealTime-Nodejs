import { toast } from "sonner";
import { persist } from "zustand/middleware";
import { create } from "zustand";
import { adminService } from "@/services/adminService";
import type { AdminState, AuditLogFilters } from "@/types/admin";

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      users: [],
      page: 1,
      total: 0,
      totalPages: 0,
      summary: null,
      distribution: [],
      newUsersChart: [],
      auditLogs: [],
      auditLogsPage: 1,
      auditLogsTotal: 0,
      auditLogsTotalPages: 0,
      auditLogStats: null,

      statsLoading: false,
      loading: false,
      actionLoading: false,
      auditLogsLoading: false,
      auditLogStatsLoading: false,
      error: null,
      auditLogError: null,

      getAllUser: async (page = 1, limit = 20) => {
        try {
          set({ loading: true, error: null });
          const res = await adminService.getAllUser(page, limit);
          set({
            users: res.users ?? [],
            page: res.page ?? page,
            total: res.total ?? 0,
            totalPages: res.totalPages ?? 0,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message ?? "Cannot load users";
          set({ error: errorMessage });
          toast.error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },

      deleteUser: async (userId) => {
        try {
          set({ actionLoading: true });

          const res = await adminService.deleteUser(userId);

          set((state) => ({
            users: state.users.filter((u) => u._id !== userId),
            total: Math.max(0, state.total - 1),
          }));

          toast.success(res.message);
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Delete user failed");
        } finally {
          set({ actionLoading: false });
        }
      },

      promoteUser: async (userId) => {
        try {
          set({ actionLoading: true });

          await adminService.promoteUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    role: "admin",
                  }
                : u,
            ),
          }));

          toast.success("Promoted to admin successfully");
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Promote failed");
        } finally {
          set({ actionLoading: false });
        }
      },

      demoteUser: async (userId) => {
        try {
          set({ actionLoading: true });

          await adminService.demoteUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    role: "user",
                  }
                : u,
            ),
          }));

          toast.success("Demoted to user successfully");
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Demote failed");
        } finally {
          set({ actionLoading: false });
        }
      },

      blockUser: async (userId) => {
        try {
          set({ actionLoading: true });

          const res = await adminService.blockUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    status: "blocked",
                  }
                : u,
            ),
          }));

          toast.success(res.message);
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Block failed");
        } finally {
          set({ actionLoading: false });
        }
      },

      activeUser: async (userId) => {
        try {
          set({ actionLoading: true });

          const res = await adminService.activeUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    status: "active",
                  }
                : u,
            ),
          }));

          toast.success(res.message);
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Activate failed");
        } finally {
          set({ actionLoading: false });
        }
      },

      getUserStats: async () => {
        try {
          set({ statsLoading: true });

          const res = await adminService.getUserStats();

          set({
            summary: res.summary,
            distribution: res.distribution,
            newUsersChart: res.newUsersChart,
          });
        } catch (error: any) {
          toast.error(error.response?.data?.message ?? "Cannot load statistics");
        } finally {
          set({ statsLoading: false });
        }
      },

      getAuditLogs: async (page = 1, limit = 20, filters: AuditLogFilters = {}) => {
        try {
          set({ auditLogsLoading: true, auditLogError: null });
          const res = await adminService.getAuditLogs(page, limit, filters);
          set({
            auditLogs: res.logs ?? [],
            auditLogsPage: res.page ?? page,
            auditLogsTotal: res.total ?? 0,
            auditLogsTotalPages: res.totalPages ?? 0,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message ?? "Cannot load audit logs";
          set({ auditLogError: errorMessage });
          toast.error(errorMessage);
        } finally {
          set({ auditLogsLoading: false });
        }
      },

      getAuditLogStats: async () => {
        try {
          set({ auditLogStatsLoading: true, auditLogError: null });
          const res = await adminService.getAuditLogStats();
          set({ auditLogStats: res.stats ?? null });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message ?? "Cannot load audit log statistics";
          set({ auditLogError: errorMessage });
          toast.error(errorMessage);
        } finally {
          set({ auditLogStatsLoading: false });
        }
      },

      clearError: () => set({ error: null, auditLogError: null }),
    }),
    {
      name: "admin-storage",
    },
  ),
);
