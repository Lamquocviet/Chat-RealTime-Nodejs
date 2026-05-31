import { useEffect, useState } from "react";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallDialog from "@/components/call/IncomingCallDialog";
import CallingDialog from "@/components/call/CallingDialog";
import VideoCallWindow from "@/components/call/VideoCallWindow";
import { useCallStore } from "@/stores/useCallStore";

const ChatAppPage = () => {
  const { callState } = useCallStore();
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

  // Khi call status chuyển sang "connected", mở VideoCallWindow
  useEffect(() => {
    if (callState.status === "connected") {
      setIsVideoCallOpen(true);
    } else if (callState.status === "idle") {
      setIsVideoCallOpen(false);
    }
  }, [callState.status]);

  return (
    <SidebarProvider>
      <AppSidebar />

      <div className="flex h-screen w-full p-2">
        <ChatWindowLayout />
      </div>

      {/* Calling dialog - hiển thị khi người gọi đang đợi */}
      <CallingDialog />

      {/* Incoming call dialog - hiển thị khi người nhận nhận cuộc gọi */}
      <IncomingCallDialog />

      {/* Video call window - hiển thị khi cuộc gọi connected */}
      <VideoCallWindow
        isOpen={isVideoCallOpen}
        onClose={() => {
          setIsVideoCallOpen(false);
          useCallStore.getState().resetCallState();
        }}
      />
    </SidebarProvider>
  );
};

export default ChatAppPage;

