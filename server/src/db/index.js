// src/db/index.js — the single place the app talks to Postgres from.
//
// Every route and model imports this module, rather than creating its own
// connection, so there is exactly one pool for the whole process.

const { Pool } = require('pg');
const { getConnectionString } = require('./config');

// A Pool keeps a handful of open connections and lends one out per query.
// Opening a fresh connection for every request would be slow (each one costs a
// network round trip plus authentication), so the pool reuses them.
const pool = new Pool({
  connectionString: getConnectionString(),
});

/**
 * Run one SQL statement.
 *
 * ALWAYS pass user-supplied values through `params` with $1, $2... placeholders,
 * never by building the SQL string yourself. For example:
 *
 *   db.query('SELECT * FROM boxes WHERE id = $1 AND user_id = $2', [boxId, userId])
 *
 * @param {string} text    SQL with $1, $2... placeholders.
 * @param {Array}  params  Values for the placeholders, in order.
 * @returns {Promise<import('pg').QueryResult>}  Use `.rows` for the results.
 */
function query(text, params) {
  return pool.query(text, params);
}

// Export the pool too: tests need pool.end() to close connections, and later
// transfers will need pool.connect() to run several queries in one transaction.
module.exports = { pool, query };
