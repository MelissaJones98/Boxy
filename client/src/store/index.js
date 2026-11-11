// src/store/index.js — builds the Redux store from the feature slices.
//
// It exports a FUNCTION (setupStore) rather than one ready-made store. The app
// calls it once (src/main.jsx), and every test calls it again to get a fresh,
// isolated store, optionally preloaded with whatever state the test needs.

import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import boxesReducer from '../features/boxes/boxesSlice';
import itemsReducer from '../features/items/itemsSlice';

// The shape of the whole state: state.auth, state.boxes, state.items.
const rootReducer = combineReducers({
  auth: authReducer,
  boxes: boxesReducer,
  items: itemsReducer,
});

/**
 * @param {object} [preloadedState]  Starting state; slices you leave out use
 *                                   their own initialState.
 */
export function setupStore(preloadedState) {
  // configureStore adds Redux DevTools support and the thunk middleware (which
  // createAsyncThunk needs), and in development warns about common mistakes
  // like mutating state outside a reducer.
  return configureStore({ reducer: rootReducer, preloadedState });
}
