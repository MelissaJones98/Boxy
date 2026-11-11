// src/features/auth/authSlice.js — who is logged in.
//
// PLACEHOLDER: initial state only. Step 2 adds the signup / login / logout /
// fetchMe thunks (createAsyncThunk) and the reducers that handle them.

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null, // the logged-in user from GET /api/auth/me, or null
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed', for the latest request
  error: null, // the API's { error } message from the last failed request
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
});

export default authSlice.reducer;
