// src/main.jsx — the browser entry point (loaded by index.html).
// It finds the #root div and tells React to render the app into it.
// Tests never import this file; they use src/test/renderWithProviders.jsx.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App.jsx';
import { setupStore } from './store';

// The app's one real store. Tests make their own with setupStore().
const store = setupStore();

createRoot(document.getElementById('root')).render(
  // StrictMode only affects development: it runs some code twice on purpose
  // to surface bugs (like effects that don't clean up). It adds nothing to
  // the production build.
  <StrictMode>
    {/* Provider makes the store available to every component, through
        useSelector (read state) and useDispatch (send actions). */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
