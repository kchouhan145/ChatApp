import express from 'express';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import userRoute from './routes/userRoute.js';
import messageRoute from './routes/messageRoute.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import createSocketServer from './socket/socket.js';

dotenv.config({});
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(cookieParser());
const corsOption={
    origin:'http://localhost:5173',
    credentials:true
}
app.use(cors(corsOption));

app.use("/api/v1/user",userRoute);
app.use("/api/v1/message",messageRoute);

// Create Socket.IO server
const { server } = createSocketServer(app);

// Start the server with both HTTP and WebSocket support
server.listen(PORT, () => {
    connectDB();
    console.log(`Server listening at port ${PORT} with Socket.IO enabled`);
});

