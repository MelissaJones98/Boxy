// src/main.jsx — the browser entry point (loaded by index.html).
// It finds the #root div and tells React to render the app into it.
// Tests never import this file; they render <App /> (or smaller components) directly.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  // StrictMode only affects development: it runs some code twice on purpose
  // to surface bugs (like effects that don't clean up). It adds nothing to
  // the production build.
  <StrictMode>
    <App />
  </StrictMode>,
);
