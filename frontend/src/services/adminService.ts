import api from "@/lib/axios";
import type { UserResponse, AdminActionResponse } from "@/types/admin";

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

};
