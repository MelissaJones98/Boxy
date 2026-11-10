// tests/helpers/migrate.js — run node-pg-migrate against the TEST database
// from inside Jest.
//
// Why a child process? node-pg-migrate v9 is published as an ES module only,
// and Jest (in our CommonJS setup) can't load ES modules from node_modules.
// Running its CLI as a separate Node process sidesteps that, and it's exactly
// the same command we run by hand and in CI, so tests exercise the real thing.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { getConnectionString } = require('../../src/db/config');

const SERVER_DIR = path.join(__dirname, '..', '..');
const MIGRATIONS_DIR = path.join(SERVER_DIR, 'migrations');

// Path to the CLI script itself, so we can run it with `node` directly. This
// avoids npx and shell-quoting differences between Windows and Linux (CI).
const CLI = path.join(
  path.dirname(require.resolve('node-pg-migrate/package.json')),
  'bin',
  'node-pg-migrate.js',
);

/** How many migration files exist, i.e. how many steps "down" undoes them all. */
function countMigrations() {
  return fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).length;
}

/**
 * Run migrations on the test database.
 *
 * @param {'up' | 'down'} direction
 * @param {number} [count]  How many to run. "up" defaults to all pending ones;
 *                          "down" here defaults to ALL of them (a full reset).
 */
function migrate(direction = 'up', count) {
  const args = [CLI, direction];
  if (direction === 'down') args.push(String(count ?? countMigrations()));
  else if (count !== undefined) args.push(String(count));
  args.push('-m', 'migrations', '--no-verbose');

  execFileSync(process.execPath, args, {
    cwd: SERVER_DIR,
    // getConnectionString() returns TEST_DATABASE_URL under Jest, and throws if
    // it's missing, so this helper can never touch the development database.
    env: { ...process.env, DATABASE_URL: getConnectionString() },
    stdio: 'pipe', // keep the CLI's output out of the test report...
  });
  // ...but if the CLI exits with an error, execFileSync throws, and the error
  // includes its stderr, so a failing migration still shows why.
}

module.exports = { migrate };
