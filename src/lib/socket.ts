import { io } from "socket.io-client";

// Connect in the browser only, after /api/socket has initialized the server.
export const socket = io({ path: "/api/socket", autoConnect: false });
