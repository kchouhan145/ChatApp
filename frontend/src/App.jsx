import './App.css'
import { NavLink, createBrowserRouter, RouterProvider } from 'react-router-dom';
import SignUp from './Components/SignUp'
import HomePage from './Components/HomePage';
import Login from './Components/Login';
import {Toaster} from 'sonner';
import { useSelector } from 'react-redux';
import { useEffect, useState, createContext, useRef } from 'react';
import io from 'socket.io-client'

// Create a socket context to provide socket to all components
export const SocketContext = createContext(null);

// Create context for online users
export const OnlineUsersContext = createContext([]);

function App() {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const {authUser} = useSelector(store=>store.user);
  const socketRef = useRef(null);
  
  useEffect(() => {
    // Clear any existing socket connection
    if (socketRef.current) {
      console.log('Disconnecting existing socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if(authUser){
      console.log("Attempting to create socket connection...");
      // Create socket connection
      try {
  const socketInstance = io("https://dczone.onrender.com", {
          withCredentials: true,
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          transports: ['websocket', 'polling'],
          autoConnect: true
        });
        
        socketRef.current = socketInstance;
        
        // Socket connection events
        socketInstance.on('connect', () => {
          console.log('Socket connected with ID:', socketInstance.id);
          
          // Join with user ID after connection
          socketInstance.emit('join', { userId: authUser._id });
        });
        
        // Handle online users updates
        socketInstance.on('onlineUsers', (users) => {
          console.log('Online users received:', users);
          setOnlineUsers(users);
        });
        
        // Handle individual user status updates
        socketInstance.on('userStatus', ({ userId, status }) => {
          console.log(`User ${userId} is now ${status}`);
          
          if (status === 'online' && !onlineUsers.includes(userId)) {
            setOnlineUsers(prev => [...prev, userId]);
          } else if (status === 'offline') {
            setOnlineUsers(prev => prev.filter(id => id !== userId));
          }
        });
        
        socketInstance.on('disconnect', () => {
          console.log('Socket disconnected');
        });
        
        socketInstance.on('connect_error', (err) => {
          console.error('Socket connection error:', err.message);
        });
        
        // Set socket in state for context
        setSocket(socketInstance);
        
      } catch (error) {
        console.error("Error creating socket connection:", error);
      }
    } else {
      // Reset online users when logged out
      setOnlineUsers([]);
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket on cleanup');
        if (authUser) {
          socketRef.current.emit('logout', { userId: authUser._id });
        }
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [authUser]); // Depend on authUser to reconnect if auth changes

  const router = createBrowserRouter([
    {
      path: "/",
      element: authUser ? <HomePage/> : <Login/>
    },
    {
      path:"/signup",
      element:<SignUp/>
    },
    {
      path:"/login",
      element:<Login/>
    }
  ]);

  return (
    <SocketContext.Provider value={socket}>
      <OnlineUsersContext.Provider value={onlineUsers}>
        <div className='h-screen'>
          <RouterProvider router={router} />
          <Toaster/>
        </div>
      </OnlineUsersContext.Provider>
    </SocketContext.Provider>
  );
}

// function App() {
//   return (
//     <div className='h-screen'>
//       <RouterProvider router={router} />
//       <Toaster/>
//     </div>
//   );
// }

export default App
