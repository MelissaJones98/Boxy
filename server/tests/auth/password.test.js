// tests/auth/password.test.js — password hashing (Build step 2, ticket 2.2).
//
// We never store a password, only a bcrypt HASH of it: a one-way scramble that
// can check a guess ("does 'hunter22' produce this hash?") but can't be turned
// back into the password. If the database ever leaked, the passwords wouldn't.

const { hashPassword, verifyPassword, getBcryptCost } = require('../../src/auth/password');

describe('hashPassword', () => {
  it('returns a bcrypt hash, not the password itself', async () => {
    const hash = await hashPassword('correct horse');

    expect(hash).not.toBe('correct horse');
    expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/); // bcrypt's "$2b$<cost>$" prefix
  });

  it('gives a different hash each time for the same password (random salt)', async () => {
    // So two users with the same password don't have matching hashes, and
    // precomputed "rainbow tables" of common-password hashes are useless.
    const first = await hashPassword('same password');
    const second = await hashPassword('same password');

    expect(first).not.toBe(second);
  });
});

describe('verifyPassword', () => {
  it('is true for the password that made the hash', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('correct horse', hash)).toBe(true);
  });

  it('is false for any other password', async () => {
    const hash = await hashPassword('correct horse');

    expect(await verifyPassword('Correct horse', hash)).toBe(false); // case matters
    expect(await verifyPassword('', hash)).toBe(false);
  });
});

describe('getBcryptCost', () => {
  it('uses a strong cost (12) outside tests', () => {
    expect(getBcryptCost({ NODE_ENV: 'production' })).toBe(12);
    expect(getBcryptCost({ NODE_ENV: 'development' })).toBe(12);
    expect(getBcryptCost({})).toBe(12);
  });

  it('uses the minimum cost (4) in tests, so hashing is fast', () => {
    expect(getBcryptCost({ NODE_ENV: 'test' })).toBe(4);
  });
});
