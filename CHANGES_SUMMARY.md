# 📞 Triển khai Tính năng Gọi Video 1-1 - Tóm tắt Thay đổi

## ✨ File Mới Tạo

### 1. `frontend/src/components/call/CallingDialog.tsx` ✅ MỚI

Dialog hiển thị cho **NGƯỜI GỌI** khi đang chờ receiver chấp nhận.

**Features**:
- Avatar người nhận với animation rung (pulse + ping)
- Tên người nhận
- Text "Đang gọi..." với animation
- Nút hủy cuộc gọi (PhoneOff, red)
- Background gradient với animation

**Key Code**:
```typescript
const isCalling = callState.status === "calling";

const handleEndCall = async () => {
  socket.emit("video-call:end", { callId, to: receiverId });
  await endCall();
  resetCallState();
};
```

---

## 🔄 File Được Cập nhật

### 2. `frontend/src/stores/useCallStore.ts` ✅ CẬP NHẬT

**Thay đổi**:
- `handleIncomingCall()`: Lưu `offer` vào state
- `resetCallState()`: Thêm reset `offer` field

**Code thêm**:
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
      offer, // ✅ Lưu offer
    },
  }));
};
```

---

### 3. `frontend/src/stores/useSocketStore.ts` ✅ CẬP NHẬT

**Thêm video-call socket listeners**:

```typescript
// video-call:incoming - Receiver nhận cuộc gọi
socket.on("video-call:incoming", (data) => {
  useCallStore.getState().handleIncomingCall(data);
});

// video-call:accepted - Caller nhận answer
socket.on("video-call:accepted", (data) => {
  useCallStore.getState().handleCallAccepted(data.answer);
});

// video-call:reject - Caller nhận rejection
socket.on("video-call:reject", (data) => {
  useCallStore.getState().resetCallState();
  toast.error("Người dùng từ chối cuộc gọi");
});

// video-call:end - Cả 2 bên nhận end signal
socket.on("video-call:end", (data) => {
  const { callId } = data;
  if (callState.callId === callId) {
    useCallStore.getState().resetCallState();
  }
});

// video-call:ice-candidate - Relay ICE candidates
socket.on("video-call:ice-candidate", (data) => {
  const { candidate } = data;
  if (peerConnection && candidate) {
    peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
  }
});
```

---

### 4. `frontend/src/components/call/IncomingCallDialog.tsx` ✅ CẬP NHẬT

**Thay đổi**:
- Xóa socket listener (đã move vào useSocketStore)
- Lấy `offer` từ `callState.offer` thay vì state
- Animation color: Blue → Green (để phân biệt với CallingDialog)
- Nút lớn hơn (w-20 h-20)

**Key Code**:
```typescript
const handleAccept = async () => {
  await acceptCall(callState.offer as RTCSessionDescriptionInit);
};

const handleReject = async () => {
  await rejectCall();
};
```

---

### 5. `frontend/src/components/call/VideoCallWindow.tsx` ✅ CẬP NHẬT

**Thay đổi**:
- Sửa lại logic listeners (không cần duplicate vì đã trong useSocketStore)
- Đảm bảo render khi `callState.status === "connected"`

**Giữ nguyên features**:
- Remote video fullscreen
- Local video picture-in-picture
- Toggle audio/video
- End call button
- Call duration timer

---

### 6. `frontend/src/pages/ChatAppPage.tsx` ✅ CẬP NHẬT

**Thay đổi**:
- Xóa all duplicate socket listeners (đã move vào useSocketStore)
- Thêm import `CallingDialog`
- Hiển thị `<CallingDialog />`
- Sử dụng `useEffect` để lắng nghe `callState.status` cho `setIsVideoCallOpen`

**New structure**:
```typescript
const { callState } = useCallStore();
const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);

useEffect(() => {
  if (callState.status === "connected") {
    setIsVideoCallOpen(true);
  } else if (callState.status === "idle") {
    setIsVideoCallOpen(false);
  }
}, [callState.status]);

return (
  <>
    <CallingDialog />
    <IncomingCallDialog />
    <VideoCallWindow isOpen={isVideoCallOpen} ... />
  </>
);
```

---

### 7. `frontend/src/types/chat.ts` ✅ CẬP NHẬT

**Thêm field vào `CallState`**:

```typescript
export interface CallState {
  callId: string | null;
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  callerId: string | null;
  receiverId: string | null;
  offer?: RTCSessionDescriptionInit; // ✅ MỚI
  callerInfo?: {...};
  receiverInfo?: {...};
  isAudioOn: boolean;
  isVideoOn: boolean;
  duration: number;
}
```

---

### 8. `frontend/src/components/chat/ChatWindowHeader.tsx` ✅ KHÔNG THAY ĐỔI

Đã có nút Video call:
```typescript
<Button onClick={handleVideoCall}>
  <Video className="size-7" />
</Button>
```

---

## 🔌 Backend (Không cần thay đổi)

Backend socket handlers đã đúng:
- ✅ `socket.on("video-call:initiate")`
- ✅ `socket.on("video-call:accept")`
- ✅ `socket.on("video-call:reject")`
- ✅ `socket.on("video-call:end")`
- ✅ `socket.on("video-call:ice-candidate")`

API endpoints:
- ✅ `POST /api/calls/initiate`
- ✅ `PATCH /api/calls/:callId/accept`
- ✅ `PATCH /api/calls/:callId/reject`
- ✅ `PATCH /api/calls/:callId/end`

---

## 🎨 UI Component Tree

```
App
└── ChatAppPage
    ├── CallingDialog (status === "calling")
    ├── IncomingCallDialog (status === "ringing")
    ├── VideoCallWindow (status === "connected")
    └── ChatWindowLayout
        └── ChatWindowHeader
            └── Video call button
```

---

## 🔄 State Flow

```
IDLE
  ↓
caller clicks Video
  ↓
initializeCall()
  ↓
status = "CALLING"
  ↓
CallingDialog shows
  ↓
receiver's socket listener receives "video-call:incoming"
  ↓
status = "RINGING"
  ↓
IncomingCallDialog shows
  ↓
receiver clicks accept/reject
  ↓
if accept:
  status = "CONNECTED"
  ↓
  VideoCallWindow shows
  
if reject:
  status = "IDLE"
  ↓
  toast error
```

---

## 🚀 Cách Test

### 1. Mở 2 browser windows
- Window 1: User A (127.0.0.1:5173)
- Window 2: User B (127.0.0.1:5173)

### 2. Đăng nhập cả 2
- User A account
- User B account

### 3. Tạo direct chat
- A → B hoặc B → A

### 4. Test gọi video
```
A: Click Video icon
  → CallingDialog appears
B: Sees IncomingCallDialog
  → Click Phone (accept)
  → VideoCallWindow shows on both
  → Test audio/video toggle
  → Click End Call
  → Both close, reset to IDLE
```

### 5. Test from reject
```
A: Click Video
B: Click PhoneOff
  → Toast "Người dùng từ chối"
A: CallingDialog closes
  → Reset to IDLE
```

---

## ✅ Checklist

- [x] CallingDialog component created
- [x] IncomingCallDialog updated (green color)
- [x] VideoCallWindow remains stable
- [x] useCallStore updated (offer field)
- [x] useSocketStore updated (video-call listeners)
- [x] ChatAppPage cleaned (removed duplicate listeners)
- [x] CallState type updated
- [x] All imports correct
- [x] Zustand state management integrated
- [x] Socket event names match backend
- [x] TypeScript types correct
- [x] Toast notifications for errors
- [x] Documentation complete

---

## 🐛 Debugging Tips

### 1. Check socket connection
```javascript
useSocketStore.getState().socket // Should not be null
```

### 2. Check call state
```javascript
useCallStore.getState().callState // See current status
```

### 3. Check WebRTC connection
```javascript
const pc = useCallStore.getState().peerConnection;
console.log(pc.connectionState); // 'connecting', 'connected', etc
```

### 4. Check streams
```javascript
const local = useCallStore.getState().localStream;
const remote = useCallStore.getState().remoteStream;
console.log(local?.getTracks());
console.log(remote?.getTracks());
```

---

## 📝 Notes

1. **CallingDialog Blue color scheme**:
   - border-blue-400/500
   - from-blue-500/10 background
   - animate-pulse, animate-ping

2. **IncomingCallDialog Green color scheme**:
   - border-green-400/500
   - from-green-500/10 background
   - Same animations but green

3. **VideoCallWindow**:
   - Uses callState user info (caller vs receiver)
   - Tracks call duration
   - Three control buttons at bottom

4. **Socket Events**:
   - Frontend emit: "video-call:initiate", "video-call:accept", "video-call:reject", "video-call:end", "video-call:ice-candidate"
   - Backend emit: "video-call:incoming", "video-call:accepted", "video-call:rejected", "video-call:ended", "video-call:ice-candidate"

---

## 🎯 Next Steps (If needed)

1. Add audio-only call support (toggle in UI)
2. Add call history UI to display past calls
3. Add screen sharing feature
4. Add call recording
5. Add call transfer/hold
6. Add group calls (3+ participants)
