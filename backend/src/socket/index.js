import http from "http";
import express from "express";
import {Server} from "socket.io";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        credentials: true,
    }
})


io.on("connection", async (socket) =>{
    console.log(`socket connected: ${socket.id}`);

    socket.on("disconnected", ()=>{
        console.log(`socket disconected: ${socket.id}`);
    })
})

export {io, app, server};