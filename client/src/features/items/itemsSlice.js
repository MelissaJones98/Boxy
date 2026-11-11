// src/features/items/itemsSlice.js — items, and the item currently open.
//
// PLACEHOLDER: initial state only. Step 4 adds thunks for each item endpoint;
// Steps 6 and 7 add transfer and photo upload / removal.

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  current: null, // the item from GET /api/items/:itemId, with its photo
  status: 'idle',
  error: null,
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {},
});

export default itemsSlice.reducer;
