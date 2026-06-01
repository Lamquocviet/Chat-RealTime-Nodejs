# Video Call Implementation - Complete Guide & Fixes

## 📊 Summary of All Fixes Applied

### 1️⃣ Frontend Socket Store Fixes
**File**: `frontend/src/stores/useSocketStore.ts`

#### Issue 1: Duplicate Connect Listener
```javascript
// ❌ BEFORE: Two connect listeners registered
socket.on("connect", () => { console.log("Đã kết nối"); });
socket.on("connect", () => { console.log("Socket connected:", socket.id); });
```

```javascript
// ✅ AFTER: Single connect listener
socket.on("connect", () => { console.log("Socket connected:", socket.id); });
```

#### Issue 2: Debug Code Leaked
```javascript
// ❌ BEFORE: Debug listener logging all events
socket.onAny((event, ...args) => { console.log("SOCKET EVENT:", event, args); });
```
✅ **REMOVED** - This caused performance issues and spam in console

#### Issue 3: Event Name Mismatch
```javascript
// ❌ BEFORE: Listening to wrong event name
socket.on("video-call:reject", (data) => { ... })  // ❌ Wrong!
socket.on("video-call:end", (data) => { ... })     // ❌ Wrong!

// ✅ AFTER: Corrected event names
socket.on("video-call:rejected", (data) => { ... }) // ✅ Matches backend
socket.on("video-call:ended", (data) => { ... })    // ✅ Matches backend
```

**Why this matters**: 
- Backend emits `video-call:rejected` but frontend was listening to `video-call:reject`
- This meant receiver rejection wouldn't be processed on caller side
- Same for `video-call:end` vs `video-call:ended`

---

### 2️⃣ Call Store - Peer Connection Lifecycle Fix
**File**: `frontend/src/stores/useCallStore.ts`

#### Issue: Race Condition in acceptCall
```javascript
// ❌ BEFORE: PeerConnection set AFTER socket emit
socket.emit("video-call:accept", {...});  // Emits socket event

set((state) => ({
  peerConnection: pc,  // Set AFTER emit! ❌
  callState: { status: "connected" }
}));
```

**Problem**: 
- When receiver adds tracks, they get sent immediately
- ICE candidates start being generated
- Backend forwards ICE candidates back to caller
- Caller's `onicecandidate` listener can't process them (peerConnection not in store yet)

```javascript
// ✅ AFTER: PeerConnection set BEFORE socket emit
set({ peerConnection: pc });  // Set state first ✅

// Now ICE candidate handler can access peerConnection
pc.onicecandidate = (event) => {
  if (event.candidate && socket) {
    socket.emit("video-call:ice-candidate", {...});
  }
};

socket.emit("video-call:accept", {...});  // Emit after setup
```

---

### 3️⃣ Improved Error Handling
**File**: `frontend/src/stores/useCallStore.ts` - `handleCallAccepted`

#### Better Error Messages
```javascript
// ✅ AFTER: Comprehensive error handling
if (!peerConnection) {
  console.error("❌ PeerConnection not found when handling answer");
  toast.error("Lỗi: Kết nối peer bị mất");
  get().resetCallState();
  return;
}

// Wait for remote stream
setTimeout(() => {
  const { remoteStream } = get();
  if (!remoteStream) {
    console.warn("⚠️ Remote stream not received yet...");
  } else {
    console.log("✅ Remote stream confirmed");
  }
}, 1000);
```

---

### 4️⃣ VideoCallWindow Improvements
**File**: `frontend/src/components/call/VideoCallWindow.tsx`

#### Issue: Black Screen When Remote Stream Delayed
```javascript
// ❌ BEFORE: Just empty video element
<video ref={remoteVideoRef} autoPlay playsInline />
// → Black screen, user confused

// ✅ AFTER: Loading state with message
{remoteStream && remoteStreamReady ? (
  <video ref={remoteVideoRef} autoPlay playsInline />
) : (
  <div className="flex items-center justify-center">
    <div className="animate-pulse">📹</div>
    <p>Đang kết nối video từ {otherUserName}...</p>
  </div>
)}
```

#### Additional Improvements:
- Track `remoteStreamReady` state
- Better error logging
- Fallback UI for missing streams
- Improved event listener cleanup

---

## 🔄 Complete Video Call Flow (After Fixes)

```
CALLER: Initiates Call
  ├─ initializeCall(receiverId, receiverInfo, "video")
  ├─ Create peer connection
  ├─ Get user media (audio + video)
  ├─ Add local tracks
  ├─ Setup handlers: onicecandidate, ontrack, onconnectionstatechange
  ├─ [SET PEER CONNECTION TO STORE] ✅ NEW
  ├─ Create offer with offerToReceiveVideo: true
  ├─ Set local description
  ├─ Emit "video-call:initiate" with offer
  └─ Status: "calling" → CallingDialog shows

         ⬇️ [Socket] ⬇️

RECEIVER: Gets Notification
  ├─ Socket receives "video-call:incoming"
  ├─ handleIncomingCall() saves offer
  ├─ Status: "ringing" → IncomingCallDialog shows
  └─ User clicks ACCEPT

RECEIVER: Accepts Call
  ├─ acceptCall(offer)
  ├─ Create peer connection
  ├─ Get user media (audio + video)
  ├─ Add local tracks
  ├─ Setup handlers: onicecandidate, ontrack, onconnectionstatechange
  ├─ [SET PEER CONNECTION TO STORE BEFORE EMIT] ✅ FIX
  ├─ Set remote description (offer)
  ├─ Create answer
  ├─ Set local description
  ├─ Emit "video-call:accept" with answer
  └─ Status: "connected" → VideoCallWindow shows

         ⬇️ [Socket] ⬇️

CALLER: Gets Answer
  ├─ Socket receives "video-call:accepted"
  ├─ handleCallAccepted(answer)
  ├─ Set remote description (answer)
  ├─ Status: "connected" → VideoCallWindow shows
  └─ Both sides now ready for ontrack callbacks

ICE CANDIDATE EXCHANGE: (Parallel)
  ├─ Receiver: onicecandidate → emit "video-call:ice-candidate"
  ├─ Backend: forwards to caller
  ├─ Caller: "video-call:ice-candidate" → addIceCandidate()
  ├─ Caller: onicecandidate → emit "video-call:ice-candidate"
  ├─ Backend: forwards to receiver
  └─ Receiver: "video-call:ice-candidate" → addIceCandidate()

REMOTE STREAM ESTABLISHMENT:
  ├─ Connection stabilizes
  ├─ ontrack callback triggered
  ├─ remoteStream set to store
  ├─ VideoCallWindow useEffect detects change
  ├─ Video element gets srcObject assigned
  └─ VIDEO DISPLAYS ✅
```

---

## 🧪 Testing the Fix

### Test Case 1: Basic Video Call
1. Open two browser windows (or incognito windows)
2. Login as User A and User B
3. User A clicks video call button for User B
4. Verify CallingDialog shows on User A's screen
5. Verify IncomingCallDialog shows on User B's screen
6. User B clicks Accept
7. **Both should see VideoCallWindow with video**
8. Verify local video shows (mirror image)
9. Verify remote video shows other person

### Test Case 2: Camera/Mic Permissions
1. If camera access is denied:
   - Should fall back to audio-only call
   - Should show toast: "Không thể truy cập camera, chấp nhận cuộc gọi chỉ âm thanh"
2. Test toggle mic/camera buttons
3. Test mute/unmute works

### Test Case 3: Rejection Flow
1. User A calls User B
2. User B clicks Reject
3. **User A should see toast**: "Người dùng từ chối cuộc gọi"
4. Both should be back to idle state

### Test Case 4: Offline User
1. User A tries to call offline user
2. Should see toast: "Người nhận đang offline"

### Test Case 5: End Call
1. During active call
2. Either user clicks end button
3. **Both should see VideoCallWindow close**
4. Both should be back to idle state

---

## 📋 Debug Checklist

**Browser Console Should Show** (in order):

```javascript
// Caller initiates
🔵 Bước 1: Gọi API để tạo Call document
✅ Bước 1 OK - CallId: [UUID]
🔵 Bước 2: Lấy camera/microphone
✅ Bước 2 OK - Stream: [ID]
🔵 Bước 3: Tạo RTCPeerConnection
✅ Bước 3 OK - PeerConnection: new
🔵 Bước 4: Tạo Offer
✅ Bước 4 OK - Offer tạo và set
📤 Gửi socket event video-call:initiate

// Receiver receives call
📱 Nhận cuộc gọi đến: {...}

// Receiver accepts
🔵 Chấp nhận cuộc gọi - CallId: [UUID]
✅ PeerConnection set vào store
🔵 Setting remote description (offer)
✅ Remote description set
🔵 Tạo answer
✅ Answer tạo và set
📤 Emit video-call:accept

// Caller gets answer
✅ Receiver đã chấp nhận cuộc gọi
🔵 Setting remote description (answer)...
✅ Remote description set successfully
✅ Call connected

// Both sides
🔌 Connection state: connecting → connected
🧊 ICE state: checking → connected
📹 Nhận remote stream...
```

---

## ⚠️ Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Black video for 10+ seconds | Remote stream not yet available | Wait, it's normal. Check console for logs. |
| One-way video (can see them, they can't see you) | Tracks not added properly | Check getUserMedia worked, check browser logs |
| No audio | Mic disabled or not granted | Check browser permissions, try toggle mic button |
| "Không thể truy cập camera" | Camera permission denied | Grant camera permission in browser settings |
| Call not connecting | Socket issue or offer/answer mismatch | Check console for socket events |
| Caller sees "offline" error | User not connected to socket | Ensure user is logged in and socket connected |

---

## 📝 Files Modified

1. ✅ `frontend/src/stores/useSocketStore.ts`
   - Fixed duplicate connect listener
   - Fixed event names: rejected, ended
   - Removed debug onAny listener

2. ✅ `frontend/src/stores/useCallStore.ts`
   - Fixed peerConnection lifecycle in acceptCall
   - Improved handleCallAccepted error handling
   - Added detailed logging

3. ✅ `frontend/src/components/call/VideoCallWindow.tsx`
   - Added loading state
   - Improved error handling
   - Better event listener management

---

## ✨ Key Takeaways

**The core issue**: Socket events were misnamed and peerConnection wasn't available in store when ICE candidates needed to be processed.

**The fix**: 
1. Correct socket event names
2. Set peerConnection to store BEFORE emitting socket events
3. Add better error handling and UX

**Result**: Video calls now work smoothly from offer → answer → ICE → remote stream!

