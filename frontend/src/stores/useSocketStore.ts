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
      console.log("Socket connected:", socket.id);
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

    // Caller nhận khi receiver TỪ CHỐI
    socket.on("video-call:rejected", (data: any) => {
      console.log("❌ Receiver từ chối cuộc gọi:", data);
      const { reason } = data;
      
      useCallStore.getState().resetCallState();
      toast.error(`Người dùng từ chối cuộc gọi${reason ? ': ' + reason : ''}`);
    });

    // Cả hai bên nhận khi cuộc gọi kết thúc
    socket.on("video-call:ended", (data: any) => { 
      const { callId } = data;
      
      const { callState } = useCallStore.getState();
      if (callState.callId === callId) {
        useCallStore.getState().resetCallState();
      }
    });

    // ICE Candidate exchange
    socket.on("video-call:ice-candidate", (data: any) => {
      console.log("[WEBRTC] Received ICE candidate from network");
      const { candidate } = data;
      if (candidate) {
        // Delegate to call store which will add or queue candidate
        useCallStore.getState().addRemoteIceCandidate(candidate).catch((err) => {
          console.error("[WEBRTC] Error processing ICE candidate:", err);
        });
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
