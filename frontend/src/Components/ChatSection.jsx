import React, { useState, useRef, useContext, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { SocketContext } from "../App";

const ChatSection = ({ 
  selectedUser, 
  authUser,
  lastMessages,
  setLastMessages,
  loading,
  typingUsers,
  otherUsers,
  unreadCounts,
  setUnreadCounts,
  onlineUsers,
  showMobileChat,
  toggleMobileView
}) => {
  const dispatch = useDispatch();
  const messages = useSelector((store) => store.message.messages) || [];
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const socket = useContext(SocketContext);

  const getConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      
      if (isNaN(date.getTime())) {
        return timestamp.toString();
      }
      
      if (diffDays === 0) {
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      } else if (diffDays === 1) {
        return "Yesterday";
      } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: "long" });
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return timestamp?.toString() || "";
    }
  };

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  const handleTyping = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (!socket || !authUser || !selectedUser) return;
    
    const conversationId = getConversationId(authUser._id, selectedUser._id);
    
    if ((value.length === 1 && !isTyping) || (value.length === 0 && isTyping)) {
      socket.emit("typing", {
        userId: authUser._id,
        conversationId,
        isTyping: value.length > 0
      });
      
      setIsTyping(value.length > 0);
    }
  };
  
  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    try {
      const tempId = "temp_" + Date.now();
      const tempMsg = {
        _id: tempId,
        senderId: authUser._id,
        receiverId: selectedUser._id,
        message: newMessage,
        createdAt: new Date()
      };
      const conversationId = getConversationId(authUser._id, selectedUser._id);
      // Add temporary message to Redux
      dispatch({ type: "message/addMessage", payload: tempMsg });
      setLastMessages(prev => ({
        ...prev,
        [selectedUser._id]: tempMsg
      }));
      const messageToSend = newMessage;
      setNewMessage("");
      if (isTyping && socket) {
        socket.emit("typing", {
          userId: authUser._id,
          conversationId,
          isTyping: false
        });
        setIsTyping(false);
      }
      if (otherUsers && otherUsers.length > 0) {
        const updatedUsers = [...otherUsers];
        const selectedIndex = updatedUsers.findIndex(user => user._id === selectedUser._id);
        if (selectedIndex > 0) {
          const selectedUserObj = updatedUsers[selectedIndex];
          updatedUsers.splice(selectedIndex, 1);
          updatedUsers.unshift(selectedUserObj);
        }
      }
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
      const res = await axios.post(`https://chat-kartik-backend.vercel.app/api/v1/message/send/${selectedUser?._id}`, {
        message: messageToSend
      }, {
        headers: {
          "Content-Type": "application/json"
        },
        withCredentials: true
      });
      if (res.data?.message) {
        const serverMessage = res.data.message;
        // Update temporary message with server message
        dispatch({ type: "message/updateMessage", payload: { tempId, updatedMessage: { ...serverMessage, senderId: authUser._id, receiverId: selectedUser._id } } });
        setLastMessages(prev => ({
          ...prev,
          [selectedUser._id]: { ...serverMessage, senderId: authUser._id, receiverId: selectedUser._id }
        }));
        if (socket) {
          socket.emit("sendMessage", {
            senderId: authUser._id,
            conversationId: conversationId,
            message: messageToSend,
            _id: serverMessage._id,
            createdAt: serverMessage.createdAt
          });
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Error sending message");
      // Remove temporary message on error
      dispatch({ type: "message/setMessages", payload: messages.filter(msg => msg._id !== tempId && !(msg._id && msg._id.toString().startsWith("temp_"))) });
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Also scroll to bottom when selected user changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedUser]);

  return (
    <div className="flex flex-col bg-base-100 shadow-md h-full w-full overflow-hidden rounded-lg">
      {selectedUser ? (
        <>
          {/* Chat Header */}
          <div className="py-2 px-3 md:px-4 border-b flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              {showMobileChat && (
                <button 
                  onClick={() => toggleMobileView(false)} 
                  className="btn btn-ghost btn-sm btn-circle md:hidden mr-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="avatar relative">
                <div className="w-8 h-8 rounded-full">
                  <img src={selectedUser.profilePhoto} alt={selectedUser.username} />
                </div>
                {isUserOnline(selectedUser._id) && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100"></span>
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{selectedUser.fullName}</p>
                <p className="text-xs opacity-70 flex items-center gap-1">
                  @{selectedUser.username}
                  {isUserOnline(selectedUser._id) && (
                    <span className="text-xs text-success"> online</span>
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Messages */}
          <div 
            className="flex-1 overflow-y-auto px-3 py-2 md:px-4 md:py-3 flex flex-col gap-2 md:gap-3 scroll-smooth chat-messages-container" 
          >
            {loading ? (
              <div className="flex-1 flex justify-center items-center">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : Array.isArray(messages) && messages.length > 0 ? (
              messages.map(msg => {
                if (!msg || !msg._id) return null;
                
                const isSender = msg.senderId === authUser._id;
                const isTemporary = typeof msg._id === "string" && msg._id.startsWith("temp_");
                
                return (
                  <div 
                    key={msg._id} 
                    className={`chat ${isSender ? "chat-end" : "chat-start"} chat-arrow-fix`}
                    style={{position: 'relative'}}
                  >
                    <div className="chat-image avatar" style={{position: 'absolute', [isSender ? 'right' : 'left']: '0px', top: '0px'}}>
                      <div className="w-7 h-7 rounded-full">
                        <img 
                          src={isSender
                            ? authUser.profilePhoto 
                            : selectedUser.profilePhoto} 
                          alt="avatar" 
                        />
                      </div>
                    </div>
                    <div 
                      className={`chat-bubble ${isSender ? "chat-bubble-primary" : "bg-base-200"} py-2 px-3 min-h-0 ${isTemporary ? "opacity-70" : ""} shadow-sm`}
                      style={{marginTop: '2px', [isSender ? 'marginRight' : 'marginLeft']: '2.5rem'}}
                    >
                      {msg.message}
                      {isTemporary && (
                        <span className="ml-2 inline-block">
                          <span className="loading loading-spinner loading-xs"></span>
                        </span>
                      )}
                    </div>
                    <div className="chat-footer opacity-70 text-xs flex items-center gap-1" style={{[isSender ? 'marginRight' : 'marginLeft']: '2.5rem'}}>
                      {formatMessageTime(msg.createdAt)}
                      {isSender && (
                        <span className={isTemporary ? "hidden" : ""}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M4.5 12.75l6 6 9-13.5-1.5-1.5L10.5 15.75l-4.5-4.5L4.5 12.75z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col">
                <div className="bg-base-200 rounded-full p-4 mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="font-medium text-base">No messages yet</p>
                <p className="opacity-70 text-sm mt-1">Send a message to start the conversation with {selectedUser.fullName}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Message Input */}
          <div className="p-3 md:p-4 border-t flex-shrink-0">
            <form 
              onSubmit={handleMessageSubmit} 
              className="flex items-center gap-2 md:gap-3"
            >
              <button 
                type="button" 
                className="btn btn-circle btn-ghost btn-sm" 
                onClick={()=>{toast.info(`This function is not implemented yet. Sorry @${authUser.username}`)}}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  className="input input-bordered w-full h-10 text-sm" 
                  placeholder="Type your message here..." 
                  value={newMessage}
                  onChange={handleTyping}
                />
                {typingUsers && typingUsers.length > 0 && (
                  <div className="absolute -top-10 left-0 text-xs opacity-70 flex items-center">
                    <span className="loading loading-dots loading-xs mr-1 mt6"></span>
                    {typingUsers.length === 1 ? "Typing..." : `${typingUsers.length} people typing...`}
                  </div>
                )}
              </div>
              <button type="button" className="btn btn-circle btn-ghost btn-sm hidden sm:flex">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button type="submit" className="btn btn-primary h-10">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                <span className="hidden sm:inline ml-1">Send</span>
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col p-4 md:p-6 overflow-hidden">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-primary/10 flex items-center justify-center mb-4 md:mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary opacity-60" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg>
          </div>
          <h3 className="text-lg md:text-xl font-semibold text-center mb-1">Welcome to ChatApp</h3>
          <p className="text-xs md:text-sm opacity-70 text-center max-w-md mb-3">
            Select a conversation from the list or start a new chat by searching for users.
          </p>
          <button 
            className="btn btn-primary btn-sm md:btn-md"
            onClick={() => {
              if (showMobileChat) {
                toggleMobileView(false);
              }
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Start New Chat
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatSection;
