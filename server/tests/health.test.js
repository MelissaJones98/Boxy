// health.test.js — the first API tests (Build step 1: Setup).
//
// These prove the test tooling itself works (Jest runs, Supertest can talk to
// the app) and pin down two conventions every later route relies on:
//   1. The API speaks JSON.
//   2. Errors use the shape { error: "message" } (see "REST API" in CLAUDE.md).

// Supertest takes an Express app and sends real HTTP requests to it in memory,
// so we can check status codes and bodies without starting a server.
const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('responds 200 with { status: "ok" }', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    // toEqual compares structure, so this fails if the route adds or renames
    // any field, not just if it returns the wrong value.
    expect(res.body).toEqual({ status: 'ok' });
  });
});

describe('unknown routes', () => {
  // Without our own catch-all, Express replies with an HTML 404 page. The
  // React client calls res.json() on every response, so it would choke on that.
  it('respond 404 with a JSON error body', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not found' });
  });
});
