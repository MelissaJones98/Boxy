// tests/db/connection.test.js — integration test: can we reach the real test
// database, as the boxy role, through our pool?
//
// Unlike config.test.js, this one needs Postgres running and server/.env
// filled in (or, in CI, the variables set by the workflow).

const db = require('../../src/db');

// The pool keeps connections open. Close them after this file so Jest can exit
// cleanly, instead of hanging with "Jest did not exit one second after...".
afterAll(() => db.pool.end());

describe('database connection', () => {
  it('connects to the boxy_test database while tests are running', async () => {
    const { rows } = await db.query('SELECT current_database() AS name');

    expect(rows[0].name).toBe('boxy_test');
  });

  it('passes values as $1 parameters rather than pasting them into the SQL', async () => {
    // Parameterised queries are how the whole API avoids SQL injection: pg sends
    // the value separately from the SQL text, so it can never be run as code.
    const { rows } = await db.query('SELECT $1::text AS echoed', ["Robert'); DROP TABLE users;--"]);

    expect(rows[0].echoed).toBe("Robert'); DROP TABLE users;--");
  });
});
