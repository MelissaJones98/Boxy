// src/App.jsx — the root component: wires the route table to the real browser URL.
// The Redux <Provider> wraps App in src/main.jsx, so App itself stays small.

import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes, routerFuture } from './routes';

// Created once, outside the component, so re-rendering App never rebuilds the
// router (which would reset the current page).
const router = createBrowserRouter(routes, { future: routerFuture });

function App() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export default App;
