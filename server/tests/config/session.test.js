// tests/config/session.test.js — login sessions (Build step 2, ticket 2.1).
//
// How sessions work: when a user logs in, express-session creates a session
// on the SERVER (a row in the `session` table) and sends the browser a cookie
// holding only that session's random ID. On every later request the browser
// sends the cookie back, and the server looks the session up to know who it is.
//
// Two groups of tests:
//   1. getSessionOptions(env): the settings, unit-tested with fake environments.
//   2. createSessionMiddleware(): the real middleware on a tiny throwaway
//      Express app, checking the actual cookie and the Postgres round trip.

const express = require('express');
const request = require('supertest');
const db = require('../../src/db');
const { resetDb } = require('../helpers/resetDb');
const { getSessionOptions, createSessionMiddleware } = require('../../src/config/session');

const SECRET = 'a-test-secret-that-is-long-enough';

beforeEach(resetDb);
afterAll(() => db.pool.end());

describe('getSessionOptions', () => {
  const env = (overrides) => ({ NODE_ENV: 'test', SESSION_SECRET: SECRET, ...overrides });

  it('throws when SESSION_SECRET is missing', () => {
    // The secret signs the cookie so it can't be forged. Running without one
    // must be impossible, rather than silently falling back to a known value.
    expect(() => getSessionOptions({ NODE_ENV: 'development' })).toThrow(/SESSION_SECRET/);
  });

  it('signs cookies with SESSION_SECRET', () => {
    expect(getSessionOptions(env()).secret).toBe(SECRET);
  });

  it('names the cookie boxy.sid rather than the default connect.sid', () => {
    // The default name tells anyone looking that the server runs Express.
    expect(getSessionOptions(env()).name).toBe('boxy.sid');
  });

  it('only saves sessions that something has been stored in', () => {
    const options = getSessionOptions(env());

    // saveUninitialized: false = no session row or cookie for visitors who never
    // log in. resave: false = don't rewrite unchanged sessions on every request.
    expect(options).toMatchObject({ saveUninitialized: false, resave: false });
  });

  it('makes the cookie unreadable by JavaScript (httpOnly)', () => {
    // So a cross-site scripting bug can't steal the session ID with document.cookie.
    expect(getSessionOptions(env()).cookie.httpOnly).toBe(true);
  });

  it("only sends the cookie on the site's own requests and top-level navigation (sameSite: lax)", () => {
    // Blocks most cross-site request forgery: another site can't make the
    // browser send a POST to our API with the user's cookie attached.
    expect(getSessionOptions(env()).cookie.sameSite).toBe('lax');
  });

  it.each(['development', 'test', undefined])(
    'allows the cookie over plain http when NODE_ENV is %s',
    (NODE_ENV) => {
      // localhost and the test runner don't use HTTPS.
      expect(getSessionOptions(env({ NODE_ENV })).cookie.secure).toBe(false);
    },
  );

  it('only sends the cookie over HTTPS in production', () => {
    expect(getSessionOptions(env({ NODE_ENV: 'production' })).cookie.secure).toBe(true);
  });

  it('gives the session a lifetime, so it outlasts closing the browser', () => {
    // Without maxAge it's a "session cookie" that most phones throw away when
    // the browser is closed, logging the user out every time.
    const { maxAge } = getSessionOptions(env()).cookie;

    expect(typeof maxAge).toBe('number');
    expect(maxAge).toBeGreaterThan(0);
  });
});

describe('createSessionMiddleware', () => {
  /** A throwaway app: one route that writes to the session, one that doesn't. */
  function buildApp() {
    const app = express();
    app.use(createSessionMiddleware({ NODE_ENV: 'test', SESSION_SECRET: SECRET }));
    app.get('/visit', (req, res) => {
      req.session.visits = (req.session.visits || 0) + 1;
      res.json({ visits: req.session.visits });
    });
    app.get('/untouched', (req, res) => res.json({ ok: true }));
    return app;
  }

  it('sets no cookie when the session is never used', async () => {
    const res = await request(buildApp()).get('/untouched');

    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('sets an HttpOnly, SameSite=Lax boxy.sid cookie once the session is used', async () => {
    const res = await request(buildApp()).get('/visit');

    const cookie = res.headers['set-cookie'][0];
    expect(cookie).toMatch(/^boxy\.sid=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('remembers session data between requests that send the cookie back', async () => {
    // request.agent() keeps cookies between requests, like a browser does.
    const browser = request.agent(buildApp());

    await browser.get('/visit');
    const res = await browser.get('/visit');

    expect(res.body).toEqual({ visits: 2 });
  });

  it('stores the session in the Postgres session table', async () => {
    await request(buildApp()).get('/visit');

    const { rows } = await db.query('SELECT sess FROM session');
    expect(rows).toHaveLength(1);
    expect(rows[0].sess.visits).toBe(1);
  });
});
