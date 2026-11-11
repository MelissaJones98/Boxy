// src/auth/passport.js — how Passport logs users in and recognises them later.
//
// Passport is set up with three hooks:
//   1. the "local" strategy  runs once, at login: checks email + password
//   2. serializeUser         decides what to save in the session (just the id)
//   3. deserializeUser       on every later request, turns that id back into
//                            req.user
// See tests/auth/passport.test.js for the behaviour each one must have.

const { Strategy: LocalStrategy } = require('passport-local');
const db = require('../db');
const { verifyPassword } = require('./password');

/**
 * The user as the client sees it. Never includes password_hash, and renames
 * the snake_case database columns to the camelCase used in JavaScript and JSON.
 */
function toPublicUser(row) {
  return { id: row.id, email: row.email, displayName: row.display_name };
}

/**
 * Check a login attempt.
 *
 * @returns {Promise<object|false>} The public user if the email and password
 *   match an account, otherwise false. It deliberately doesn't say WHICH was
 *   wrong, so the login form can't be used to discover who has an account.
 */
async function verifyCredentials(email, password) {
  // Emails are stored lower-case (CLAUDE.md), so normalise the attempt to match.
  const normalisedEmail = email.trim().toLowerCase();

  const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [normalisedEmail]);
  const user = rows[0]; // undefined if there's no account with that email

  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return false;
  }
  return toPublicUser(user);
}

/**
 * Register the strategy and session hooks on a Passport instance. Taking the
 * instance as an argument lets tests use a fresh one; the app passes the
 * shared `require('passport')`.
 */
function configurePassport(passport) {
  passport.use(
    // passport-local reads `username` and `password` from req.body by default;
    // our forms send `email`, so tell it which field to use.
    new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
      // Passport predates async/await and expects a callback: done(error,
      // user). done(null, false) means "wrong credentials", not a crash.
      verifyCredentials(email, password).then((user) => done(null, user), done);
    }),
  );

  // Save only the id in the session row.
  passport.serializeUser((user, done) => done(null, user.id));

  // Look the user up fresh on each request, so edits show up immediately and
  // a deleted account stops working. false = "no user", i.e. logged out.
  passport.deserializeUser((id, done) => {
    db.query('SELECT * FROM users WHERE id = $1', [id]).then(
      ({ rows }) => done(null, rows[0] ? toPublicUser(rows[0]) : false),
      done,
    );
  });
}

module.exports = { verifyCredentials, toPublicUser, configurePassport };
