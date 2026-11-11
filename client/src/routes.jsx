// src/routes.jsx — every URL in the app and the screen it shows.
//
// This is a plain array (not <Routes> JSX inside App) so the SAME table can be
// used by two routers:
//   - the app:   createBrowserRouter(routes) in App.jsx, which uses the real address bar
//   - the tests: createMemoryRouter(routes, { initialEntries: ['/boxes'] }),
//                which starts on any URL (see src/test/renderWithProviders.jsx)
//
// Screens are placeholders until each build step replaces one with the real
// component. ProtectedRoute (logged-out users → /login) wraps the /boxes and
// /items routes in Step 2.

// Components live in their own files (src/pages/), not here. Vite's fast
// refresh only hot-reloads files that export nothing but components.
import NotFoundPage from './pages/NotFoundPage';
import Placeholder from './pages/Placeholder';

export const routes = [
  { path: '/', element: <Placeholder title="Boxy" /> },
  { path: '/signup', element: <Placeholder title="Sign up" /> },
  { path: '/login', element: <Placeholder title="Log in" /> },
  { path: '/boxes', element: <Placeholder title="My Boxes" /> },
  { path: '/boxes/new', element: <Placeholder title="New box" /> },
  // ":boxId" is a URL parameter. A screen reads it with useParams(), so
  // /boxes/7 gives { boxId: '7' } (always a string).
  { path: '/boxes/:boxId', element: <Placeholder title="Box" /> },
  { path: '/boxes/:boxId/edit', element: <Placeholder title="Edit box" /> },
  { path: '/boxes/:boxId/items/new', element: <Placeholder title="Add item" /> },
  { path: '/items/:itemId', element: <Placeholder title="Item" /> },
  { path: '/items/:itemId/edit', element: <Placeholder title="Edit item" /> },
  // Catch-all: "*" matches any URL that no route above matched. It's the
  // client-side twin of the Express 404 handler in server/src/app.js. Unlike
  // Express, React Router picks the BEST match rather than the first, so this
  // entry could go anywhere in the list. It's last so it reads like the server's.
  { path: '*', element: <NotFoundPage /> },
];

// Opt in to React Router v7's behaviour now. Without these, v6.30 logs a
// "Future Flag Warning" for each one in the console (and in every test run).
export const routerFuture = {
  v7_relativeSplatPath: true,
  v7_fetcherPersist: true,
  v7_normalizeFormMethod: true,
  v7_partialHydration: true,
  v7_skipActionErrorRevalidation: true,
};
