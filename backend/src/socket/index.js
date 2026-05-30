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
    onlineUsers.set(user._id, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));

    const conversationIds = await getUserConversationsForSocketIO(user._id)
    conversationIds.forEach((id)=>{
        socket.join(id);
    })
    

    socket.join("join-conversation", (conversationId)=>{
        socket.join(conversationId);
            console.log(
        `${socket.user.displayName} joined room ${conversationId}`
    );
    })

    //Gửi event "new-group" đến room có tên = userId
    socket.join(user._id.toString());

    // ====== VIDEO CALL HANDLERS ======
    
    /**
     * Caller khởi tạo cuộc gọi
     * Data: { receiverId, offer, callId, callerInfo }
     */
    socket.on("video-call:initiate", (data) => {
      const { receiverId, offer, callId, callerInfo } = data;
      const receiverSocketId = onlineUsers.get(receiverId);

      console.log(`Video call initiated from ${user._id} to ${receiverId}`);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("video-call:incoming", {
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
      const callerSocketId = onlineUsers.get(callerId);

      console.log(`Call ${callId} accepted by ${user._id}`);

      if (callerSocketId) {
        io.to(callerSocketId).emit("video-call:accepted", {
          receiverId: user._id,
          answer,
          callId,
        });
      }
    });

    /**
     * Receiver từ chối cuộc gọi
     * Data: { callerId, reason, callId }
     */
    socket.on("video-call:reject", (data) => {
      const { callerId, reason = "Người dùng từ chối", callId } = data;
      const callerSocketId = onlineUsers.get(callerId);

      console.log(`Call ${callId} rejected by ${user._id}`);

      if (callerSocketId) {
        io.to(callerSocketId).emit("video-call:rejected", {
          receiverId: user._id,
          reason,
          callId,
        });
      }
    });

    /**
     * Gửi ICE candidate
     * Data: { to, candidate, callId }
     */
    socket.on("video-call:ice-candidate", (data) => {
      const { to, candidate, callId } = data;
      const targetSocketId = onlineUsers.get(to);

      if (targetSocketId) {
        io.to(targetSocketId).emit("video-call:ice-candidate", {
          from: user._id,
          candidate,
          callId,
        });
      }
    });

    /**
     * Kết thúc cuộc gọi
     * Data: { to, callId }
     */
    socket.on("video-call:end", (data) => {
      const { to, callId } = data;
      const targetSocketId = onlineUsers.get(to);

      console.log(`Call ${callId} ended by ${user._id}`);

      if (targetSocketId) {
        io.to(targetSocketId).emit("video-call:ended", {
          from: user._id,
          callId,
        });
      }
    });

    socket.on("disconnect", ()=>{

        onlineUsers.delete(user._id);
        io.emit("online-user", Array.from(onlineUsers.keys()));
        // console.log(`socket disconnected: ${socket.id}`);
    })
})

export {io, app, server};