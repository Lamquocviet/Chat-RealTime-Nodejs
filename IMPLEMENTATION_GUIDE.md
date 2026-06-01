# Hướng dẫn Triển khai Tính năng Gọi Video 1-1

## Tổng quan

Tính năng gọi video 1-1 đã được triển khai hoàn chỉnh với:
- **CallingDialog**: Dialog cho người gọi (caller) hiển thị avatar, tên, và animation
- **IncomingCallDialog**: Dialog cho người nhận (receiver) với nút chấp nhận/từ chối
- **VideoCallWindow**: Cửa sổ video call fullscreen khi cuộc gọi được kết nối
- **Socket.IO Signaling**: Trao đổi SDP offer/answer và ICE candidates
- **WebRTC**: Kết nối peer-to-peer cho video/audio

---

## 📁 Cấu trúc File

### Frontend Components

```
frontend/src/components/call/
├── CallingDialog.tsx          ✅ MỚI - Dialog cho caller
├── IncomingCallDialog.tsx     ✅ CẬP NHẬT - Dialog cho receiver  
└── VideoCallWindow.tsx        ✅ CẬP NHẬT - Video call window
```

### Stores

```
frontend/src/stores/
├── useCallStore.ts            ✅ CẬP NHẬT - Zustand store cho call logic
└── useSocketStore.ts          ✅ CẬP NHẬT - Thêm socket listeners video-call
```

### Pages

```
frontend/src/pages/
└── ChatAppPage.tsx            ✅ CẬP NHẬT - Hiển thị dialogs và video window
```

### Types

```
frontend/src/types/
└── chat.ts                    ✅ CẬP NHẬT - Thêm CallState với offer field
```

---

## 🎯 Quy trình Gọi Video

### 1️⃣ Caller khởi tạo cuộc gọi

**Nơi**: `ChatWindowHeader.tsx` - bấm nút Video icon
```typescript
handleVideoCall() → useCallStore.initializeCall()
```

**Chi tiết**:
1. Gọi API `POST /api/calls/initiate` để tạo Call document
2. Lấy `getUserMedia()` (camera + microphone)
3. Tạo `RTCPeerConnection` và add local tracks
4. Tạo SDP offer
5. Emit socket event `video-call:initiate` đến backend
6. Set callState status = "calling"
7. Hiển thị **CallingDialog**

---

### 2️⃣ Backend chuyển tiếp event

**Backend Socket Handler**: `socket.on("video-call:initiate")`
- Backend nhận từ caller
- Tìm socket ID của receiver
- Emit `video-call:incoming` đến receiver

---

### 3️⃣ Receiver nhận cuộc gọi

**Socket Listener**: `useSocketStore.ts` - `socket.on("video-call:incoming")`
```typescript
handleIncomingCall(data) // Cập nhật callState.status = "ringing"
```

**UI**: Hiển thị **IncomingCallDialog** với nút:
- ✅ Nghe máy (Phone icon)
- ❌ Từ chối (PhoneOff icon)

---

### 4️⃣ Receiver chấp nhận cuộc gọi

**Nơi**: `IncomingCallDialog` - bấm nút Phone icon
```typescript
handleAccept() → useCallStore.acceptCall(offer)
```

**Chi tiết**:
1. Lấy `getUserMedia()`
2. Tạo `RTCPeerConnection`
3. Set remote description = offer từ caller
4. Tạo SDP answer
5. Emit socket event `video-call:accept` đến backend

---

### 5️⃣ Backend thông báo cho Caller

**Backend Socket Handler**: `socket.on("video-call:accept")`
- Backend nhận từ receiver
- Emit `video-call:accepted` đến caller với answer

---

### 6️⃣ Caller nhận answer

**Socket Listener**: `useSocketStore.ts` - `socket.on("video-call:accepted")`
```typescript
handleCallAccepted(answer) 
→ peerConnection.setRemoteDescription(answer)
→ callState.status = "connected"
```

---

### 7️⃣ Cuộc gọi Connected - Hiển thị VideoCallWindow

**Trigger**: `ChatAppPage.tsx` - `useEffect` lắng nghe `callState.status`
```typescript
if (callState.status === "connected") → setIsVideoCallOpen(true)
```

**UI VideoCallWindow**:
- Remote video (fullscreen)
- Local video (picture-in-picture)
- Nút Toggle Audio
- Nút Toggle Video
- Nút End Call
- Hiển thị thời lượng cuộc gọi

---

### 8️⃣ ICE Candidate Exchange

**Quá trình**:
1. Caller/Receiver tạo ICE candidates
2. Emit socket event `video-call:ice-candidate` với field `to`
3. Backend relay đến người kia
4. Người kia add ICE candidate vào RTCPeerConnection

---

### 9️⃣ Kết thúc cuộc gọi

**3 cách kết thúc**:

**a) Caller kết thúc** (bấm nút End Call trong VideoCallWindow)
```typescript
CallingDialog.handleEndCall() hoặc VideoCallWindow.handleEndCall()
→ useCallStore.endCall()
→ emit "video-call:end" socket event
```

**b) Receiver từ chối lúc đầu** (bấm PhoneOff trong IncomingCallDialog)
```typescript
IncomingCallDialog.handleReject()
→ useCallStore.rejectCall()
→ emit "video-call:reject" socket event
```

**c) Socket listener nhận end event**:
```typescript
socket.on("video-call:ended")
socket.on("video-call:rejected")
→ resetCallState()
```

---

## 🔧 Chi tiết Implementation

### CallingDialog.tsx
```typescript
// Hiển thị khi callState.status === "calling"
// - Avatar người nhận
// - Tên người nhận
// - Text "Đang gọi..." (animate-pulse)
// - Animation vòng tròn quanh avatar (animate-ping)
// - Nút hủy cuộc gọi (red, PhoneOff icon)
```

### IncomingCallDialog.tsx  
```typescript
// Hiển thị khi callState.status === "ringing"
// - Avatar người gọi
// - Tên người gọi
// - Text "Đang gọi đến..." (animate-pulse)
// - Animation vòng tròn quanh avatar (animate-ping, green color)
// - 2 nút: Nghe máy (green, Phone), Từ chối (red, PhoneOff)
```

### VideoCallWindow.tsx
```typescript
// Hiển thị khi callState.status === "connected" && isOpen === true
// Layout:
// - Remote video: fullscreen
// - Local video: 128x128 bottom-right (picture-in-picture)
// - Top center: Tên người gọi + thời lượng cuộc gọi
// - Bottom center: 3 nút (Audio, Video, EndCall)
```

### useCallStore.ts - Key Methods

```typescript
interface IUseCallStore {
  // State
  callState: CallState;
  peerConnection: RTCPeerConnection | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;

  // Actions
  initializeCall(receiverId, receiverInfo, callType) // Caller init
  handleIncomingCall(data) // Receiver nhận cuộc gọi
  handleCallAccepted(answer) // Caller nhận answer từ receiver
  acceptCall(offer) // Receiver chấp nhận
  rejectCall(reason) // Receiver từ chối
  endCall() // Kết thúc cuộc gọi
  resetCallState() // Reset state
  toggleAudio(enabled)
  toggleVideo(enabled)
}
```

### useSocketStore.ts - Socket Listeners

```typescript
socket.on("video-call:incoming", handleIncoming)
  // Receiver nhận cuộc gọi

socket.on("video-call:accepted", handleCallAccepted)
  // Caller nhận answer từ receiver

socket.on("video-call:reject", handleReject)
  // Caller nhận khi receiver từ chối

socket.on("video-call:end", handleEnd)
  // Cả 2 bên nhận khi cuộc gọi kết thúc

socket.on("video-call:ice-candidate", handleIceCandidate)
  // Cả 2 bên nhận ICE candidates
```

### CallState Type

```typescript
interface CallState {
  callId: string | null;
  status: "idle" | "calling" | "ringing" | "connected" | "ended";
  callerId: string | null;
  receiverId: string | null;
  offer?: RTCSessionDescriptionInit; // ✅ MỚI
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
  duration: number;
}
```

---

## 🚀 Cách sử dụng

### 1. Đảm bảo backend socket events đúng

Backend cần emit những socket events này:
- `video-call:incoming` (cho receiver)
- `video-call:accepted` (cho caller)
- `video-call:rejected` (cho caller)
- `video-call:ended` (cho cả 2)
- `video-call:ice-candidate` (relay)

✅ **Backend đã có tất cả** (xem `backend/src/socket/index.js`)

### 2. Components được hiển thị ở đâu?

**ChatAppPage.tsx**:
```typescript
<CallingDialog />              // Hiển thị khi caller đang gọi
<IncomingCallDialog />         // Hiển thị khi receiver nhận cuộc gọi
<VideoCallWindow ... />        // Hiển thị khi connected
```

### 3. Bắt đầu cuộc gọi từ đâu?

**ChatWindowHeader.tsx**:
```typescript
<Button onClick={handleVideoCall}>
  <Video />
</Button>
```

Khi bấm:
```typescript
handleVideoCall()
  → initializeCall(otherUser._id, otherUser, "video")
  → CallingDialog hiển thị
```

### 4. Xử lý lỗi

**Toast notifications**:
- Người dùng offline → toast.error()
- Có cuộc gọi đang diễn ra → toast.error()
- Receiver từ chối → socket listener emit toast.error()

---

## 🐛 Debugging

### 1. Console logs
Tất cả các bước đều có console.log với emoji:
- 🔵 Bước bắt đầu
- ✅ Bước hoàn tất
- ❌ Lỗi
- 📱 Socket event nhận
- 📤 Socket event gửi

### 2. Network tab
- Xem socket events trong DevTools → Network → WS
- Xem API calls: `/api/calls/initiate`, `/accept`, `/reject`, `/end`

### 3. WebRTC Stats
```javascript
peerConnection.getStats().then(report => {
  report.forEach(stats => console.log(stats))
})
```

---

## 📋 Checklist triển khai

- [x] CallingDialog.tsx tạo
- [x] IncomingCallDialog.tsx cập nhật  
- [x] VideoCallWindow.tsx cập nhật
- [x] useCallStore.ts cập nhật (handleIncomingCall, offer field)
- [x] useSocketStore.ts cập nhật (video-call listeners)
- [x] ChatAppPage.tsx cập nhật (hiển thị dialogs)
- [x] types/chat.ts cập nhật (CallState.offer)
- [x] ChatWindowHeader.tsx có nút Video gọi

---

## 🎨 UI/UX Features

### CallingDialog
- ✨ Animation pulse background
- 🔄 Spinner ring quanh avatar
- 💫 Ping animation (rotating circles)
- 🔴 Red end call button
- 📝 "Đang gọi..." text với pulse animation

### IncomingCallDialog
- ✨ Animation pulse background (green)
- 🔄 Green spinner ring quanh avatar
- 💫 Ping animation (green)
- 🟢 Green accept button
- 🔴 Red reject button

### VideoCallWindow
- 📹 Remote video fullscreen
- 📸 Local video picture-in-picture
- ⏱️ Call duration timer
- 🔊 Toggle audio button
- 📹 Toggle video button
- 🔴 End call button

---

## 🔗 Socket Flow Diagram

```
CALLER                          BACKEND                         RECEIVER
   |                               |                               |
   |--video-call:initiate--------->|                               |
   |                               |--video-call:incoming--------->|
   |                            (waiting)                          |
   |                               |<--video-call:accept-----------|
   |<--video-call:accepted---------|                               |
   |                            (waiting)                    (waiting)
   |-------RTCPeerConnection--------|-------RTCPeerConnection----->|
   |<------ICE candidates---------->|<------ICE candidates-------->|
   |                               |                               |
   |<-------CONNECTED VIDEO CALL--------->|
   |                               |                               |
   |<-------video-call:end-------->|-------video-call:ended------->|
   |                               |                               |
```

---

## 📞 API Endpoints (Backend)

```
POST   /api/calls/initiate              # Create call document
PATCH  /api/calls/:callId/accept        # Update call status to accepted
PATCH  /api/calls/:callId/reject        # Update call status to rejected
PATCH  /api/calls/:callId/end           # Update call status to ended
GET    /api/calls/history               # Get call history
```

---

## 🎬 Luồng sự kiện hoàn chỉnh

```
1. Caller: ChatWindowHeader bấm Video → initializeCall()
2. Caller: createOffer() + socket emit "video-call:initiate"
3. Backend: socket listen "video-call:initiate" → relay
4. Receiver: socket listen "video-call:incoming" → CallState.status = "ringing"
5. Receiver: IncomingCallDialog hiển thị
6. Receiver: bấm Phone → acceptCall(offer)
7. Receiver: createAnswer() + socket emit "video-call:accept"
8. Backend: socket listen "video-call:accept" → relay  
9. Caller: socket listen "video-call:accepted" → handleCallAccepted(answer)
10. Caller: setRemoteDescription(answer) → CallState.status = "connected"
11. Both: ChatAppPage useEffect trigger → VideoCallWindow hiển thị
12. Both: ICE candidates được exchange qua socket
13. Both: WebRTC connection established → video/audio flowing
14. Either: bấm End Call → endCall() → socket emit "video-call:end"
15. Both: socket listen "video-call:ended" → resetCallState()
16. Both: VideoCallWindow đóng
```

---

## ⚡ Performance Optimization

1. **Lazy load components**: Video components chỉ render khi cần
2. **Memoization**: Sử dụng useCallback để tránh re-create functions
3. **Media constraint**: 1280x720 video, adjust nếu cần performance
4. **STUN servers**: Google STUN để tránh cần TURN server

---

## 🚨 Lưu ý quan trọng

1. **Port/IP issues**: Nếu không tạo được connection, check STUN server
2. **Microphone permission**: Browser phải grant microphone/camera permission
3. **HTTPS required**: WebRTC yêu cầu HTTPS (hoặc localhost)
4. **Socket reconnect**: Nếu socket disconnect, call sẽ bị reset
5. **Mobile**: Test on actual mobile devices, emulator có vấn đề

---

## 📚 Tài liệu tham khảo

- WebRTC: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API
- Socket.IO: https://socket.io/docs/v4/
- Zustand: https://github.com/pmndrs/zustand
- React: https://react.dev/
