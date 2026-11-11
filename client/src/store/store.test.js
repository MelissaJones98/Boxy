// src/store/store.test.js — the Redux store is created with the three slices
// CLAUDE.md plans: auth, boxes and items.
//
// The slices are placeholders for now (initial state only). Their reducers
// and thunks are built test-first in Steps 2 (auth), 3 (boxes) and 4 (items).

import { setupStore } from './index';

describe('setupStore', () => {
  it('creates a store with auth, boxes and items slices', () => {
    const state = setupStore().getState();

    expect(Object.keys(state).sort()).toEqual(['auth', 'boxes', 'items']);
  });

  it('starts with nobody logged in', () => {
    expect(setupStore().getState().auth.user).toBeNull();
  });

  it('creates a fresh store every call, so tests cannot share state', () => {
    // A single shared store would let one test's logged-in user leak into the
    // next. Each test calls setupStore() (via renderWithProviders) instead.
    expect(setupStore()).not.toBe(setupStore());
  });

  it('accepts preloaded state, for rendering a screen in a given situation', () => {
    const user = { id: 1, email: 'sam@example.com', displayName: 'Sam' };

    const state = setupStore({ auth: { user, status: 'idle', error: null } }).getState();

    expect(state.auth.user).toEqual(user);
  });
});
