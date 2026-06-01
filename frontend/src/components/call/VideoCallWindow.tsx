import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
} from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { formatDuration } from "@/lib/utils";

interface VideoCallWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

const VideoCallWindow = ({ isOpen, onClose }: VideoCallWindowProps) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [duration, setDuration] = useState(0);

  const {
    callState,
    localStream,
    remoteStream,
    toggleAudio,
    toggleVideo,
    endCall,
  } = useCallStore();

  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  const isConnected = callState.status === "connected";

  // ── Local stream ──────────────────────────────────────────────
  useEffect(() => {
    const el = localVideoRef.current;
    if (!el || !localStream) return;

    el.srcObject = localStream;
    el.muted = true;
    el.play().catch(() => {});
  }, [localStream, isOpen]);

  // ── Remote stream (callback ref để không bị race condition) ───
  const attachRemoteStream = useCallback(
    (el: HTMLVideoElement | null) => {
      (remoteVideoRef as any).current = el;
      if (!el || !remoteStream) return;

      if (el.srcObject !== remoteStream) {
        el.srcObject = remoteStream;
      }

      // Mute trước để vượt autoplay policy, sau đó unmute
      el.muted = true;
      el.play()
        .then(() => {
          el.muted = false;
        })
        .catch((err) => {
          console.warn("[REMOTE_VIDEO] autoplay blocked:", err);
        });
    },
    [remoteStream]
  );

  // Khi remoteStream thay đổi sau khi ref đã mount → gán lại
  useEffect(() => {
    const el = remoteVideoRef.current;
    if (!el || !remoteStream) return;

    if (el.srcObject !== remoteStream) {
      el.srcObject = remoteStream;
    }

    el.muted = true;
    el.play()
      .then(() => {
        el.muted = false;
      })
      .catch((err) => {
        console.warn("[REMOTE_VIDEO] play after stream update blocked:", err);
      });
  }, [remoteStream]);

  // ── Duration counter ──────────────────────────────────────────
  useEffect(() => {
    if (!isConnected) {
      setDuration(0);
      return;
    }
    const interval = setInterval(() => setDuration((p) => p + 1), 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // ── Socket: remote ended / rejected ──────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleEnded = () => handleEndCall();
    const handleRejected = () => handleEndCall();

    socket.on("video-call:ended", handleEnded);
    socket.on("video-call:rejected", handleRejected);

    return () => {
      socket.off("video-call:ended", handleEnded);
      socket.off("video-call:rejected", handleRejected);
    };
  }, [socket]);

  const handleEndCall = async () => {
    try {
      await endCall();
    } catch (e) {
      console.error("Error ending call:", e);
    }
    onClose();
  };

  // Render hidden khi chưa open/connected để ref luôn tồn tại trong DOM
  if (!isOpen) return null;

  const otherUserName =
    callState.callerId === user?._id
      ? callState.receiverInfo?.displayName
      : callState.callerInfo?.displayName;

  return (
    <div className={`fixed inset-0 bg-black z-50 flex flex-col ${!isConnected ? "hidden" : ""}`}>
      <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">

        {/* Remote video — luôn render để ref không bị null */}
        <video
          ref={attachRemoteStream}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!remoteStream ? "hidden" : ""}`}
        />

        {/* Placeholder khi chưa có remote stream */}
        {!remoteStream && (
          <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center animate-pulse">
              <span className="text-2xl">📹</span>
            </div>
            <p className="text-gray-400 text-center">
              Đang kết nối video từ {otherUserName}...
            </p>
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-6 right-6 w-32 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          {localStream ? (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-800">
              <span className="text-gray-500 text-xs text-center px-1">Không có camera</span>
            </div>
          )}
        </div>

        {/* Call info */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 rounded-lg px-4 py-2">
          <h2 className="text-white text-lg font-semibold text-center">
            {otherUserName || "Người dùng"}
          </h2>
          <p className="text-gray-300 text-center text-sm">{formatDuration(duration)}</p>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
          <Button
            size="icon"
            onClick={() => toggleAudio(!callState.isAudioOn)}
            className={`rounded-full w-14 h-14 ${
              callState.isAudioOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {callState.isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          <Button
            size="icon"
            onClick={() => toggleVideo(!callState.isVideoOn)}
            className={`rounded-full w-14 h-14 ${
              callState.isVideoOn ? "bg-gray-700 hover:bg-gray-600" : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {callState.isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          <Button
            size="icon"
            onClick={handleEndCall}
            className="rounded-full w-14 h-14 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoCallWindow;