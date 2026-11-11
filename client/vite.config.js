// client/vite.config.js — settings for the Vite dev server and production build.
// (Jest doesn't use this file; see jest.config.cjs and babel.config.cjs.)

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // During development the React app runs on http://localhost:5173 and the
    // API on http://localhost:3001. The proxy forwards any request starting
    // with /api to the API, so the client can just call fetch('/api/boxes').
    //
    // That keeps the browser on ONE origin, which means:
    //  - session cookies work without cross-site cookie settings
    //  - no CORS errors in development
    //  - the same relative URLs work in tests (MSW) and in production
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
