/**
 * Socket.io singleton client — ProjectMaster
 *
 * Usage:
 *   import { getSocket, disconnectSocket } from './socket';
 *   const socket = getSocket();
 *   socket.on('notification:new', (data) => { ... });
 *   socket.on('task:updated', (data) => { ... });
 */

import { io } from "socket.io-client";

const SERVER_URL = "http://localhost:5000";

let socketInstance = null;

/**
 * Lấy socket đã kết nối (lazy singleton).
 * Tự động reconnect nếu bị mất kết nối.
 */
export const getSocket = () => {
    if (socketInstance && socketInstance.connected) {
        return socketInstance;
    }

    const token = localStorage.getItem("token");
    if (!token) return null;

    // Tắt socket cũ nếu tồn tại
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }

    socketInstance = io(SERVER_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
        timeout: 10000
    });

    socketInstance.on("connect", () => {
        console.log("🔌 Socket connected:", socketInstance.id);
    });

    socketInstance.on("disconnect", (reason) => {
        console.log("🔌 Socket disconnected:", reason);
    });

    socketInstance.on("connect_error", (err) => {
        console.warn("Socket connect error:", err.message);
    });

    return socketInstance;
};

/**
 * Ngắt kết nối socket (gọi khi logout)
 */
export const disconnectSocket = () => {
    if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
    }
};

export default getSocket;
