// tests/helpers/factories.js — insert rows straight into the test database.
//
// Each function creates one row with sensible defaults, takes overrides for
// the fields a test cares about, and returns the full inserted row.
// For example:
//
//   const user = await createUser();
//   const box  = await createBox({ userId: user.id, isLocked: true });
//
// Tests use these to set up a situation directly in the database, rather than
// going through the API. That keeps each API test focused on the one route it's
// testing, e.g. "PATCH a locked box returns 423" doesn't depend on the lock route.

const db = require('../../src/db');

// A counter keeps generated emails unique within a test run, since users.email
// is UNIQUE. (resetDb() empties the table, but not this counter, which is fine.)
let emailCounter = 0;

async function createUser({ email, passwordHash = 'not-a-real-hash', displayName = null } = {}) {
  emailCounter += 1;
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [email ?? `user${emailCounter}@example.com`, passwordHash, displayName],
  );
  return rows[0];
}

async function createBox({ userId, name = 'Test box', location = null, isLocked = false } = {}) {
  const { rows } = await db.query(
    `INSERT INTO boxes (user_id, name, location, is_locked, locked_at)
     VALUES ($1, $2, $3, $4, CASE WHEN $4 THEN now() END) RETURNING *`,
    [userId, name, location, isLocked],
  );
  return rows[0];
}

async function createItem({ boxId, name = 'Test item', quantity = 1, notes = null } = {}) {
  const { rows } = await db.query(
    `INSERT INTO items (box_id, name, quantity, notes)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [boxId, name, quantity, notes],
  );
  return rows[0];
}

async function createPhoto({
  itemId,
  url = 'https://example.com/p.jpg',
  storageKey = 'test/key',
} = {}) {
  const { rows } = await db.query(
    `INSERT INTO item_photos (item_id, url, storage_key)
     VALUES ($1, $2, $3) RETURNING *`,
    [itemId, url, storageKey],
  );
  return rows[0];
}

module.exports = { createUser, createBox, createItem, createPhoto };
