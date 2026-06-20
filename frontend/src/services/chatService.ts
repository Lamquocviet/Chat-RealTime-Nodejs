import api from "@/lib/axios";
import type { ConversationResponse, Message } from "@/types/chat";

interface FetchMessageProps {
  messages: Message[];
  cursor?: string;
}

const pageLimit = 50;

export const chatService = {
  async fetchConversations(): Promise<ConversationResponse> {
    const res = await api.get("/conversations");
    return res.data;
  },

  async fetchMessages(id: string, cursor?: string): Promise<FetchMessageProps> {
    const res = await api.get(
      `/conversations/${id}/messages?limit=${pageLimit}&cursor=${cursor}`
    );

    return { messages: res.data.messages, cursor: res.data.nextCursor };
  },
  async sendDirectMessage(
  recipientId: string,
  content: string,
  files?: File[],
  conversationId?: string
) {
  const formData = new FormData();

  formData.append("recipientId", recipientId);
  formData.append("content", content);

  if (conversationId) {
    formData.append(
      "conversationId",
      conversationId
    );
  }

  files?.forEach((file) => {
    formData.append("files", file);
  });

  const res = await api.post(
    "/messages/direct",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return res.data.message;
},
async sendGroupMessage(
  conversationId: string,
  content: string,
  files?: File[]
) {
  const formData = new FormData();

  formData.append(
    "conversationId",
    conversationId
  );

  formData.append(
    "content",
    content
  );

  files?.forEach((file) => {
    formData.append("files", file);
  });

  const res = await api.post(
    "/messages/group",
    formData,
    {
      headers: {
        "Content-Type":
          "multipart/form-data",
      },
    }
  );

  return res.data.message;
},

  // async sendDirectMessage(
  //   recipientId: string,
  //   content: string = "",
  //   imgUrl?: string,
  //   conversationId?: string
  // ) {
  //   const res = await api.post("/messages/direct", {
  //     recipientId,
  //     content,
  //     imgUrl,
  //     conversationId,
  //   });

  //   return res.data.message;
  // },

  // async sendGroupMessage(
  //   conversationId: string,
  //   content: string = "",
  //   imgUrl?: string
  // ) {
  //   const res = await api.post("/messages/group", {
  //     conversationId,
  //     content,
  //     imgUrl,
  //   });
  //   return res.data.message;
  // },

  async markAsSeen(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/seen`);
    return res.data;
  },

  async createConversation(
    type: "direct" | "group",
    name: string,
    memberIds: string[]
  ) {
    const res = await api.post("/conversations", { type, name, memberIds });
    return res.data.conversation;
  },
  //them thanh vien vao group
  async addGroupMembers(conversationId: string, memberIds: string[]) {
    const res = await api.post(`/conversations/${conversationId}/members`, {
      memberIds,
    });
    return res.data;
  },
  // Giai tan nhom
  async deleteGroup(conversationId: string) 
  {
    const res = await api.delete(`/conversations/${conversationId}`);
    return res.data;
  },
  // Roi nhom
  async leaveGroup(conversationId: string) {
    const res = await api.patch(`/conversations/${conversationId}/leave`);
    return res.data;
  },
  // xoa thanh vien khoi nhom
  async removeGroupMember(conversationId: string, memberId: string) {
    const res = await api.delete(
      `/conversations/${conversationId}/members/${memberId}`
    );
    return res.data;
  },
};
