// tests/db/schema.test.js — does running the migrations produce the data model
// from CLAUDE.md ("Data model")? And can it be cleanly undone?
//
// These tests read Postgres's own catalogue (information_schema / pg_indexes)
// rather than inserting data. Behaviour like cascades and CHECK constraints is
// tested separately in ticket 1.7.

const db = require('../../src/db');
const { migrate } = require('../helpers/migrate');

const TABLES = ['users', 'boxes', 'items', 'item_photos'];

/** Names of our tables that currently exist in the public schema. */
async function existingTables() {
  const { rows } = await db.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [TABLES],
  );
  return rows.map((r) => r.table_name).sort();
}

/** Column names of one table, sorted so the order they were declared in doesn't matter. */
async function columnsOf(table) {
  const { rows } = await db.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1`,
    [table],
  );
  return rows.map((r) => r.column_name).sort();
}

beforeAll(() => migrate('up'));
afterAll(() => db.pool.end());

describe('initial schema migration', () => {
  it('creates the users, boxes, items and item_photos tables', async () => {
    expect(await existingTables()).toEqual([...TABLES].sort());
  });

  it.each([
    ['users', ['id', 'email', 'password_hash', 'display_name', 'created_at']],
    [
      'boxes',
      [
        'id',
        'user_id',
        'name',
        'description',
        'location',
        'is_locked',
        'locked_at',
        'created_at',
        'updated_at',
      ],
    ],
    ['items', ['id', 'box_id', 'name', 'quantity', 'notes', 'created_at', 'updated_at']],
    ['item_photos', ['id', 'item_id', 'url', 'storage_key', 'created_at']],
  ])('gives %s exactly the planned columns', async (table, expected) => {
    expect(await columnsOf(table)).toEqual([...expected].sort());
  });

  it('indexes the foreign keys the API filters by most', async () => {
    // Every "my boxes" query filters boxes by user_id, and every box page
    // filters items by box_id, so both need an index to stay fast.
    const { rows } = await db.query(
      `SELECT tablename, indexdef FROM pg_indexes
       WHERE schemaname = 'public' AND tablename IN ('boxes', 'items')`,
    );
    const defs = rows.map((r) => r.indexdef);

    expect(defs).toEqual(expect.arrayContaining([expect.stringMatching(/ON public\.boxes .*\(user_id\)/)]));
    expect(defs).toEqual(expect.arrayContaining([expect.stringMatching(/ON public\.items .*\(box_id\)/)]));
  });

  it('can be rolled back completely, then re-applied', async () => {
    // Proves the Down Migration undoes everything the Up Migration did. If it
    // missed a table, or dropped them in an order Postgres refuses, this fails.
    migrate('down');
    expect(await existingTables()).toEqual([]);

    migrate('up'); // leave the database migrated for any test file that runs next
    expect(await existingTables()).toEqual([...TABLES].sort());
  });
});
