import { Server } from 'socket.io';
import http from 'http';

// Keep track of connected users
const connectedUsers = new Map(); // userId -> socketId
const userSockets = new Map();    // socketId -> userId
const typingUsers = new Map();    // conversationId -> Set of typing userIds

const createSocketServer = (app) => {
    const server = http.createServer(app);
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:5173",
            methods: ["GET", "POST"],
            credentials: true
        },
        pingTimeout: 60000,
    });

    io.on('connection', (socket) => {
        console.log(`User connected with socket ID: ${socket.id}`);

        // Handle user joining with their ID
        socket.on('join', (data) => {
            const { userId } = data;
            if (userId) {
                console.log(`User ${userId} joined with socket ${socket.id}`);
                
                // Store user connection info
                connectedUsers.set(userId, socket.id);
                userSockets.set(socket.id, userId);
                
                // Notify all clients about online users
                io.emit('userStatus', { userId, status: 'online' });
                io.emit('onlineUsers', Array.from(connectedUsers.keys()));
                
                // Log the current online users
                console.log('Current online users:', Array.from(connectedUsers.keys()));
            }
        });

        // Handle conversation joining
        socket.on('joinConversation', (conversationId) => {
            if (conversationId) {
                socket.join(conversationId);
                console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
            }
        });

        // Handle conversation leaving
        socket.on('leaveConversation', (conversationId) => {
            if (conversationId) {
                socket.leave(conversationId);
                console.log(`Socket ${socket.id} left conversation: ${conversationId}`);
                
                // Remove from typing users if they were typing
                const userId = userSockets.get(socket.id);
                if (userId && typingUsers.has(conversationId)) {
                    const typingSet = typingUsers.get(conversationId);
                    if (typingSet.has(userId)) {
                        typingSet.delete(userId);
                        io.to(conversationId).emit('typingStatus', {
                            conversationId,
                            typingUsers: Array.from(typingSet)
                        });
                    }
                }
            }
        });

        // Handle private messages
        socket.on('sendMessage', (data) => {
            const { senderId, conversationId, message, _id, createdAt } = data;
            console.log(`Message in conversation ${conversationId} from ${senderId}: ${message}`);
            
            // Broadcast to everyone in the conversation including sender for confirmation
            io.to(conversationId).emit('newMessage', {
                senderId,
                conversationId,
                message,
                _id,
                createdAt
            });
            
            // Remove user from typing status if they were typing
            if (typingUsers.has(conversationId) && typingUsers.get(conversationId).has(senderId)) {
                const typingSet = typingUsers.get(conversationId);
                typingSet.delete(senderId);
                io.to(conversationId).emit('typingStatus', {
                    conversationId,
                    typingUsers: Array.from(typingSet)
                });
            }
        });

        // Handle typing status
        socket.on('typing', (data) => {
            const { userId, conversationId, isTyping } = data;
            
            if (!typingUsers.has(conversationId)) {
                typingUsers.set(conversationId, new Set());
            }
            
            const typingSet = typingUsers.get(conversationId);
            
            if (isTyping) {
                typingSet.add(userId);
            } else {
                typingSet.delete(userId);
            }
            
            // Broadcast typing status to conversation members
            socket.to(conversationId).emit('typingStatus', {
                conversationId,
                typingUsers: Array.from(typingSet)
            });
        });

        // Handle user online status updates (for reconnections)
        socket.on('userOnline', (data) => {
            const { userId } = data;
            if (userId) {
                connectedUsers.set(userId, socket.id);
                userSockets.set(socket.id, userId);
                
                // Notify all clients about updated online users
                io.emit('userStatus', { userId, status: 'online' });
                io.emit('onlineUsers', Array.from(connectedUsers.keys()));
                
                console.log(`User ${userId} is now online (status update)`);
            }
        });

        // Handle manual logout
        socket.on('logout', (data) => {
            const { userId } = data;
            if (userId) {
                console.log(`User ${userId} logged out`);
                
                // Remove user from connected users
                connectedUsers.delete(userId);
                userSockets.delete(socket.id);
                
                // Notify others this user is offline
                io.emit('userStatus', { userId, status: 'offline' });
                io.emit('onlineUsers', Array.from(connectedUsers.keys()));
            }
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            console.log(`Socket ${socket.id} disconnected`);
            
            // Find which user this socket belonged to
            const userId = userSockets.get(socket.id);
            
            if (userId) {
                // Remove user from connected users
                connectedUsers.delete(userId);
                userSockets.delete(socket.id);
                
                // Notify others this user is offline
                io.emit('userStatus', { userId, status: 'offline' });
                io.emit('onlineUsers', Array.from(connectedUsers.keys()));
                
                console.log(`User ${userId} is now offline`);
            }
        });
    });

    return { io, server };
};

export default createSocketServer;