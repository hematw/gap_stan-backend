import { Server as IOServer } from "socket.io";

let io = null
const onlineUsersSockets = {}

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];

export default function initSocket(server) {
    const io = new IOServer(server, {
        cors: { origin: allowedOrigins },
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join", (userId) => {
            onlineUsersSockets[userId] = socket;
        })

        socket.on("message", (msg) => {
            console.log("Message received:", msg);
            socket.broadcast.emit("message", msg); // Broadcast to all
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

}

export { io }