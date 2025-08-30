import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
    name:"message",
    initialState:{
        messages:null,
    },
    reducers:{
        setMessages:(state,action) => {
            state.messages = action.payload;
        },
        addMessage:(state,action) => {
            if (!state.messages) {
                state.messages = [action.payload];
            } else {
                state.messages = [...state.messages, action.payload];
            }
        },
        updateMessage:(state,action) => {
            const { tempId, updatedMessage } = action.payload;
            if (state.messages) {
                state.messages = state.messages.map(msg => 
                    msg._id === tempId ? updatedMessage : msg
                );
            }
        }
    }
});

export const {setMessages, addMessage, updateMessage} = messageSlice.actions;
export default messageSlice.reducer;