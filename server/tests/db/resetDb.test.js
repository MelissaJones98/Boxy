// tests/db/resetDb.test.js — tests for the helper every later test file uses
// to start from a clean, predictable database.
//
// Why it matters: API tests will assert things like "the new box has id 1" or
// "My Boxes shows 0 boxes". Those only hold if no rows are left over from an
// earlier test, and if ID counters start again from 1 each time.

const db = require('../../src/db');
const { resetDb } = require('../helpers/resetDb');

afterAll(() => db.pool.end());

/** Insert one row into every table, following the foreign-key chain. */
async function seedOneOfEverything() {
  const user = await db.query(
    `INSERT INTO users (email, password_hash) VALUES ('a@example.com', 'x') RETURNING id`,
  );
  const box = await db.query(
    `INSERT INTO boxes (user_id, name) VALUES ($1, 'Tools') RETURNING id`,
    [user.rows[0].id],
  );
  const item = await db.query(
    `INSERT INTO items (box_id, name) VALUES ($1, 'Hammer') RETURNING id`,
    [box.rows[0].id],
  );
  await db.query(`INSERT INTO item_photos (item_id, url, storage_key) VALUES ($1, 'u', 'k')`, [
    item.rows[0].id,
  ]);
}

async function rowCount(table) {
  // Table names can't be $1 parameters (only values can), so they're written
  // into the SQL here. That's safe ONLY because the names come from our own
  // test code, never from a request.
  const { rows } = await db.query(`SELECT count(*)::int AS n FROM ${table}`);
  return rows[0].n;
}

describe('resetDb', () => {
  it('empties every app table', async () => {
    await seedOneOfEverything();

    await resetDb();

    for (const table of ['users', 'boxes', 'items', 'item_photos']) {
      expect({ table, rows: await rowCount(table) }).toEqual({ table, rows: 0 });
    }
  });

  it('restarts id numbering at 1', async () => {
    await seedOneOfEverything(); // uses up id 1 in every table...
    await resetDb();

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash) VALUES ('b@example.com', 'x') RETURNING id`,
    );

    expect(rows[0].id).toBe(1); // ...so without RESTART IDENTITY this would be 2 or more
  });

  it('keeps the migration history, so migrations are not re-run', async () => {
    await resetDb();

    // pgmigrations is node-pg-migrate's record of what has run. Emptying it
    // would make the next `migrate up` try to CREATE the tables again and fail.
    expect(await rowCount('pgmigrations')).toBeGreaterThan(0);
  });
});
