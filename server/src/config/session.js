// src/config/session.js — login sessions: express-session, stored in Postgres.
//
// Split in two, like src/db/config.js:
//   getSessionOptions(env)       pure settings, unit-tested with fake environments
//   createSessionMiddleware(env) the real middleware, with the Postgres store
// See tests/config/session.test.js for the rules each setting must follow.

const session = require('express-session');
const connectPgSimple = require('connect-pg-simple');
const { pool } = require('../db');

// connect-pg-simple is a factory: give it express-session and it returns a
// Store class that saves sessions in Postgres instead of in server memory.
// (The default MemoryStore loses every session on restart, and leaks memory.)
const PgStore = connectPgSimple(session);

/**
 * express-session settings for the given environment.
 *
 * @param {object} env  Environment variables (process.env by default).
 * @throws {Error}      If SESSION_SECRET isn't set.
 */
function getSessionOptions(env = process.env) {
  if (!env.SESSION_SECRET) {
    throw new Error('SESSION_SECRET is not set. Add it to server/.env');
  }

  return {
    // Signs the session ID cookie, so a forged or edited cookie is rejected.
    secret: env.SESSION_SECRET,
    name: 'boxy.sid',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: env.NODE_ENV === 'production', // this values changes based on whether or not the current environment is test or production (false if test and true if production)
      maxAge: 7 * 24 * 60 * 60 * 1000, // maxAge set to 7 days (in milliseconds)
    },
  };
}

/**
 * The session middleware, ready for app.use(). After it runs, every request
 * has req.session, which is loaded from and saved to the `session` table.
 */
function createSessionMiddleware(env = process.env) {
  return session({
    ...getSessionOptions(env),
    store: new PgStore({
      pool, // reuse the app's one connection pool (src/db/index.js)
      tableName: 'session', // created by migration 1794399807826_create-session-table.sql
      // Every 15 minutes (the default), delete expired sessions. Off in tests,
      // where the timer would keep Jest running after the tests finish.
      pruneSessionInterval: env.NODE_ENV === 'test' ? false : 15 * 60,
    }),
  });
}

module.exports = { getSessionOptions, createSessionMiddleware };
