import { useEffect, useRef, useState } from "react";
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

  // Set local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Set remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // Attempt to play to satisfy autoplay policies after user interaction
      remoteVideoRef.current
        .play()
        .then(() => console.log("Remote video playing"))
        .catch((err) => console.warn("Remote video play suppressed:", err));
      console.log("Remote stream tracks:", remoteStream.getTracks().map(t=>({kind:t.kind,enabled:t.enabled,id:t.id}))); 
    }
  }, [remoteStream]);

  // Update call duration every second
  useEffect(() => {
    if (callState.status !== "connected") return;

    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [callState.status]);

  // Listen for call ended
  useEffect(() => {
    if (!socket) return;

    socket.on("video-call:ended", () => {
      handleEndCall();
    });

    socket.on("video-call:rejected", () => {
      handleEndCall();
    });

    return () => {
      socket.off("video-call:ended");
      socket.off("video-call:rejected");
    };
  }, [socket]);

  const handleEndCall = async () => {
    await endCall();
    onClose();
  };

  if (!isOpen || callState.status !== "connected") {
    return null;
  }

  const otherUserName = callState.callerId === user?._id
    ? callState.receiverInfo?.displayName
    : callState.callerInfo?.displayName;

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Main video (remote) */}
      <div className="flex-1 relative bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />

        {/* Local video (picture-in-picture) */}
        <div className="absolute bottom-6 right-6 w-32 h-32 bg-gray-900 rounded-lg overflow-hidden border-2 border-white shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
        </div>

        {/* Call info */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
          <h2 className="text-white text-lg font-semibold">
            {otherUserName}
          </h2>
          <p className="text-gray-300 text-center text-sm">
            {formatDuration(duration)}
          </p>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4">
          {/* Mute audio button */}
          <Button
            size="icon"
            onClick={() => toggleAudio(!callState.isAudioOn)}
            className={`rounded-full w-14 h-14 ${
              callState.isAudioOn
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {callState.isAudioOn ? (
              <Mic className="w-6 h-6" />
            ) : (
              <MicOff className="w-6 h-6" />
            )}
          </Button>

          {/* Toggle video button */}
          <Button
            size="icon"
            onClick={() => toggleVideo(!callState.isVideoOn)}
            className={`rounded-full w-14 h-14 ${
              callState.isVideoOn
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {callState.isVideoOn ? (
              <Video className="w-6 h-6" />
            ) : (
              <VideoOff className="w-6 h-6" />
            )}
          </Button>

          {/* End call button */}
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
