import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  uid: '',
  name: '',
  email: '',
  profile_pic: '',
  voiceData: {},
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.email = action?.payload?.email;
    },
    setVoiceData: (state, action) => {
      state.voiceData = action.payload;
    },
    logout: (state, action) => {
      state.uid = '';
      state.name = '';
      state.email = '';
      state.profile_pic = '';
    },
  },
});

// Action creators are generated for each case reducer function
export const {setUser, logout, setVoiceData} = userSlice.actions;

export default userSlice.reducer;
