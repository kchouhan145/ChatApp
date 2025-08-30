import axios from 'axios'
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
// import { toast } from 'sonner'
import { setMessages } from '../redux/messageSlice'
const useGetMessages = () => {
    const { selectedUser } = useSelector(store => store.user);
    const dispatch = useDispatch();
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                axios.defaults.withCredentials = true;
                console.log(selectedUser);
                const res = await axios.get(`http://localhost:8080/api/v1/message/${selectedUser?._id}`);
                console.log(res);
                dispatch(setMessages(res.data.messages));
            } catch (error) {
                console.log(error.message || "Failed to fetch messages");
            }
        };
        fetchMessages();
    }, [selectedUser]);
}

export default useGetMessages
