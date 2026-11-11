// src/test/renderWithProviders.jsx — render the app (or part of it) the way it
// really runs: inside the Redux store and the router.
//
// Usage:
//   renderWithProviders({ route: '/boxes' });                // a whole screen, by URL
//   renderWithProviders({ route: '/boxes', preloadedState }); // ...with a logged-in user, etc.
//
// It uses a MemoryRouter (the URL lives in memory, not the address bar), so
// each test can start on any path without touching window.location.

import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes, routerFuture } from '../routes';
import { setupStore } from '../store';

/**
 * @param {object} [options]
 * @param {string} [options.route='/']     The URL to start on.
 * @param {object} [options.preloadedState] Initial Redux state (e.g. a logged-in user).
 * @param {object} [options.store]          A store to use instead of a fresh one.
 * @returns RTL's render result, plus `store` and `router` so tests can inspect
 *          state (store.getState()) or the current URL (router.state.location).
 */
export function renderWithProviders({
  route = '/',
  preloadedState,
  store = setupStore(preloadedState),
} = {}) {
  const router = createMemoryRouter(routes, { initialEntries: [route], future: routerFuture });

  const result = render(
    <Provider store={store}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </Provider>,
  );

  return { ...result, store, router };
}
