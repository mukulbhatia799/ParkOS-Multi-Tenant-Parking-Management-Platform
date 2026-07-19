import { io, Socket } from "socket.io-client";

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || "http://localhost:4010";

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (socket) {
    socket.disconnect();
  }

  socket = io(REALTIME_URL, {
    auth: { token },
    transports: ["websocket"],
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
