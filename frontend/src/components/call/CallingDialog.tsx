import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { PhoneOff } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";

/**
 * CallingDialog hiển thị cho NGƯỜI GỌI
 * - Avatar, tên người nhận
 * - Text "Đang gọi..."
 * - Animation rung/pulse
 * - Nút hủy cuộc gọi
 */
const CallingDialog = () => {
  const { callState, endCall, resetCallState } = useCallStore();
  const { socket } = useSocketStore();
  
  // Hiển thị khi status là "calling"
  const isCalling = callState.status === "calling";

  const handleEndCall = async () => {
    try {
      if (socket && callState.callId) {
        socket.emit("video-call:end", {
          callId: callState.callId,
          to: callState.receiverId,
        });
      }
      
      await endCall();
      resetCallState();
    } catch (error) {
      console.error("Lỗi khi kết thúc cuộc gọi:", error);
      resetCallState();
    }
  };

  return (
    <Dialog open={isCalling}>
      <DialogContent className="sm:max-w-md p-0 bg-linear-to-br from-slate-900 to-slate-800 border-0 rounded-3xl overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 bg-linear-to-b from-blue-500/10 to-purple-500/10 animate-pulse" />

        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-8 space-y-8">
          {/* Avatar với animation */}
          <div className="relative">
            {/* Outer pulse rings */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse opacity-60" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-40" 
                 style={{ animationDuration: '1.5s' }} />

            {/* Avatar */}
            <UserAvatar
              type="profile"
              name={callState.receiverInfo?.displayName || "Người dùng"}
              avatarUrl={callState.receiverInfo?.avatarUrl}
              className="ring-4 ring-blue-500 shadow-2xl w-24 h-24"
            />
          </div>

          {/* Receiver info */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white">
              {callState.receiverInfo?.displayName}
            </h2>
            <p className="text-blue-200 text-base font-medium animate-pulse">
              Đang gọi...
            </p>
          </div>

          {/* End call button */}
          <Button
            onClick={handleEndCall}
            variant="destructive"
            size="lg"
            className="rounded-full w-20 h-20 p-0 flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-lg"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Sub text */}
          <p className="text-xs text-gray-400 mt-4">
            Nhấn nút để hủy cuộc gọi
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallingDialog;
