// app.js — builds and configures the Express application, but does NOT start it.
//
// Starting the server (app.listen) lives in index.js instead. Keeping the two
// apart lets the tests import this file and hand the app straight to Supertest,
// which runs requests against it in memory without opening a real network port.

const express = require('express');

const app = express();

// Parse JSON request bodies (Content-Type: application/json) into req.body.
// Every POST/PATCH in the Boxy API sends JSON, apart from photo uploads,
// which use multipart/form-data and will be handled by Multer instead.
app.use(express.json());

// Health check: a cheap "is the API up?" endpoint. It's handy for checking a
// deploy (Render can ping it) and it's the first route our tests drive.
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---------------------------------------------------------------------------
// Fallback handlers. Express runs middleware in the order it's registered, so
// anything below this line only runs when none of the routes above matched.
// ---------------------------------------------------------------------------

// Catch-all for requests that matched no route above.
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

module.exports = app;
