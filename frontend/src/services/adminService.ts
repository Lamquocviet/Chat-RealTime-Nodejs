import api from "@/lib/axios";
import type { UserResponse } from "@/types/admin";

export const adminService = {
  async getAllUser(page = 1, limit = 10): Promise<UserResponse> {
    const res = await api.get("admin/", { params: { page, limit } });

    return res.data;
  }
};
