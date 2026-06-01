import api from "@/lib/axios";

export const callService = {
  /**
   * Khởi tạo cuộc gọi - tạo Call document trong DB
   */
  initiateCall: async (receiverId: string) => {
    try {
      const res = await api.post("/calls/initiate", { receiverId });
      return res.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Lỗi khi bắt đầu cuộc gọi"
      );
    }
  },

  /**
   * Chấp nhận cuộc gọi
   */
  acceptCall: async (callId: string) => {
    try {
      const res = await api.patch(`/calls/${callId}/accept`);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Lỗi khi chấp nhận cuộc gọi");
    }
  },

  /**
   * Từ chối cuộc gọi
   */
  rejectCall: async (callId: string) => {
    try {
      const res = await api.patch(`/calls/${callId}/reject`);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Lỗi khi từ chối cuộc gọi");
    }
  },

  /**
   * Kết thúc cuộc gọi
   */
  endCall: async (callId: string) => {
    try {
      const res = await api.patch(`/calls/${callId}/end`);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Lỗi khi kết thúc cuộc gọi");
    }
  },

  /**
   * Lấy lịch sử cuộc gọi
   */
  getCallHistory: async (limit = 20, skip = 0) => {
    try {
      const res = await api.get(`/calls/history?limit=${limit}&skip=${skip}`);
      return res.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Lỗi khi lấy lịch sử cuộc gọi");
    }
  },
};
