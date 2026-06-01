import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useSocketStore } from "./useSocketStore";
import { callService } from "@/services/callService";
import { toast } from "sonner";
import type { CallState } from "@/types/chat";

interface IUseCallStore {
  callState: CallState;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  pendingIceCandidates: RTCIceCandidateInit[];
  callDuration: number;

  initializeCall: (receiverId: string, receiverInfo: any, callType?: "audio" | "video") => Promise<void>;
  handleIncomingCall: (data: any) => void;
  handleCallAccepted: (answer: RTCSessionDescriptionInit) => Promise<void>;
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
  addRemoteIceCandidate: (candidate: RTCIceCandidateInit | null) => Promise<void>;
}

// ── Helper: lấy user media với fallback audio-only ──────────────
const getMediaStream = async (
  callType: "audio" | "video",
  onVideoFallback?: () => void
): Promise<MediaStream> => {
  if (callType === "video") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      });
    } catch (err) {
      console.warn("getUserMedia video failed:", (err as any).name, "— falling back to audio only");
      onVideoFallback?.();
    }
  }

  // audio-only (hoặc fallback từ video)
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  } catch (err) {
    console.error("getUserMedia audio failed:", (err as any).name);
    throw new Error("Không thể truy cập microphone. Kiểm tra lại thiết bị và quyền truy cập.");
  }
};

// ── Helper: tạo RTCPeerConnection ───────────────────────────────
const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
];

const buildPeerConnection = (
  onIceCandidate: (c: RTCIceCandidate) => void,
  onTrack: (e: RTCTrackEvent) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  pc.onicecandidate = (e) => {
    if (e.candidate) onIceCandidate(e.candidate);
  };
  pc.ontrack = onTrack;
  pc.onconnectionstatechange = () =>
    console.log("[WEBRTC] connectionState:", pc.connectionState);
  pc.oniceconnectionstatechange = () =>
    console.log("[WEBRTC] iceConnectionState:", pc.iceConnectionState);

  return pc;
};

// ── Helper: xử lý ontrack event ────────────────────────────────
const resolveRemoteStream = (
  event: RTCTrackEvent,
  existing: MediaStream | null
): MediaStream => {
  if (event.streams?.[0]) return event.streams[0];

  if (existing) {
    try {
      existing.addTrack(event.track);
    } catch (e) {
      console.warn("[WEBRTC] addTrack to existing stream failed:", e);
    }
    return existing;
  }

  return new MediaStream([event.track]);
};

// ── Helper: flush pending ICE candidates ───────────────────────
const flushPendingCandidates = async (
  pc: RTCPeerConnection,
  pending: RTCIceCandidateInit[]
): Promise<void> => {
  if (!pending.length) return;
  console.log("[WEBRTC] Flushing pending ICE candidates:", pending.length);
  for (const c of pending) {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(c));
    } catch (e) {
      console.warn("[WEBRTC] Could not add pending ICE candidate:", e);
    }
  }
};

// ───────────────────────────────────────────────────────────────

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
  pendingIceCandidates: [],
  callDuration: 0,

  // ── initializeCall (Caller) ───────────────────────────────────
  initializeCall: async (receiverId, receiverInfo, callType = "video") => {
    const { user } = useAuthStore.getState();
    const { socket } = useSocketStore.getState();

    if (!user) { toast.error("Bạn chưa đăng nhập"); return; }
    if (!socket) { toast.error("Socket chưa kết nối. Vui lòng tải lại trang"); return; }

    try {
      // 1. Tạo Call document
      const { call } = await callService.initiateCall(receiverId);
      const callId = call._id;

      // 2. Lấy media
      let isVideoOn = callType === "video";
      const stream = await getMediaStream(callType, () => {
        isVideoOn = false;
        toast("Không thể truy cập camera, chuyển sang cuộc gọi chỉ âm thanh");
      });
      set({ localStream: stream });

      // 3. Tạo PeerConnection
      const pc = buildPeerConnection(
        (candidate) => {
          socket.emit("video-call:ice-candidate", {
            to: receiverId,
            candidate: candidate.toJSON(),
            callId,
          });
        },
        (event) => {
          const remote = resolveRemoteStream(event, get().remoteStream);
          set({ remoteStream: remote });
        }
      );

      // 4. Add tracks
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 5. Set PC vào store & flush pending candidates
      set({ peerConnection: pc });
      const pending = get().pendingIceCandidates;
      await flushPendingCandidates(pc, pending);
      if (pending.length) set({ pendingIceCandidates: [] });

      // 6. Tạo offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: callType === "video",
      });
      await pc.setLocalDescription(offer);

      // 7. Update state
      set((s) => ({
        callState: {
          ...s.callState,
          callId,
          status: "calling",
          callerId: user._id,
          receiverId,
          isVideoOn,
          callerInfo: {
            _id: user._id,
            displayName: user.displayName,
            avatarUrl: user.avatarUrl,
          },
          receiverInfo,
        },
      }));

      // 8. Emit socket
      socket.emit("video-call:initiate", {
        receiverId,
        offer: pc.localDescription!.toJSON(),
        callId,
        callType,
        callerId: user._id,
        callerInfo: {
          _id: user._id,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });

      toast.success(`Đang gọi ${callType === "audio" ? "thoại" : "video"} đến ${receiverInfo.displayName}`);
    } catch (error) {
      console.error("❌ initializeCall:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi khi bắt đầu cuộc gọi");
      get().resetCallState();
    }
  },

  // ── handleIncomingCall (Receiver nhận signal) ─────────────────
  handleIncomingCall: (data) => {
    const { callerId, callerInfo, callId, offer } = data;
    set((s) => ({
      callState: {
        ...s.callState,
        status: "ringing",
        callId,
        callerId,
        callerInfo,
        offer,
      },
    }));
  },

  // ── handleCallAccepted (Caller nhận answer) ───────────────────
  handleCallAccepted: async (answer) => {
    const { peerConnection } = get();

    if (!peerConnection) {
      toast.error("Lỗi: Kết nối peer bị mất");
      get().resetCallState();
      return;
    }

    try {
      await peerConnection.setRemoteDescription(answer);

      const pending = get().pendingIceCandidates;
      await flushPendingCandidates(peerConnection, pending);
      if (pending.length) set({ pendingIceCandidates: [] });

      set((s) => ({ callState: { ...s.callState, status: "connected" } }));
    } catch (error) {
      console.error("❌ handleCallAccepted:", error);
      toast.error("Lỗi khi kết nối cuộc gọi");
      get().resetCallState();
    }
  },

  // ── acceptCall (Receiver chấp nhận) ──────────────────────────
  acceptCall: async (offer) => {
    if (!offer?.sdp || !offer?.type) {
      toast.error("Lỗi: Định dạng offer không hợp lệ");
      get().resetCallState();
      return;
    }

    const { socket } = useSocketStore.getState();
    const { callState } = get();

    if (!callState.callerId) { toast.error("Không tìm thấy caller"); get().resetCallState(); return; }
    if (!callState.callId) { toast.error("Không tìm thấy call ID"); get().resetCallState(); return; }
    if (!socket) { toast.error("Socket chưa kết nối"); get().resetCallState(); return; }

    try {
      // 1. Lấy media
      let isVideoOn = true;
      const stream = await getMediaStream("video", () => {
        isVideoOn = false;
        toast("Không thể truy cập camera, chấp nhận cuộc gọi chỉ âm thanh");
      });
      set({ localStream: stream });

      // 2. Tạo PeerConnection
      const pc = buildPeerConnection(
        (candidate) => {
          socket.emit("video-call:ice-candidate", {
            to: callState.callerId,
            candidate: candidate.toJSON(),
            callId: callState.callId,
          });
        },
        (event) => {
          const remote = resolveRemoteStream(event, get().remoteStream);
          set({ remoteStream: remote });
        }
      );

      // 3. Add local tracks
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 4. Set PC vào store & flush pending candidates
      set({ peerConnection: pc, callState: { ...get().callState, isVideoOn } });
      const pending = get().pendingIceCandidates;
      await flushPendingCandidates(pc, pending);
      if (pending.length) set({ pendingIceCandidates: [] });

      // 5. Set remote description (offer) → tạo answer
      await pc.setRemoteDescription(offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      // 6. Emit answer
      socket.emit("video-call:accept", {
        callerId: callState.callerId,
        answer: pc.localDescription!.toJSON(),
        callId: callState.callId,
      });

      // 7. Update state
      set((s) => ({ callState: { ...s.callState, status: "connected" } }));
    } catch (error) {
      console.error("❌ acceptCall:", error);
      toast.error(error instanceof Error ? error.message : "Lỗi khi chấp nhận cuộc gọi");
      get().resetCallState();
    }
  },

  // ── rejectCall ────────────────────────────────────────────────
  rejectCall: async (reason = "Người dùng từ chối") => {
    const { socket } = useSocketStore.getState();
    const { callState } = get();

    if (callState.callId) {
      try { await callService.rejectCall(callState.callId); } catch (e) {
        console.warn("API rejectCall failed:", e);
      }
    }

    if (socket && callState.callerId) {
      socket.emit("video-call:reject", {
        callerId: callState.callerId,
        reason,
        callId: callState.callId,
      });
    }

    get().resetCallState();
  },

  // ── toggleAudio / toggleVideo ─────────────────────────────────
  toggleAudio: (enabled) => {
    get().localStream?.getAudioTracks().forEach((t) => { t.enabled = enabled; });
    set((s) => ({ callState: { ...s.callState, isAudioOn: enabled } }));
  },

  toggleVideo: (enabled) => {
    get().localStream?.getVideoTracks().forEach((t) => { t.enabled = enabled; });
    set((s) => ({ callState: { ...s.callState, isVideoOn: enabled } }));
  },

  // ── endCall ───────────────────────────────────────────────────
  endCall: async () => {
    const { socket } = useSocketStore.getState();
    const { callState, peerConnection, localStream, remoteStream } = get();

    if (callState.callId) {
      try { await callService.endCall(callState.callId); } catch (e) {
        console.warn("API endCall failed:", e);
      }
    }

    if (socket && callState.callId) {
      const to = callState.callerId === useAuthStore.getState().user?._id
        ? callState.receiverId
        : callState.callerId;

      socket.emit("video-call:end", { to, callId: callState.callId });
    }

    peerConnection?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

    get().resetCallState();
  },

  // ── resetCallState ────────────────────────────────────────────
  resetCallState: () => {
    // Stop mọi stream/pc trước khi reset
    const { peerConnection, localStream, remoteStream } = get();
    peerConnection?.close();
    localStream?.getTracks().forEach((t) => t.stop());
    remoteStream?.getTracks().forEach((t) => t.stop());

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
      pendingIceCandidates: [],
    });
  },

  // ── Misc setters ──────────────────────────────────────────────
  setLocalStream: (stream) => set({ localStream: stream }),
  setRemoteStream: (stream) => set({ remoteStream: stream }),
  setPeerConnection: (pc) => set({ peerConnection: pc }),

  addRemoteTrack: (event) => {
    if (event.streams?.[0]) set({ remoteStream: event.streams[0] });
  },

  // ── addRemoteIceCandidate ─────────────────────────────────────
  addRemoteIceCandidate: async (candidate) => {
    if (!candidate) return;
    const { peerConnection } = get();

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[WEBRTC] addIceCandidate failed:", e);
      }
    } else {
      // Queue lại để flush sau khi PC sẵn sàng
      set((s) => ({
        pendingIceCandidates: [...s.pendingIceCandidates, candidate],
      }));
    }
  },
}));