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
      error: null,

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
      clearError: () => set({ error: null }),
    }),
    {
      name: "admin-storage",
    },
  ),
);
