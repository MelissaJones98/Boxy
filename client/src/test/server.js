// src/test/server.js — the MSW "server" used in Jest.
//
// In a browser, MSW works through a service worker. In Jest (Node) there's no
// service worker, so setupServer patches Node's networking instead. Either
// way, fetch('/api/...') is answered by our handlers.
//
// Tests import this to add per-test overrides with server.use(...).

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
