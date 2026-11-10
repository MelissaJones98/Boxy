// tests/db/config.test.js — unit tests for choosing which database to connect to.
//
// getConnectionString() takes the environment variables as an argument, rather
// than reading process.env itself. That lets each test pass in a fake
// environment, so these tests need no real database and can't affect each other.

const { getConnectionString } = require('../../src/db/config');

const DEV_URL = 'postgres://boxy:pw@localhost:5432/boxy';
const TEST_URL = 'postgres://boxy:pw@localhost:5432/boxy_test';

describe('getConnectionString', () => {
  it('uses TEST_DATABASE_URL when NODE_ENV is "test"', () => {
    const env = { NODE_ENV: 'test', DATABASE_URL: DEV_URL, TEST_DATABASE_URL: TEST_URL };

    expect(getConnectionString(env)).toBe(TEST_URL);
  });

  it('uses DATABASE_URL when NODE_ENV is "development"', () => {
    const env = { NODE_ENV: 'development', DATABASE_URL: DEV_URL, TEST_DATABASE_URL: TEST_URL };

    expect(getConnectionString(env)).toBe(DEV_URL);
  });

  it('uses DATABASE_URL when NODE_ENV is not set', () => {
    // Running `node src/index.js` locally doesn't set NODE_ENV at all.
    const env = { DATABASE_URL: DEV_URL };

    expect(getConnectionString(env)).toBe(DEV_URL);
  });

  // The two safety tests. Test files TRUNCATE every table, so if tests ever
  // fell back to DATABASE_URL they would wipe the development data.
  it('throws when NODE_ENV is "test" but TEST_DATABASE_URL is missing', () => {
    const env = { NODE_ENV: 'test', DATABASE_URL: DEV_URL };

    expect(() => getConnectionString(env)).toThrow(/TEST_DATABASE_URL/);
  });

  it('throws when DATABASE_URL is missing outside of tests', () => {
    const env = { NODE_ENV: 'development' };

    expect(() => getConnectionString(env)).toThrow(/DATABASE_URL/);
  });
});
