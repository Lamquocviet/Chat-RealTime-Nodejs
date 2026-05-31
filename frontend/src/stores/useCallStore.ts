import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";
import { callService } from "@/services/callService";
import { toast } from "sonner";
import type { CallState } from "@/types/chat";

interface IUseCallStore {
  // State
  callState: CallState;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  callDuration: number;

  // Actions
  initializeCall: (receiverId: string, receiverInfo: any, callType?: "audio" | "video") => Promise<void>;
  handleIncomingCall: (data: any) => void;
   handleCallAccepted: (
    answer: RTCSessionDescriptionInit
  ) => Promise<void>;
  acceptCall: (offer: RTCSessionDescriptionInit) => Promise<void>;
  rejectCall: (reason?: string) => Promise<void>;
  toggleAudio: (enabled: boolean) => void;
  toggleVideo: (enabled: boolean) => void;
  endCall: () => Promise<void>;
  resetCallState: () => void;
  setLocalStream: (stream: MediaStream | null) => void;
  setRemoteStream: (stream: MediaStream | null) => void;
  setPeerConnection: (pc: RTCPeerConnection | null) => void;
  addRemoteTrack: (event: RTCTrackEvent) => void;
}

export const useCallStore = create<IUseCallStore>((set, get) => ({
  callState: {
    callId: null,
    status: "idle",
    callerId: null,
    receiverId: null,
    isAudioOn: true,
    isVideoOn: true,
    duration: 0,
  },
  peerConnection: null,
  localStream: null,
  remoteStream: null,
  callDuration: 0,

  initializeCall: async (receiverId: string, receiverInfo: any, callType = "video") => {
    try {
      const { user } = useAuthStore.getState();
      const { socket } = useSocketStore.getState();

      if (!user) {
        throw new Error("Bạn chưa đăng nhập");
      }

      if (!socket) {
        throw new Error("Socket chưa kết nối. Vui lòng tải lại trang");
      }

      console.log("🔵 Bước 1: Gọi API để tạo Call document");

      // STEP 1: Gọi REST API để tạo Call document
      const callResponse = await callService.initiateCall(receiverId);
      const callId = callResponse.call._id;

      console.log("✅ Bước 1 OK - CallId:", callId);
      console.log("🔵 Bước 2: Lấy camera/microphone");

      // STEP 2: Get user media - audio always, video only if video call
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video" ? { width: 1280, height: 720 } : false,
      });

      set({ localStream: stream });
      console.log("✅ Bước 2 OK - Stream:", stream.id);
      console.log("🔵 Bước 3: Tạo RTCPeerConnection");

      // STEP 3: Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          console.log("📤 Gửi ICE candidate");
          socket.emit("video-call:ice-candidate", {
            to: receiverId,
            candidate: event.candidate.toJSON(),
            callId,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          console.log("📹 Nhận remote stream");
          set({ remoteStream: event.streams[0] });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("🔌 Connection state:", pc.connectionState);
      };

      pc.oniceconnectionstatechange = () => {
        console.log("🧊 ICE state:", pc.iceConnectionState);
      };

      set({ peerConnection: pc });
      console.log("✅ Bước 3 OK - PeerConnection:", pc.connectionState);
      console.log("🔵 Bước 4: Tạo Offer");

      // STEP 4: Create and send offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });

      await pc.setLocalDescription(offer);
      console.log("✅ Bước 4 OK - Offer tạo và set");

      // Update state BEFORE emitting
      set((state) => ({
        callState: {
          ...state.callState,
          callId,
          status: "calling",
          callerId: user._id,
          receiverId,
          callerInfo: {
            _id: user._id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          receiverInfo,
        },
      }));

      console.log("🔵 Bước 5: Gửi socket event video-call:initiate");

      // STEP 5: Emit initiate event
      socket.emit("video-call:initiate", {
        receiverId,
        offer,
        callId,
        callType,
        callerId: user._id,
        callerInfo: {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });

      console.log("✅ Bước 5 OK - Socket event đã gửi");
      toast.success(`Đang gọi ${callType === "audio" ? "thoại" : "video"} đến ` + receiverInfo.displayName);
    } catch (error) {
      console.error("❌ Lỗi khi khởi tạo cuộc gọi:", error);
      toast.error(
        error instanceof Error ? error.message : "Lỗi khi bắt đầu cuộc gọi"
      );
      throw error;
    }
  },

  handleIncomingCall: (data: any) => {
    const { callerId, callerInfo, callId, offer } = data;

    set((state) => ({
      callState: {
        ...state.callState,
        status: "ringing",
        callId,
        callerId,
        callerInfo,
        offer, // Lưu offer để receiver dùng
      },
    }));
  },
  handleCallAccepted: async (
  answer: RTCSessionDescriptionInit
) => {
  try {
    const { peerConnection } = get();

    if (!peerConnection) {
      console.error("PeerConnection not found");
      return;
    }

    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(answer)
    );

    set((state) => ({
      callState: {
        ...state.callState,
        status: "connected",
      },
    }));

    console.log("Call connected");
  } catch (error) {
    console.error(
      "Lỗi khi xử lý answer:",
      error
    );
  }
},

  acceptCall: async (offer: RTCSessionDescriptionInit) => {
    try {
      const { socket } = useSocketStore.getState();
      const { callState, localStream } = get();

      if (!callState.callerId) throw new Error("Call ID not found");
      if (!callState.callId) throw new Error("Call document ID not found");

      console.log("🔵 Chấp nhận cuộc gọi - CallId:", callState.callId);

      // Get user media if not already available
      let stream = localStream;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: 1280, height: 720 },
        });
        set({ localStream: stream });
      }

      // Create peer connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
        ],
      });

      // Add local stream to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit("video-call:ice-candidate", {
            to: callState.callerId,
            candidate: event.candidate.toJSON(),
            callId: callState.callId,
          });
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          set({ remoteStream: event.streams[0] });
        }
      };

      // Set remote description (offer)
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Create and send answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (!socket) {
        throw new Error("Socket không kết nối");
      }

      // Emit accept event
      socket.emit("video-call:accept", {
        callerId: callState.callerId,
        answer,
        callId: callState.callId,
      });

      set((state) => ({
        peerConnection: pc,
        callState: {
          ...state.callState,
          status: "connected",
        },
      }));

      console.log("✅ Chấp nhận cuộc gọi thành công");
    } catch (error) {
      console.error("❌ Lỗi khi chấp nhận cuộc gọi:", error);
      throw error;
    }
  },

  rejectCall: async (reason = "Người dùng từ chối") => {
    try {
      const { socket } = useSocketStore.getState();
      const { callState } = get();

      if (!callState.callId) {
        console.warn("Call ID not found for rejection");
        get().resetCallState();
        return;
      }

      console.log("🔵 Từ chối cuộc gọi:", callState.callId);

      // Gọi API
      try {
        await callService.rejectCall(callState.callId);
        console.log("✅ API từ chối cuộc gọi thành công");
      } catch (apiError) {
        console.error("⚠️ Lỗi gọi API từ chối:", apiError);
        // Tiếp tục emit socket event dù API lỗi
      }

      // Emit socket event
      if (socket && callState.callerId) {
        socket.emit("video-call:reject", {
          callerId: callState.callerId,
          reason,
          callId: callState.callId,
        });
      }

      get().resetCallState();
    } catch (error) {
      console.error("❌ Lỗi khi từ chối cuộc gọi:", error);
      get().resetCallState();
    }
  },

  toggleAudio: (enabled: boolean) => {
    const { localStream } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }

    set((state) => ({
      callState: {
        ...state.callState,
        isAudioOn: enabled,
      },
    }));
  },

  toggleVideo: (enabled: boolean) => {
    const { localStream } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
      });
    }

    set((state) => ({
      callState: {
        ...state.callState,
        isVideoOn: enabled,
      },
    }));
  },

  endCall: async () => {
    try {
      const { socket } = useSocketStore.getState();
      const { callState, peerConnection, localStream, remoteStream } = get();

      console.log("🔵 Kết thúc cuộc gọi:", callState.callId);

      // Call API to end call
      if (callState.callId) {
        try {
          await callService.endCall(callState.callId);
          console.log("✅ API kết thúc cuộc gọi thành công");
        } catch (apiError) {
          console.error("⚠️ Lỗi gọi API kết thúc:", apiError);
        }
      }

      // Emit end call event
      if (socket && callState.callId) {
        const to =
          callState.callerId === useAuthStore.getState().user?._id
            ? callState.receiverId
            : callState.callerId;

        socket.emit("video-call:end", {
          to,
          callId: callState.callId,
        });
      }

      // Close peer connection
      if (peerConnection) {
        peerConnection.close();
      }

      // Stop local stream
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      // Stop remote stream
      if (remoteStream) {
        remoteStream.getTracks().forEach((track) => {
          track.stop();
        });
      }

      get().resetCallState();
      console.log("✅ Kết thúc cuộc gọi hoàn tất");
    } catch (error) {
      console.error("❌ Lỗi khi kết thúc cuộc gọi:", error);
      get().resetCallState();
    }
  },

  resetCallState: () => {
    set({
      callState: {
        callId: null,
        status: "idle",
        callerId: null,
        receiverId: null,
        offer: undefined,
        isAudioOn: true,
        isVideoOn: true,
        duration: 0,
      },
      peerConnection: null,
      localStream: null,
      remoteStream: null,
      callDuration: 0,
    });
  },

  setLocalStream: (stream: MediaStream | null) => {
    set({ localStream: stream });
  },

  setRemoteStream: (stream: MediaStream | null) => {
    set({ remoteStream: stream });
  },

  setPeerConnection: (pc: RTCPeerConnection | null) => {
    set({ peerConnection: pc });
  },

  addRemoteTrack: (event: RTCTrackEvent) => {
    if (event.streams && event.streams[0]) {
      set({ remoteStream: event.streams[0] });
    }
  },
}));
