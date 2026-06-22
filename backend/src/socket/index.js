import http from "http";
import express from "express";
import {Server} from "socket.io";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }
})
io.use(socketAuthMiddleware)

const onlineUsers = new Map();


io.on("connection", async (socket) =>{

    const user = socket.user;
    // console.log(`${user.displayName} kết nối socket: ${socket.id}`);
    // store keys as strings to avoid ObjectId/string mismatch
    onlineUsers.set(user._id.toString(), socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));

    const conversationIds = await getUserConversationsForSocketIO(user._id)
    conversationIds.forEach((id)=>{
        socket.join(id);
    })
    

    // listen for explicit join requests from client
    socket.on("join-conversation", (conversationId) => {
      socket.join(conversationId.toString());
      console.log(`${socket.user.displayName} joined room ${conversationId}`);
    });

    // Join user's personal room
    socket.join(user._id.toString());

    // ====== VIDEO CALL HANDLERS ======
    
    /**
     * Caller khởi tạo cuộc gọi
     * Data: { receiverId, offer, callId, callerInfo }
     */
    socket.on("video-call:initiate", (data) => {
      const { receiverId, offer, callId, callerInfo } = data;

      console.log(`Video call initiated from ${user._id} to ${receiverId}`);

      // Emit to the receiver's personal room (joined as their userId)
      const receiverKey = receiverId.toString();
      const isOnline = onlineUsers.has(receiverKey);
      if (isOnline) {
        io.to(receiverKey).emit("video-call:incoming", {
          callerId: user._id,
          callerInfo,
          offer,
          callId,
        });
      } else {
        // Receiver offline
        socket.emit("video-call:error", {
          message: "Người nhận đang offline",
        });
      }
    });

    /**
     * Receiver chấp nhận cuộc gọi
     * Data: { callerId, answer, callId }
     */
    socket.on("video-call:accept", (data) => {
      const { callerId, answer, callId } = data;
      console.log(`Call ${callId} accepted by ${user._id}`);
      // Emit to caller's personal room
      io.to(callerId.toString()).emit("video-call:accepted", {
        receiverId: user._id,
        answer,
        callId,
      });
    });

    /**
     * Receiver từ chối cuộc gọi
     * Data: { callerId, reason, callId }
     */
    socket.on("video-call:reject", (data) => {
      const { callerId, reason = "Người dùng từ chối", callId } = data;
      console.log(`Call ${callId} rejected by ${user._id}`);
      // Emit to caller's personal room
      io.to(callerId.toString()).emit("video-call:rejected", {
        receiverId: user._id,
        reason,
        callId,
      });
    });

    /**
     * Gửi ICE candidate
     * Data: { to, candidate, callId }
     */
    socket.on("video-call:ice-candidate", (data) => {
      const { to, candidate, callId } = data;
      // Emit ICE candidate to recipient room
      io.to(to.toString()).emit("video-call:ice-candidate", {
        from: user._id,
        candidate,
        callId,
      });
    });

    /**
     * Kết thúc cuộc gọi
     * Data: { to, callId }
     */
    socket.on("video-call:end", (data) => {
      const { to, callId } = data;
      console.log(`Call ${callId} ended by ${user._id}`);
      io.to(to.toString()).emit("video-call:ended", {
        from: user._id,
        callId,
      });
    });

    socket.on("disconnect", ()=>{

        onlineUsers.delete(user._id.toString());
        io.emit("online-users", Array.from(onlineUsers.keys()));
        // console.log(`socket disconnected: ${socket.id}`);
    })
})

export {io, app, server, onlineUsers};