// src/test/handlers.js — the mock API that component tests talk to.
//
// MSW (Mock Service Worker) intercepts fetch() calls in tests and answers them
// with these handlers, so client tests never need the real Express server or
// database running. Each handler copies a response the real API gives, so the
// server tests and these mocks describe the same contract.
//
// These are the DEFAULT (happy-path) responses. A single test can override one
// for a specific case, e.g. making /api/auth/login return 401:
//
//   server.use(http.post('/api/auth/login', () =>
//     HttpResponse.json({ error: 'Invalid email or password' }, { status: 401 })));
//
// Overrides last only for that test (see resetHandlers() in setupTests.js).

import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mirrors server/src/app.js: GET /api/health → 200 { status: 'ok' }
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
];
