// index.js — the entry point that actually starts the API server.
// `npm start` and `npm run dev` (nodemon) both run this file. The tests never
// do: they import ./app directly (see the comment at the top of app.js).

// Load variables from server/.env into process.env. This has to happen first,
// before any other module reads settings like DATABASE_URL or SESSION_SECRET.
require('dotenv').config();

const app = require('./app');

// Render (and most hosts) tell the app which port to use through the PORT
// environment variable. Locally we fall back to 3001 so we don't clash with
// the Vite dev server for the React client, which uses 5173.
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Boxy API listening on http://localhost:${PORT}`);
});
