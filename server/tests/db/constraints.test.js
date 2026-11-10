// tests/db/constraints.test.js — the rules the DATABASE itself enforces.
//
// The API will validate input too (express-validator, in later steps), but
// these constraints are the last line of defence: even buggy code, or someone
// typing SQL into pgAdmin, can't create a negative quantity or an orphaned item.
//
// When Postgres rejects a statement, the pg error has a `code` field holding a
// standard 5-character SQLSTATE. The API will map these to HTTP responses, e.g.
// 23505 on users.email becomes "An account with this email already exists".

const db = require('../../src/db');
const { resetDb } = require('../helpers/resetDb');
const { createUser, createBox, createItem, createPhoto } = require('../helpers/factories');

const PG = {
  UNIQUE_VIOLATION: '23505',
  FOREIGN_KEY_VIOLATION: '23503',
  NOT_NULL_VIOLATION: '23502',
  CHECK_VIOLATION: '23514',
};

beforeEach(resetDb);
afterAll(() => db.pool.end());

async function exists(table, id) {
  const { rows } = await db.query(`SELECT 1 FROM ${table} WHERE id = $1`, [id]);
  return rows.length === 1;
}

/** Build a full chain: user → box → item → photo. */
async function createChain() {
  const user = await createUser();
  const box = await createBox({ userId: user.id });
  const item = await createItem({ boxId: box.id });
  const photo = await createPhoto({ itemId: item.id });
  return { user, box, item, photo };
}

describe('cascading deletes', () => {
  it('deleting a user removes their boxes, items and photos', async () => {
    const { user, box, item, photo } = await createChain();

    await db.query('DELETE FROM users WHERE id = $1', [user.id]);

    expect(await exists('boxes', box.id)).toBe(false);
    expect(await exists('items', item.id)).toBe(false);
    expect(await exists('item_photos', photo.id)).toBe(false);
  });

  it('deleting a box removes its items and photos, but not other boxes', async () => {
    const { user, box, item, photo } = await createChain();
    const otherBox = await createBox({ userId: user.id, name: 'Other' });
    const otherItem = await createItem({ boxId: otherBox.id });

    await db.query('DELETE FROM boxes WHERE id = $1', [box.id]);

    expect(await exists('items', item.id)).toBe(false);
    expect(await exists('item_photos', photo.id)).toBe(false);
    // Cascades follow foreign keys only, so siblings are untouched.
    expect(await exists('boxes', otherBox.id)).toBe(true);
    expect(await exists('items', otherItem.id)).toBe(true);
  });

  it('deleting an item removes its photo', async () => {
    const { item, photo } = await createChain();

    await db.query('DELETE FROM items WHERE id = $1', [item.id]);

    expect(await exists('item_photos', photo.id)).toBe(false);
  });
});

describe('items.quantity', () => {
  it('defaults to 1 when not given', async () => {
    const user = await createUser();
    const box = await createBox({ userId: user.id });
    const { rows } = await db.query(
      `INSERT INTO items (box_id, name) VALUES ($1, 'Mug') RETURNING quantity`,
      [box.id],
    );

    expect(rows[0].quantity).toBe(1);
  });

  it.each([0, -1])('rejects a quantity of %i', async (quantity) => {
    const user = await createUser();
    const box = await createBox({ userId: user.id });

    // `.rejects` waits for the promise and passes if it fails; toMatchObject
    // then checks the error's fields, so we know it failed for the right reason.
    await expect(createItem({ boxId: box.id, quantity })).rejects.toMatchObject({
      code: PG.CHECK_VIOLATION,
    });
  });
});

describe('item_photos', () => {
  it('rejects a second photo for the same item', async () => {
    // Create a chain (which already includes one photo),
    const chain = await createChain();
    // then expect a second createPhoto() for the same item to reject with the right code.
    await expect(createPhoto({ itemId: chain.item.id })).rejects.toMatchObject({
      code: PG.UNIQUE_VIOLATION,
    });
  });
});

describe('users', () => {
  it('rejects a duplicate email', async () => {
    await createUser({ email: 'sam@example.com' });

    await expect(createUser({ email: 'sam@example.com' })).rejects.toMatchObject({
      code: PG.UNIQUE_VIOLATION,
    });
  });
});

describe('boxes', () => {
  it('requires a name', async () => {
    const user = await createUser();

    await expect(createBox({ userId: user.id, name: null })).rejects.toMatchObject({
      code: PG.NOT_NULL_VIOLATION,
    });
  });

  it('starts unlocked, with no locked_at', async () => {
    const user = await createUser();
    const { rows } = await db.query(
      `INSERT INTO boxes (user_id, name) VALUES ($1, 'Kitchen') RETURNING is_locked, locked_at`,
      [user.id],
    );

    expect(rows[0]).toEqual({ is_locked: false, locked_at: null });
  });

  it('must belong to a user that exists', async () => {
    await expect(createBox({ userId: 999 })).rejects.toMatchObject({
      code: PG.FOREIGN_KEY_VIOLATION,
    });
  });
});
