// src/models/users.js — SQL for the users table.
//
// Routes call these functions rather than writing SQL themselves, so each
// query lives in one place. All values go in as $1, $2... parameters, never
// pasted into the SQL string, which is what prevents SQL injection.

const db = require('../db');

/**
 * Insert a user and return the full new row.
 *
 * The email must already be lower-case (the signup validation does that).
 * If it's taken, Postgres rejects the INSERT because of users.email's UNIQUE
 * constraint, and this throws an error with code '23505' (unique_violation).
 */
async function insertUser({ email, passwordHash, displayName = null }) {
  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash, display_name)
     VALUES ($1, $2, $3) RETURNING *`,
    [email, passwordHash, displayName],
  );
  return rows[0];
}

module.exports = { insertUser };
