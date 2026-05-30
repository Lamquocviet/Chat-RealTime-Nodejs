import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { Phone, PhoneOff } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const IncomingCallDialog = () => {
  const { callState, acceptCall, rejectCall, handleIncomingCall } = useCallStore();
  const { socket } = useSocketStore();
  const [offer, setOffer] = useState<RTCSessionDescriptionInit | null>(null);
  const isRinging = callState.status === "ringing";

  // Listen for incoming call
  useEffect(() => {
    if (!socket) {
      console.log("Socket not ready");
      return;
    }

    const handleIncoming = (data: any) => {
      console.log("Incoming call received:", data);
      setOffer(data.offer);
      handleIncomingCall(data);
    };

    socket.on("video-call:incoming", handleIncoming);

    return () => {
      socket.off("video-call:incoming", handleIncoming);
    };
  }, [socket, handleIncomingCall]);

  const handleAccept = async () => {
    if (offer) {
      try {
        await acceptCall(offer);
        toast.success("Cuộc gọi được chấp nhận");
      } catch (error) {
        console.error("Lỗi khi chấp nhận cuộc gọi:", error);
        toast.error("Lỗi khi chấp nhận cuộc gọi");
      }
    }
  };

  const handleReject = async () => {
    try {
      await rejectCall();
      toast.success("Cuộc gọi bị từ chối");
    } catch (error) {
      console.error("Lỗi khi từ chối cuộc gọi:", error);
    }
  };

  return (
    <Dialog open={isRinging}>
      <DialogContent className="sm:max-w-md p-0 bg-linear-to-br from-slate-900 to-slate-800 border-0 rounded-2xl overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-linear-to-b from-blue-500/10 to-purple-500/10 animate-pulse" />

        <div className="relative z-10 flex flex-col items-center justify-center py-12 px-6 space-y-8">
          {/* Avatar */}
          <div className="relative">
            <UserAvatar
              type="profile"
              name={callState.callerInfo?.displayName || "User"}
              avatarUrl={callState.callerInfo?.avatarUrl}
              className="ring-4 ring-blue-500 shadow-xl animate-pulse"
            />
            {/* Ringing animation */}
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" />
          </div>

          {/* Caller info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">
              {callState.callerInfo?.displayName}
            </h2>
            <p className="text-blue-200 text-sm animate-pulse">
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
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* Accept button */}
            <Button
              onClick={handleAccept}
              className="rounded-full w-16 h-16 p-0 flex items-center justify-center bg-green-500 hover:bg-green-600 hover:scale-110 transition-transform"
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default IncomingCallDialog;
