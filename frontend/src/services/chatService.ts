import type { ConversationResponse, Message } from "@/types/chat";
import api from "@/lib/axios";

interface FetchMessaggesProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;
export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },
  async fetchMessages(
    id: string,
    cursor?: string,
  ): Promise<FetchMessaggesProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`,
    );
    console.log("Fetched messages:", res.data);
    return {
      messages: res.data.messages,
      cursor: res.data.nextCursor,
    };
  },
  async sendDirectMessage (recipientId: string, content: string, imgUrl?: string, conversationId?: string){
    const res = await api.post("/messages/direct", {
      recipientId,
      content,
      imgUrl,
      conversationId
    });
    return res.data.message;
  },
  async sendGroupMessage(
    conversationId: string,
    content: string = "",
    imgUrl?: string
  ) {
    const res = await api.post("/messages/group", {
      conversationId,
      content,
      imgUrl,
    });
    return res.data.message;
  },
  
};
