// tests/setup/loadEnv.js — runs once before every test file (see "setupFiles"
// in server/package.json).
//
// In normal use, src/index.js loads server/.env. Tests never run index.js, as
// they import the app directly, so we load .env here instead. That way the
// tests can read TEST_DATABASE_URL.
//
// In CI (GitHub Actions) there is no .env file. The variables are set by the
// workflow instead, and dotenv quietly does nothing, because it never
// overwrites variables that are already set.

const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '..', '..', '.env'), // server/.env
  quiet: true, // don't print dotenv's "injected env" banner in test output
});
