import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChatState } from "@/types/store";
import { chatService } from "@/services/chatService";

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      loading: false,
      activeConversationId: null,
      setActiveConversations: (id: string | null) => {
        set({ activeConversationId: id });
      },
      reset: () => {
        set({
          conversations: [],
          messages: {},
          loading: false,
          activeConversationId: null,
        });
      },
      fetchConversations: async () => {
        try {
          set({ loading: true });
          const { conversations } = await chatService.fetchConversations();
          set({ conversations, loading: false });
        } catch (error) {
          console.error("Lỗi khi fetch conversations:", error);
          set({ loading: false });
        }
      },
    }),
    {
      name: "chat-store",
      partialize: (state) => ({ conversations: state.conversations }),
    },
  ),
);
