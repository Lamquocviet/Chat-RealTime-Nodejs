# 📞 Video Call Feature - Code Reference

## 1. CallingDialog.tsx - FULL CODE

```typescript
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
      <DialogContent className="sm:max-w-md p-0 bg-gradient-to-br from-slate-900 to-slate-800 border-0 rounded-3xl overflow-hidden">
        {/* Background animation */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 to-purple-500/10 animate-pulse" />

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
```

---

## 2. IncomingCallDialog.tsx - UPDATED

```typescript
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
      <DialogContent className="sm:max-w-md p-0 bg-gradient-to-br from-slate-900 to-slate-800 border-0 rounded-3xl overflow-hidden shadow-2xl">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-blue-500/10 animate-pulse" />

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
```

---

## 3. useSocketStore.ts - UPDATED PART

Thêm vào trong `connectSocket()` method sau phần "new-group":

```typescript
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
    socket.on("video-call:reject", (data: any) => {
      console.log("❌ Receiver từ chối cuộc gọi:", data);
      const { reason } = data;
      
      useCallStore.getState().resetCallState();
      toast.error(`Người dùng từ chối cuộc gọi${reason ? ': ' + reason : ''}`);
    });

    // Cả hai bên nhận khi cuộc gọi kết thúc
    socket.on("video-call:end", (data: any) => {
      console.log("🔴 Cuộc gọi kết thúc:", data);
      const { callId } = data;
      
      const { callState } = useCallStore.getState();
      if (callState.callId === callId) {
        useCallStore.getState().resetCallState();
      }
    });

    // ICE Candidate exchange
    socket.on("video-call:ice-candidate", (data: any) => {
      console.log("🧊 Nhận ICE candidate");
      const { candidate } = data;
      const { peerConnection } = useCallStore.getState();
      
      if (peerConnection && candidate) {
        try {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error("Lỗi thêm ICE candidate:", error);
        }
      }
    });
```

---

## 4. useCallStore.ts - UPDATED PARTS

### Cập nhật handleIncomingCall:
```typescript
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
```

### Cập nhật resetCallState:
```typescript
  resetCallState: () => {
    set({
      callState: {
        callId: null,
        status: "idle",
        callerId: null,
        receiverId: null,
        offer: undefined, // ✅ Reset offer
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
```

---

## 5. ChatAppPage.tsx - COMPLETE UPDATED

```typescript
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
```

---

## 6. types/chat.ts - UPDATED CallState

```typescript
export interface CallState {
  callId: string | null;
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  callerId: string | null;
  receiverId: string | null;
  offer?: RTCSessionDescriptionInit; // ✅ Thêm field này
  callerInfo?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  receiverInfo?: {
    _id: string;
    displayName: string;
    avatarUrl?: string;
  };
  isAudioOn: boolean;
  isVideoOn: boolean;
  duration: number; // in seconds
}
```

---

## 7. Imports cần thêm vào files

### CallingDialog.tsx
```typescript
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { PhoneOff } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { useSocketStore } from "@/stores/useSocketStore";
```

### IncomingCallDialog.tsx
```typescript
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import UserAvatar from "@/components/chat/UserAvatar";
import { Phone, PhoneOff } from "lucide-react";
import { useCallStore } from "@/stores/useCallStore";
import { toast } from "sonner";
```

### ChatAppPage.tsx
```typescript
import { useEffect, useState } from "react";
import ChatWindowLayout from "@/components/chat/ChatWindowLayout";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import IncomingCallDialog from "@/components/call/IncomingCallDialog";
import CallingDialog from "@/components/call/CallingDialog"; // ✅ NEW
import VideoCallWindow from "@/components/call/VideoCallWindow";
import { useCallStore } from "@/stores/useCallStore";
```

### useSocketStore.ts
```typescript
import { useCallStore } from "./useCallStore"; // ✅ NEW
import { toast } from "sonner"; // ✅ NEW
```

---

## 8. Quick Setup Checklist

```
✅ Create CallingDialog.tsx
✅ Update IncomingCallDialog.tsx
✅ Keep VideoCallWindow.tsx
✅ Update useCallStore.ts (handleIncomingCall, resetCallState)
✅ Update useSocketStore.ts (add video-call listeners)
✅ Update ChatAppPage.tsx
✅ Update types/chat.ts (add offer field)
✅ Check ChatWindowHeader.tsx has video button (already there)
✅ Ensure backend socket handlers are correct
✅ Test with 2 browser windows
```

---

## 9. Testing Steps

### Setup
1. Install all dependencies
2. Start backend server
3. Open 2 browser windows

### Test Call Accept
1. Window A: Login as User A
2. Window B: Login as User B
3. Create direct chat A ↔ B
4. A clicks Video button
   - ✅ CallingDialog appears on A
   - ✅ IncomingCallDialog appears on B
5. B clicks Phone (accept)
   - ✅ CallingDialog closes on A
   - ✅ IncomingCallDialog closes on B
   - ✅ VideoCallWindow appears on both
6. Test audio/video toggle on both
7. Click End Call
   - ✅ VideoCallWindow closes
   - ✅ Reset to idle state

### Test Call Reject
1. A clicks Video
   - ✅ CallingDialog appears on A
   - ✅ IncomingCallDialog appears on B
2. B clicks PhoneOff (reject)
   - ✅ CallingDialog closes on A
   - ✅ Toast "Người dùng từ chối cuộc gọi" on A
   - ✅ Reset to idle state

### Test Call Cancel
1. A clicks Video
   - ✅ CallingDialog appears
2. A clicks End Call button
   - ✅ CallingDialog closes
   - ✅ IncomingCallDialog closes on B (if appeared)
   - ✅ Reset to idle state

---

## 10. Common Issues & Solutions

### Issue: CallingDialog not showing
**Solution**: Check if `callState.status === "calling"` in Dialog's `open` prop

### Issue: IncomingCallDialog not showing
**Solution**: Check socket listener in useSocketStore is correctly attached

### Issue: VideoCallWindow not showing
**Solution**: Ensure `callState.status === "connected"` in ChatAppPage's useEffect

### Issue: No video/audio stream
**Solution**: Check browser permissions for camera/microphone

### Issue: Socket events not received
**Solution**: Check browser DevTools → Network → WS to see socket messages

### Issue: ICE candidates not exchanged
**Solution**: Ensure peerConnection exists and is not closed

---

## 11. Performance Tips

1. Use `useCallback` to memoize event handlers
2. Don't re-create RTCPeerConnection unnecessarily
3. Stop media tracks when call ends
4. Use constraint { width: 1280, height: 720 } for camera
5. Monitor memory leaks with DevTools

---

## 12. Browser Compatibility

- ✅ Chrome 96+
- ✅ Firefox 90+
- ✅ Safari 15+
- ✅ Edge 96+

Requires:
- WebRTC support
- getUserMedia API
- Socket.IO
- Modern React (hooks)
