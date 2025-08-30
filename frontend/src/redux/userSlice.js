import {createSlice} from '@reduxjs/toolkit';
import { act } from 'react';


const userSlice = createSlice({
    name:"user",
    initialState:{
        authUser:null,
        otherUsers:null,
        selectedUser:null,
    },
    reducers:{
        setAuthUser:(state,action)=>{
            state.authUser = action.payload;
        },
        setOtherUsers:(state,action)=>{
            state.otherUsers = action.payload;
        },
        setSelectedUsers: (state,action) =>{
            state.selectedUser = action.payload;
        }
    }
});

export const {setAuthUser,setOtherUsers,setSelectedUsers} = userSlice.actions;
export default userSlice.reducer;