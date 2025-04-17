import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import cors from "cors";
import connectDB from "./db/connect.js";
import initSocket from "./utils/socket.js";

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("Welcome to the chat app API!");
});


const server = http.createServer(app);
const io = initSocket(server)

const port = process.env.PORT || 3000;

server.listen(port, async () => {
  await connectDB(process.env.MONGO_URI);
  console.log(`🚀 Server & WebSocket running on port ${port}!`);
});

