import { create } from "zustand";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";
import type { SocketState } from "@/types/store";
import { useChatStore } from "./useChatStore";
import { useCallStore } from "./useCallStore";
import { toast } from "sonner";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  onlineUsers: [],
  connectSocket: () => {
    const accessToken = useAuthStore.getState().accessToken;
    const existingSocket = get().socket;

    if (existingSocket) return; // tránh tạo nhiều socket

    const socket: Socket = io(baseURL, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });

    set({ socket });

    socket.on("connect", () => {
      console.log("Đã kết nối với socket");
    });


    // online users
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: userIds });
    });

    // new message
    socket.on("new-message", ({ message, conversation, unreadCounts }) => {
      useChatStore.getState().addMessage(message);

      const lastMessage = {
        _id: conversation.lastMessage._id,
        content: conversation.lastMessage.content,
        createdAt: conversation.lastMessage.createdAt,
        sender: {
          _id: conversation.lastMessage.senderId,
          displayName: "",
          avatarUrl: null,
        },
      };

      const updatedConversation = {
        ...conversation,
        lastMessage,
        unreadCounts,
      };

      if (useChatStore.getState().activeConversationId === message.conversationId) {
        useChatStore.getState().markAsSeen();
      }

      useChatStore.getState().updateConversation(updatedConversation);
    });

    // read message
    socket.on("read-message", ({ conversation, lastMessage }) => {
      const updated = {
        _id: conversation._id,
        lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCounts: conversation.unreadCounts,
        seenBy: conversation.seenBy,
      };

      useChatStore.getState().updateConversation(updated);
    });

    // new group chat
    socket.on("new-group", (conversation) => {
      //addConvo la update store rồi từ update ui
      useChatStore.getState().addConvo(conversation);
      socket.emit("join-conversation", conversation._id);
    });

    // ===== VIDEO CALL EVENTS =====

    // Receiver nhận cuộc gọi đến
    socket.on("video-call:incoming", (data: any) => {
      console.log("📱 Nhận cuộc gọi đến:", data);
      const { offer, callId, callerId, callerInfo } = data;
      
      useCallStore.getState().handleIncomingCall({
        offer,
        callId,
        callerId,
        callerInfo,
      });
    });

    // Caller nhận khi receiver CHẤP NHẬN
    socket.on("video-call:accepted", (data: any) => {
      console.log("✅ Receiver đã chấp nhận cuộc gọi:", data);
      const { answer } = data;
      
      useCallStore.getState().handleCallAccepted(answer);
    });
    socket.on("connect", () => {
  console.log("Socket connected:", socket.id);
});

// Debug tất cả event nhận được
socket.onAny((event, ...args) => {
  console.log("SOCKET EVENT:", event, args);
});
    // Caller nhận khi receiver TỪ CHỐI
    socket.on("video-call:reject", (data: any) => {
      console.log("❌ Receiver từ chối cuộc gọi:", data);
      const { reason } = data;
      
      useCallStore.getState().resetCallState();
      toast.error(`Người dùng từ chối cuộc gọi${reason ? ': ' + reason : ''}`);
    });

    // Cả hai bên nhận khi cuộc gọi kết thúc
    socket.on("video-call:end", (data: any) => {
      console.log("🔴 Cuộc gọi kết thúc:", data);
      const { callId } = data;
      
      const { callState } = useCallStore.getState();
      if (callState.callId === callId) {
        useCallStore.getState().resetCallState();
      }
    });

    // ICE Candidate exchange
    socket.on("video-call:ice-candidate", (data: any) => {
      console.log("🧊 Nhận ICE candidate");
      const { candidate } = data;
      const { peerConnection } = useCallStore.getState();
      
      if (peerConnection && candidate) {
        try {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Lỗi thêm ICE candidate:", error);
        }
      }
    });
  },
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
