// tests/routes/auth.signup.test.js — POST /api/auth/signup (Build step 2, ticket 2.3).
//
// User stories (CLAUDE.md):
//   - A valid email and an 8+ character password create an account and log
//     the user in.
//   - A duplicate email shows "An account with this email already exists".

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const { resetDb } = require('../helpers/resetDb');
const { createUser } = require('../helpers/factories');
const { verifyPassword } = require('../../src/auth/password');

const valid = { email: 'ann@example.com', password: 'correct horse', displayName: 'Ann' };

beforeEach(resetDb);
afterAll(() => db.pool.end());

const signup = (body) => request(app).post('/api/auth/signup').send(body);

async function usersInDb() {
  const { rows } = await db.query('SELECT * FROM users ORDER BY id');
  return rows;
}

describe('POST /api/auth/signup — success', () => {
  it('responds 201 with the new public user', async () => {
    const res = await signup(valid);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      user: { id: expect.any(Number), email: 'ann@example.com', displayName: 'Ann' },
    });
  });

  it('never sends the password hash back', async () => {
    const res = await signup(valid);

    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
  });

  it('stores the email trimmed and lower-case', async () => {
    await signup({ ...valid, email: '  Ann@Example.COM ' });

    const [user] = await usersInDb();
    expect(user.email).toBe('ann@example.com');
  });

  it('stores a bcrypt hash of the password, not the password', async () => {
    await signup(valid);

    const [user] = await usersInDb();
    expect(user.password_hash).not.toBe(valid.password);
    expect(await verifyPassword(valid.password, user.password_hash)).toBe(true);
  });

  it('makes the display name optional', async () => {
    const res = await signup({ email: valid.email, password: valid.password });

    expect(res.status).toBe(201);
    expect(res.body.user.displayName).toBeNull();
  });

  it('treats a blank display name as no name', async () => {
    const res = await signup({ ...valid, displayName: '   ' });

    expect(res.body.user.displayName).toBeNull();
  });

  it('accepts a password of exactly 8 characters', async () => {
    const res = await signup({ ...valid, password: '12345678' });

    expect(res.status).toBe(201);
  });

  it('logs the new user in: sets the session cookie and saves their id in the session', async () => {
    const res = await signup(valid);

    expect(res.headers['set-cookie'][0]).toMatch(/^boxy\.sid=/);

    // Passport keeps the logged-in user under sess.passport.user (the id
    // returned by serializeUser in src/auth/passport.js).
    const { rows } = await db.query('SELECT sess FROM session');
    expect(rows).toHaveLength(1);
    expect(rows[0].sess.passport.user).toBe(res.body.user.id);
  });
});

describe('POST /api/auth/signup — validation (400)', () => {
  const EMAIL = 'Enter a valid email address';
  const PASSWORD = 'Password must be at least 8 characters';
  const NAME = 'Name must be 80 characters or fewer';

  // Each case: a name for the test title, the body sent, the field that's
  // wrong, and the message expected for it.
  it.each([
    {
      name: 'a missing email',
      body: { ...valid, email: undefined },
      field: 'email',
      message: EMAIL,
    },
    {
      name: 'a malformed email',
      body: { ...valid, email: 'ann@' },
      field: 'email',
      message: EMAIL,
    },
    {
      name: 'a missing password',
      body: { ...valid, password: undefined },
      field: 'password',
      message: PASSWORD,
    },
    {
      name: 'a 7-character password',
      body: { ...valid, password: '1234567' },
      field: 'password',
      message: PASSWORD,
    },
    {
      name: 'an 81-character name',
      body: { ...valid, displayName: 'x'.repeat(81) },
      field: 'displayName',
      message: NAME,
    },
  ])('rejects $name', async ({ body, field, message }) => {
    const res = await signup(body);

    expect(res.status).toBe(400);
    // `error` follows the API-wide { error } shape; `fields` lets the form show
    // each message next to the input it belongs to.
    expect(res.body.error).toBe(message);
    expect(res.body.fields).toEqual({ [field]: message });
    expect(await usersInDb()).toHaveLength(0);
  });

  it('reports every invalid field at once', async () => {
    const res = await signup({ email: 'nope', password: 'short' });

    expect(res.body.fields).toEqual({ email: EMAIL, password: PASSWORD });
  });

  it('rejects non-string values rather than crashing', async () => {
    // JSON lets a client send {"email": ["a@b.com"]} or a number; that must be
    // a 400, never a 500 from calling .trim() on an array.
    const res = await signup({ email: ['ann@example.com'], password: 12345678 });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/signup — duplicate email (400)', () => {
  const MESSAGE = 'An account with this email already exists';

  it('refuses an email that already has an account', async () => {
    await createUser({ email: 'ann@example.com' });

    const res = await signup(valid);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: MESSAGE, fields: { email: MESSAGE } });
    expect(await usersInDb()).toHaveLength(1);
  });

  it('treats different capitalisation as the same email', async () => {
    await createUser({ email: 'ann@example.com' });

    const res = await signup({ ...valid, email: 'ANN@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe(MESSAGE);
  });

  it('does not log anyone in', async () => {
    await createUser({ email: 'ann@example.com' });

    const res = await signup(valid);

    expect(res.headers['set-cookie']).toBeUndefined();
  });
});
