import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import userRoute from './routes/userRoute.js';
import messageRoute from './routes/messageRoute.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import createSocketServer from './socket/socket.js';
import path from 'path'

dotenv.config({});
const app = express();
const PORT = process.env.PORT || 8080;

const _dirname = path.resolve();

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
const corsOption = {
  origin: [
    "http://localhost:5173",   // if using Vite
    "http://localhost:3000",   // if using CRA
    "http://localhost:8080",   // your local test port
    "https://dczone.onrender.com" // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
};
app.use(cors(corsOption));

app.use("/api/v1/user",userRoute);
app.use("/api/v1/message", messageRoute);

app.use(express.static(path.join(_dirname,"/frontend/dist")));
app.get("*",(req,res)=>{
    res.sendFile(path.resolve(_dirname,"frontend","dist","index.html"));
})

// Create Socket.IO server
const { server } = createSocketServer(app);

// Start the server with both HTTP and WebSocket support
server.listen(PORT, () => {
    connectDB();
    console.log(`Server listening at port ${PORT} with Socket.IO enabled`);
});

