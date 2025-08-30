import React, { useState, useEffect, useContext, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { SocketContext, OnlineUsersContext } from "../App";
import ChatSection from "./ChatSection";
import useGetOtherUsers from "../hooks/useGetOtherUsers";
import { setSelectedUsers } from "../redux/userSlice";
import { setMessages, addMessage, updateMessage } from "../redux/messageSlice";

const HomePage = () => {
  // Redux
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { authUser, otherUsers, selectedUser } = useSelector((store) => store.user);
  const { messages } = useSelector((store) => store.message);

  // Socket context
  const socket = useContext(SocketContext);
  const onlineUsers = useContext(OnlineUsersContext);

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Fetch other users
  useGetOtherUsers();

  // Socket handlers for real-time features
  useEffect(() => {
    if (!socket) return;

    // Join conversation when a user is selected
    if (selectedUser) {
      const conversationId = getConversationId(authUser._id, selectedUser._id);
      socket.emit("joinConversation", conversationId);

      // Reset unread count for selected user
      setUnreadCounts((prev) => ({
        ...prev,
        [selectedUser._id]: 0,
      }));
    }

    // Handle new incoming messages
    const handleNewMessage = (data) => {
      const { senderId, conversationId, message, _id, createdAt } = data;
      
      // If message is from someone other than current user
      if (senderId !== authUser._id) {
        const otherUserId = conversationId
          .split("_")
          .find((id) => id !== authUser._id);
        
        // Update last message
        setLastMessages((prev) => ({
          ...prev,
          [otherUserId]: {
            _id,
            senderId,
            receiverId: authUser._id,
            message,
            createdAt,
          },
        }));

        // Update unread counts if not currently viewing this conversation
        if (!selectedUser || selectedUser._id !== otherUserId) {
          setUnreadCounts((prev) => ({
            ...prev,
            [otherUserId]: (prev[otherUserId] || 0) + 1,
          }));
        }

        // If this is from the selected user, add to messages
        if (selectedUser && otherUserId === selectedUser._id) {
          // Use addMessage action to properly append the new message
          dispatch({
            type: "message/addMessage",
            payload: {
              _id,
              senderId,
              receiverId: authUser._id,
              message,
              createdAt,
            }
          });
        }
      }
    };

    // Handle typing status updates
    const handleTypingStatus = (data) => {
      const { conversationId, typingUsers: typing } = data;
      
      // Filter out current user from typing users
      const filteredTyping = typing.filter(id => id !== authUser._id);
      setTypingUsers(filteredTyping);
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("typingStatus", handleTypingStatus);

    // Clean up event listeners
    return () => {
      if (socket) {
        socket.off("newMessage", handleNewMessage);
        socket.off("typingStatus", handleTypingStatus);
        
        if (selectedUser) {
          const conversationId = getConversationId(authUser._id, selectedUser._id);
          socket.emit("leaveConversation", conversationId);
        }
      }
    };
  }, [socket, selectedUser, authUser]);

  // Fetch messages when selected user changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;
      
      setLoading(true);
      try {
        const res = await axios.get(
          `http://localhost:8080/api/v1/message/${selectedUser._id}`,
          {
            withCredentials: true,
          }
        );
        
        setMessages(res.data.messages || []);
        
        // Reset unread count for this user
        setUnreadCounts(prev => ({
          ...prev,
          [selectedUser._id]: 0
        }));
      } catch (error) {
        toast.error("Failed to fetch messages");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  // Fetch last messages for all users
  useEffect(() => {
    const fetchLastMessages = async () => {
      if (!otherUsers || otherUsers.length === 0) return;
      
      try {
        // In a real app, you might have an API endpoint to get last messages
        // For now, we'll initialize an empty object
        const lastMsgs = {};
        setLastMessages(lastMsgs);
      } catch (error) {
        console.error("Failed to fetch last messages:", error);
      }
    };

    fetchLastMessages();
  }, [otherUsers]);

  // Helper function to get conversation ID
  const getConversationId = (userId1, userId2) => {
    return [userId1, userId2].sort().join("_");
  };

  // Handle user selection
  const handleSelectUser = (user) => {
    dispatch(setSelectedUsers(user));
    setShowMobileChat(true);
  };

  // Handle user search
  const filteredUsers = otherUsers
    ? otherUsers.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle logout
  const handleLogout = async () => {
    try {
      if (socket) {
        socket.emit("logout", { userId: authUser._id });
      }
      
      await axios.get("http://localhost:8080/api/v1/user/logout", {
        withCredentials: true,
      });
      
      // Clear auth user from Redux store
      dispatch({ type: "user/setAuthUser", payload: null });
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
      console.error(error);
    }
  };

  // Messages state setter to pass to ChatSection
  const setMessages = (messagesOrUpdater) => {
    if (typeof messagesOrUpdater === 'function') {
      const updatedMessages = messagesOrUpdater(messages || []);
      dispatch({ 
        type: "message/setMessages", 
        payload: updatedMessages
      });
    } else {
      dispatch({ type: "message/setMessages", payload: messagesOrUpdater });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-base-200">
      {/* Header */}
      <header className="bg-[#5754E8] shadow-sm z-10">
        <div className="navbar container mx-auto px-4 h-16">
          <div className="navbar-start">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-white">ChatApp</span>
            </h1>
          </div>
          <div className="navbar-end flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="font-medium text-white">{authUser?.fullName}</span>
              <span className="text-xs opacity-80 text-white">@{authUser?.username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="btn btn-error btn-sm flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
            <div className="avatar ml-2">
              <div className="w-10 rounded-full">
                <img alt={authUser?.username} src={authUser?.profilePhoto} />
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto p-4 flex gap-4 overflow-hidden">
        {/* Users List - Hidden on mobile when chat is shown */}
        <div className={`bg-base-100 rounded-lg shadow-md w-full md:w-1/3 flex flex-col overflow-hidden ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                className="input input-bordered w-full pr-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute top-3 right-3 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const isUserOnline = onlineUsers.includes(user._id);
                const lastMessage = lastMessages[user._id];
                const unreadCount = unreadCounts[user._id] || 0;
                
                return (
                  <div
                    key={user._id}
                    className={`flex items-center gap-3 p-3 border-b cursor-pointer transition-colors hover:bg-base-200 ${
                      selectedUser?._id === user._id ? "bg-base-200" : ""
                    }`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="avatar relative">
                      <div className="w-12 h-12 rounded-full">
                        <img src={user.profilePhoto} alt={user.username} />
                      </div>
                      {isUserOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-100"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{user.fullName}</p>
                        {lastMessage && (
                          <span className="text-xs opacity-60">
                            {formatTime(lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm opacity-70 truncate">
                          {typingUsers.includes(user._id) ? (
                            <span className="text-primary">Typing...</span>
                          ) : lastMessage ? (
                            lastMessage.message
                          ) : (
                            `@${user.username}`
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="badge badge-sm badge-primary">{unreadCount}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center opacity-70">
                {searchQuery
                  ? "No users found matching your search"
                  : "No users available"}
              </div>
            )}
          </div>
        </div>

        {/* Chat Section - Full width on mobile when shown */}
        <div className={`md:flex-1 w-full ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          <ChatSection
            selectedUser={selectedUser}
            authUser={authUser}
            messages={messages || []}
            setMessages={setMessages}
            lastMessages={lastMessages}
            setLastMessages={setLastMessages}
            loading={loading}
            typingUsers={typingUsers}
            otherUsers={otherUsers}
            unreadCounts={unreadCounts}
            setUnreadCounts={setUnreadCounts}
            onlineUsers={onlineUsers}
            showMobileChat={showMobileChat}
            toggleMobileView={setShowMobileChat}
          />
        </div>
      </main>
    </div>
  );
};

// Helper function to format time
const formatTime = (timestamp) => {
  if (!timestamp) return "";
  
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (isNaN(date.getTime())) {
      return "";
    }
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  } catch (error) {
    return "";
  }
};

export default HomePage;
