import { toast } from "sonner";
import { persist } from "zustand/middleware";
import { create } from "zustand";
import { adminService } from "@/services/adminService";
import type { AdminState } from "@/types/store";

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      users: [],
      page: 1,
      total: 0,
      totalPages: 0,
      loading: false,
      actionLoading: false,
      error: null,
      // Fetch all users
      getAllUser: async (page = 1, limit = 20) => {
        try {
          set({ loading: true, error: null });
          const res = await adminService.getAllUser(page, limit);
          set({
            users: res.users ?? [],
            page: res.page ?? page,
            total: res.total ?? 0,
            totalPages: res.totalPages ?? 0,
            loading: false,
          });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message ?? "Cannot load users";
          set({ error: errorMessage, loading: false });
          toast.error(errorMessage);
        } finally {
          set({ loading: false });
        }
      },
      // Delete user
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
          toast.error(
            error.response?.data?.message ?? "Delete user failed"
          );
        } finally {
          set({ actionLoading: false });
        }
      },


      // Promote
      promoteUser: async (userId) => {
        try {
          set({ actionLoading: true });

          const res = await adminService.promoteUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    role: "admin",
                  }
                : u
            ),
          }));

          toast.success("Promoted to admin successfully");
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ?? "Promote failed"
          );
        } finally {
          set({ actionLoading: false });
        }
      },

      // ===========================
      // Demote
      demoteUser: async (userId) => {
        try {
          set({ actionLoading: true });

          const res = await adminService.demoteUser(userId);

          set((state) => ({
            users: state.users.map((u) =>
              u._id === userId
                ? {
                    ...u,
                    role: "user",
                  }
                : u
            ),
          }));

            toast.success("Demoted to user successfully");
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ?? "Demote failed"
          );
        } finally {
          set({ actionLoading: false });
        }
      },

      // Block
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
                : u
            ),
          }));

          toast.success(res.message);
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ?? "Block failed"
          );
        } finally {
          set({ actionLoading: false });
        }
      },

      // Activate

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
                : u
            ),
          }));

          toast.success(res.message);
        } catch (error: any) {
          toast.error(
            error.response?.data?.message ?? "Activate failed"
          );
        } finally {
          set({ loading: false });
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: "admin-storage",
    },
  ),
);
