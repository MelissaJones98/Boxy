// tests/setup/globalSetup.js — runs ONCE per `npm test`, before any test file.
// (Registered as "globalSetup" in server/package.json.)
//
// It brings boxy_test's schema up to date by running any pending migrations.
// Once this has run, every test file can assume the tables exist, so no test
// depends on another file (like schema.test.js) happening to run first.
//
// globalSetup runs in its own context, separate from the test files, so the
// "setupFiles" script that loads .env hasn't run yet. We load it here as well.

require('./loadEnv');
const { migrate } = require('../helpers/migrate');

module.exports = async function globalSetup() {
  // Jest sets NODE_ENV=test itself. Check anyway: migrate() relies on it to pick
  // TEST_DATABASE_URL, and getting this wrong would migrate the dev database.
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(`globalSetup expected NODE_ENV=test but got "${process.env.NODE_ENV}"`);
  }

  migrate('up');
};
