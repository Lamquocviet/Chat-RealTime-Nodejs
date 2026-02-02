import type { ConversationResponse } from "@/types/Chat";
import api from "@/lib/axios";

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },
};
