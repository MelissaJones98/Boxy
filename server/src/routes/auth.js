// src/routes/auth.js — /api/auth/*: signup (more routes arrive in 2.4–2.6).
//
// Mounted in app.js with app.use('/api/auth', authRouter), so a path of
// '/signup' here is the full URL /api/auth/signup.

const express = require('express');
const { body, matchedData } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { hashPassword } = require('../auth/password');
const { toPublicUser } = require('../auth/passport');
const { insertUser } = require('../models/users');

const router = express.Router();

// Postgres's error code for "this would break a UNIQUE constraint".
const UNIQUE_VIOLATION = '23505';
const DUPLICATE_EMAIL = 'An account with this email already exists';

// ---------------------------------------------------------------------------
// Validation rules. body(field, message) sets the message used if ANY check in
// that chain fails. Checks run top to bottom; sanitisers (trim, toLowerCase)
// change the value for the checks after them and for the route handler.
// ---------------------------------------------------------------------------
const signupRules = [
  body('email', 'Enter a valid email address')
    .isString() // first, so a number or array can't reach .trim() and crash
    .bail() // stop this chain here if it isn't a string
    .trim()
    .toLowerCase()
    .isEmail()
    .isLength({ max: 255 }), // users.email is VARCHAR(255)

  body('password', 'Password must be at least 8 characters').isString().isLength({ min: 8 }),

  body('displayName', 'Name must be 80 characters or fewer')
    .optional({ values: 'null' }) // missing or null: skip this chain entirely
    .isString()
    .bail()
    .trim()
    .isLength({ max: 80 }) // users.display_name is VARCHAR(80)
    .customSanitizer((name) => name || null), // '' after trimming → no name
];

/**
 * POST /api/auth/signup  { email, password, displayName? }
 * 201 { user }, and the user is logged in (session cookie set).
 * 400 { error, fields } for invalid input or an email that's already taken.
 */
router.post('/signup', signupRules, handleValidationErrors, async (req, res) => {
  // matchedData = only the validated fields, AFTER sanitising (trimmed,
  // lower-cased). Anything extra the client sent, like is_admin, is dropped.
  const { email, password, displayName } = matchedData(req);

  const passwordHash = await hashPassword(password);

  let user;
  try {
    user = await insertUser({ email, passwordHash, displayName });
  } catch (err) {
    // Duplicate email: the user's to fix, so a friendly 400 in the same
    // { error, fields } shape as validation errors.
    if (err.code === UNIQUE_VIOLATION) {
      return res.status(400).json({ error: DUPLICATE_EMAIL, fields: { email: DUPLICATE_EMAIL } });
    }
    // Anything else is a real failure: re-throw the ORIGINAL error so Express
    // turns it into a 500 and its details reach the logs.
    throw err;
  }

  const publicUser = toPublicUser(user);

  // req.login() is added by Passport. It starts a fresh session (a new ID,
  // which stops "session fixation" attacks) and saves serializeUser's value
  // (the user's id) in it. It takes a callback, so wrap it to await it.
  await new Promise((resolve, reject) =>
    req.login(publicUser, (err) => (err ? reject(err) : resolve())),
  );

  res.status(201).json({ user: publicUser });
});

module.exports = router;
