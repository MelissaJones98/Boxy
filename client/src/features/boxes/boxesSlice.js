// src/features/boxes/boxesSlice.js — the user's boxes.
//
// PLACEHOLDER: initial state only. Step 3 adds thunks for each box endpoint
// (list, create, view, edit, delete) and Step 5 adds lock / unlock.

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  list: [], // boxes from GET /api/boxes, each with its item count
  status: 'idle',
  error: null,
};

const boxesSlice = createSlice({
  name: 'boxes',
  initialState,
  reducers: {},
});

export default boxesSlice.reducer;
