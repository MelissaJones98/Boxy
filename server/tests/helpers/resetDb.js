// tests/helpers/resetDb.js — wipe the test database back to empty tables.
//
// Usage in any test file that touches the database:
//
//   const { resetDb } = require('../helpers/resetDb');
//   beforeEach(resetDb);   // every test starts with empty tables and ids from 1
//
// It never runs migrations itself. Those run once per `npm test`, in
// tests/setup/globalSetup.js, before any test file starts.

const db = require('../../src/db');

/**
 * Delete every row from every app table and restart their id counters at 1.
 * Leaves the tables themselves, and node-pg-migrate's history, in place.
 */
async function resetDb() {
  // RESTART IDENTITY resets each table's SERIAL counter
  // CASCADE empties any table whose foreign keys point at the ones you list
  await db.query('TRUNCATE users, boxes, items, item_photos RESTART IDENTITY CASCADE');
}

module.exports = { resetDb };
