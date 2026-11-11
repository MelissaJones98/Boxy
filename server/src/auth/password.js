// src/auth/password.js — hashing and checking passwords with bcrypt.
//
// Passwords are never stored. users.password_hash holds a bcrypt hash, which
// includes its own random salt and cost factor, e.g.
//   $2b$12$<22-char salt><31-char hash>
// so verifyPassword() needs nothing but the password guess and that string.

const bcrypt = require('bcrypt');

/**
 * How much work each hash takes. Every +1 doubles it: 12 is about 250 ms, slow
 * enough to make guessing millions of passwords impractical. Tests use 4 (the
 * minimum), because they hash many passwords and don't need to resist attackers.
 *
 * @param {object} env  Environment variables (process.env by default).
 */
function getBcryptCost(env = process.env) {
  return env.NODE_ENV === 'test' ? 4 : 12;
}

/** Hash a plain-text password for storing in users.password_hash. */
async function hashPassword(password) {
  return bcrypt.hash(password, getBcryptCost());
}

/**
 * Does `password` match `hash`? bcrypt.compare re-hashes the guess with the
 * salt and cost stored in `hash`, then compares the two in constant time (so
 * response timing can't reveal how much of a guess was right).
 */
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = { hashPassword, verifyPassword, getBcryptCost };
