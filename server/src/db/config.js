// src/db/config.js — decides WHICH Postgres database the app talks to.
//
// This is kept separate from src/db/index.js (which opens the connection) so
// it can be unit-tested with fake environments, with no database needed.
// See tests/db/config.test.js for the exact rules it must follow.

/**
 * Pick the Postgres connection string for the current environment.
 *
 * @param {object} env  Environment variables. Defaults to process.env; tests
 *                      pass in a plain object instead.
 * @returns {string}    A postgres:// connection string.
 * @throws {Error}      If the variable the environment needs isn't set.
 */
function getConnectionString(env = process.env) {
  if (env.NODE_ENV === 'test') {
    if (!env.TEST_DATABASE_URL) {
      throw new Error('TEST_DATABASE_URL is not set. Add it to server/.env');
    }
    return env.TEST_DATABASE_URL;
  }

  if (env.NODE_ENV !== 'test') {
    if (!env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set. Add it to server/.env');
    }
    return env.DATABASE_URL;
  }
}
module.exports = { getConnectionString };
