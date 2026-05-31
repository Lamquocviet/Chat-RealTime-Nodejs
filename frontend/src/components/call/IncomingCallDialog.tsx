import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { Phone, PhoneOff } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { toast } from "sonner";

/**
 * IncomingCallDialog hiển thị cho NGƯỜI NHẬN
 * - Avatar, tên người gọi
 * - Text "Đang gọi đến..."
 * - Animation rung/pulse
 * - Nút chấp nhận (Nghe máy)
 * - Nút từ chối (PhoneOff)
 */
const IncomingCallDialog = () => {
  const { callState, acceptCall, rejectCall } = useCallStore();
  const isRinging = callState.status === "ringing";

  const handleAccept = async () => {
    try {
      // Offer được lưu trong callState từ socket listener trong useSocketStore
      await acceptCall(callState.offer as RTCSessionDescriptionInit);
      toast.success("Cuộc gọi được chấp nhận");
    } catch (error) {
      console.error("Lỗi khi chấp nhận cuộc gọi:", error);
      toast.error("Lỗi khi chấp nhận cuộc gọi");
    }
  };

  const handleReject = async () => {
    try {
      await rejectCall();
    } catch (error) {
      console.error("Lỗi khi từ chối cuộc gọi:", error);
      toast.error("Lỗi khi từ chối cuộc gọi");
    }
  };

  return (
    <Dialog open={isRinging}>
      <DialogContent className="sm:max-w-md p-0 bg-linear-to-br from-slate-900 to-slate-800 border-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-linear-to-b from-green-500/10 to-blue-500/10 animate-pulse" />

        <div className="relative z-10 flex flex-col items-center justify-center py-16 px-8 space-y-8">
          {/* Avatar với animation */}
          <div className="relative">
            {/* Outer pulse rings */}
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-pulse opacity-60" />
            <div className="absolute inset-0 rounded-full border-4 border-green-400 animate-ping opacity-40" 
                 style={{ animationDuration: '1.5s' }} />

            {/* Avatar */}
            <UserAvatar
              type="profile"
              name={callState.callerInfo?.displayName || "Người dùng"}
              avatarUrl={callState.callerInfo?.avatarUrl}
              className="ring-4 ring-green-500 shadow-2xl w-24 h-24"
            />
          </div>

          {/* Caller info */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-white">
              {callState.callerInfo?.displayName}
            </h2>
            <p className="text-green-200 text-base font-medium animate-pulse">
              Đang gọi đến...
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-6 pt-4">
            {/* Reject button */}
            <Button
              onClick={handleReject}
              variant="destructive"
              size="lg"
              className="rounded-full w-20 h-20 p-0 flex items-center justify-center hover:scale-110 transition-transform duration-200 shadow-lg"
            >
              <PhoneOff className="w-8 h-8" />
            </Button>

            {/* Accept button */}
            <Button
              onClick={handleAccept}
              size="lg"
              className="rounded-full w-20 h-20 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600 hover:scale-110 transition-transform duration-200 shadow-lg"
            >
              <Phone className="w-8 h-8" />
            </Button>
          </div>

          {/* Sub text */}
          <p className="text-xs text-gray-400 mt-4">
            Nhấn để chấp nhận hoặc từ chối
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
