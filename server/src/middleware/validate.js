// src/middleware/validate.js — turns express-validator's findings into a 400.
//
// express-validator works in two halves. Validation chains such as
// body('email').isEmail() run first and only RECORD problems on the request.
// This middleware runs after them: if anything was recorded, it replies 400
// and the route handler never runs. Usage:
//
//   router.post('/signup', signupRules, handleValidationErrors, handler);

const { validationResult } = require('express-validator');

/**
 * Reply 400 if any validation chain before this one failed. The body is
 *   { error: "<first message>", fields: { email: "...", password: "..." } }
 * `error` keeps the API-wide { error } shape; `fields` gives one message per
 * field, so a form can show each one next to its input.
 */
function handleValidationErrors(req, res, next) {
  // onlyFirstError: a field with several problems reports just the first.
  const errors = validationResult(req).array({ onlyFirstError: true });

  if (errors.length === 0) {
    return next();
  }

  // [{ path: 'email', msg: '...' }, ...] → { email: '...' }
  const fields = Object.fromEntries(errors.map((e) => [e.path, e.msg]));
  return res.status(400).json({ error: errors[0].msg, fields });
}

module.exports = { handleValidationErrors };
