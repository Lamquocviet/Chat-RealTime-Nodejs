import {create} from "zustand";
import {io, type Socket } from "socket.io-client";
import type {SocketState} from "@/types/store";
import { useAuthStore } from "./useAuthStore";

const baseURL = import.meta.env.VITE_SOCKET_URL;

export const useSocketStore = create<SocketState>((set, get)=>({
    socket: null,
    connectSocket: ()=>{
        const accessToken = useAuthStore.getState().accessToken;
        const existingSocket = get().socket;

        if(existingSocket)
            return;
        
        const socket: Socket = io(baseURL, {
            auth: {token: accessToken},
            transports: ["websocket"]
        });

        set({socket});

        socket.on("connect", ()=>{
            console.log("Đã kết nối socket");
        })


    },
    disconnectSocket: ()=>{
        const socket = get().socket;
        if(socket)
        {
            socket.disconnect();
            set({socket: null});
        }
    }
})

)