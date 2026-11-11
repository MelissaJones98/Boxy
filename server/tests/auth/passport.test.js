// tests/auth/passport.test.js — the Passport local strategy (Build step 2, ticket 2.2).
//
// Three pieces are tested here:
//   verifyCredentials(email, password)  the login check the strategy runs
//   serializeUser / deserializeUser     what's kept in the session, and how
//                                       req.user is rebuilt from it each request
//   toPublicUser(row)                   the safe shape of a user sent to the client

const passport = require('passport');
const db = require('../../src/db');
const { resetDb } = require('../helpers/resetDb');
const { createUser } = require('../helpers/factories');
const { hashPassword } = require('../../src/auth/password');
const { verifyCredentials, toPublicUser, configurePassport } = require('../../src/auth/passport');

const PASSWORD = 'correct horse';

beforeEach(resetDb);
afterAll(() => db.pool.end());

/** A user whose password really is PASSWORD. */
async function createUserWithPassword(overrides = {}) {
  return createUser({ passwordHash: await hashPassword(PASSWORD), ...overrides });
}

describe('toPublicUser', () => {
  it('keeps only the fields the client needs, never password_hash', () => {
    const row = {
      id: 1,
      email: 'a@example.com',
      password_hash: '$2b$04$secret',
      display_name: 'Ann',
      created_at: new Date(),
    };

    expect(toPublicUser(row)).toEqual({ id: 1, email: 'a@example.com', displayName: 'Ann' });
  });
});

describe('verifyCredentials', () => {
  it('returns the public user for the right email and password', async () => {
    const user = await createUserWithPassword({ email: 'ann@example.com', displayName: 'Ann' });

    const result = await verifyCredentials('ann@example.com', PASSWORD);

    expect(result).toEqual({ id: user.id, email: 'ann@example.com', displayName: 'Ann' });
  });

  it('matches the email whatever its capitalisation or surrounding spaces', async () => {
    // Emails are stored lower-case, so "Ann@Example.com " must still find the user.
    const user = await createUserWithPassword({ email: 'ann@example.com' });

    const result = await verifyCredentials('  Ann@Example.COM ', PASSWORD);

    expect(result).toMatchObject({ id: user.id });
  });

  it('returns false for the wrong password', async () => {
    await createUserWithPassword({ email: 'ann@example.com' });

    expect(await verifyCredentials('ann@example.com', 'wrong password')).toBe(false);
  });

  it('returns false for an email with no account', async () => {
    expect(await verifyCredentials('nobody@example.com', PASSWORD)).toBe(false);
  });
});

describe('configurePassport', () => {
  // A fresh Passport instance per test, so nothing leaks into the shared one.
  let instance;
  beforeEach(() => {
    instance = new passport.Passport();
    configurePassport(instance);
  });

  // Passport's serialize/deserialize take Node-style callbacks; wrap them in
  // promises so the tests can simply await the result.
  const serialize = (user) =>
    new Promise((resolve, reject) =>
      instance.serializeUser(user, (err, id) => (err ? reject(err) : resolve(id))),
    );
  const deserialize = (id) =>
    new Promise((resolve, reject) =>
      instance.deserializeUser(id, (err, user) => (err ? reject(err) : resolve(user))),
    );

  it('registers a strategy named "local"', () => {
    expect(instance._strategy('local')).toBeDefined();
  });

  it('stores only the user id in the session', async () => {
    // Keeping just the id means a changed email or name is picked up on the
    // next request, and nothing sensitive sits in the session table.
    expect(await serialize({ id: 7, email: 'a@example.com', displayName: null })).toBe(7);
  });

  it('rebuilds req.user from the id, as a public user', async () => {
    const user = await createUserWithPassword({ email: 'ann@example.com', displayName: 'Ann' });

    expect(await deserialize(user.id)).toEqual({
      id: user.id,
      email: 'ann@example.com',
      displayName: 'Ann',
    });
  });

  it('treats a session for a deleted user as logged out', async () => {
    // false (not an error) tells Passport "no user": req.user stays undefined,
    // so the request is treated as logged out rather than crashing with a 500.
    expect(await deserialize(9999)).toBe(false);
  });
});
