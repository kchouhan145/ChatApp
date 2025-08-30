import { Conversation } from "../models/conversationModel.js";
import {Message} from "../models/messageModel.js";
 
export const sendMessage = async (req,res) => {
    try {
        const senderId = req.id;
        const receiverId = req.params.id; 
        const {message} = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        let gotConversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });

        if(!gotConversation){
            gotConversation = await Conversation.create({
                participants: [senderId, receiverId],
                messages: []
            });
        }
        
        const newMessage = await Message.create({
            senderId,
            receiverId,
            message
        });

        if(newMessage){
            gotConversation.messages.push(newMessage._id);
            await gotConversation.save();
        }

        // Return the new message with all fields needed by the client
        return res.status(201).json({
            success: true,
            message: {
                _id: newMessage._id,
                senderId,
                receiverId,
                message,
                createdAt: newMessage.createdAt,
                conversationId: gotConversation._id
            }
        });
    } catch (error) {
        console.error("Error in sendMessage:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to send message"
        });
    }
}

export const gotMessage = async (req,res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.id;
        
        const conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        }).populate("messages");
        if (!conversation) {
            return res.status(200).json({
                success: true,
                messages: []
            });
        }
        return res.status(200).json({
            success: true,
            messages: conversation.messages
        });
    } catch (error) {
        console.error("Error in gotMessage:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to fetch messages"
        });
    }
}