import { useEffect, useState } from "react";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallDialog from "@/components/call/IncomingCallDialog";
import VideoCallWindow from "@/components/call/VideoCallWindow";
import { useSocketStore } from "@/stores/useSocketStore";
import { useCallStore } from "@/stores/useCallStore";

const ChatAppPage = () => {
  const { socket } = useSocketStore();
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  // Setup Socket.IO listeners for video call
  useEffect(() => {
    if (!socket) {
      console.log("Socket not connected yet");
      return;
    }

    console.log("Setting up video call listeners...");

    // Handle accepted call
    const handleCallAccepted = async (data: any) => {
      try {
        console.log("Call accepted, data:", data);
        const { answer } = data;
        const { peerConnection } = useCallStore.getState();

        if (peerConnection && answer) {
          await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
          );
          // Update call state to connected
          useCallStore.setState((state) => ({
            callState: {
              ...state.callState,
              status: "connected",
            },
          }));
          setIsVideoCallOpen(true);
        }
      } catch (error) {
        console.error("Lỗi khi xử lý call accepted:", error);
      }
    };
    socket.on("video-call:accepted", handleCallAccepted);

    // Handle ICE candidate
    const handleIceCandidate = async (data: any) => {
      try {
        const { candidate } = data;
        const { peerConnection } = useCallStore.getState();

        if (peerConnection && candidate) {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (error) {
        console.error("Lỗi khi add ICE candidate:", error);
      }
    };
    socket.on("video-call:ice-candidate", handleIceCandidate);

    // Handle call ended
    const handleCallEnded = () => {
      console.log("Call ended");
      setIsVideoCallOpen(false);
      useCallStore.getState().resetCallState();
    };
    socket.on("video-call:ended", handleCallEnded);

    // Handle call rejected
    const handleCallRejected = (data: any) => {
      const { reason } = data;
      console.log("Cuộc gọi bị từ chối:", reason);
      useCallStore.getState().resetCallState();
    };
    socket.on("video-call:rejected", handleCallRejected);

    // Handle call error
    const handleCallError = (data: any) => {
      console.error("Call error:", data.message);
      useCallStore.getState().resetCallState();
    };
    socket.on("video-call:error", handleCallError);

    return () => {
      socket.off("video-call:accepted", handleCallAccepted);
      socket.off("video-call:ice-candidate", handleIceCandidate);
      socket.off("video-call:ended", handleCallEnded);
      socket.off("video-call:rejected", handleCallRejected);
      socket.off("video-call:error", handleCallError);
    };
  }, [socket]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>

      {/* Incoming call popup */}
      <IncomingCallDialog />

      {/* Video call window */}
      <VideoCallWindow
        isOpen={isVideoCallOpen}
        onClose={() => setIsVideoCallOpen(false)}
      />
    </SidebarProvider>
  );
};

export default ChatAppPage;

