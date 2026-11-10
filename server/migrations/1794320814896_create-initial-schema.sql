-- 1794320814896_create-initial-schema.sql
--
-- The first migration: Boxy's four tables, as planned in CLAUDE.md ("Data model").
--
-- node-pg-migrate splits this file at the two marker comments below. It runs the
-- "Up" half for `migrate up` and the "Down" half for `migrate down`, and records
-- which migrations have run in its own `pgmigrations` table, so each runs once.
-- The number at the front of the filename is a timestamp, which keeps every
-- future migration in the order it was created.
--
-- NEVER edit this file once it has run anywhere you care about (e.g. Render).
-- Change the schema by creating a NEW migration: `npm run migrate:create -w server -- <name>`.

-- Up Migration

-- Ownership chain: a user has many boxes, a box has many items, an item has
-- (for now) one photo. ON DELETE CASCADE runs down that chain, so deleting a
-- box removes its items and their photo rows in the same statement.

CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,  -- the app lower-cases it before saving
  password_hash TEXT NOT NULL,                 -- bcrypt hash, never the password itself
  display_name  VARCHAR(80),
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE boxes (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  location    VARCHAR(100),                    -- free text, e.g. "Loft, left side"
  is_locked   BOOLEAN NOT NULL DEFAULT false,
  locked_at   TIMESTAMPTZ,                     -- set on lock, cleared on unlock
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()        -- the app sets this on every PATCH
);

CREATE TABLE items (
  id         SERIAL PRIMARY KEY,
  box_id     INTEGER NOT NULL REFERENCES boxes(id) ON DELETE CASCADE,  -- changing it = a transfer
  name       VARCHAR(100) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE item_photos (
  id          SERIAL PRIMARY KEY,
  -- UNIQUE enforces one photo per item. Dropping it later allows several,
  -- which is why photos have their own table instead of a column on items.
  item_id     INTEGER NOT NULL UNIQUE REFERENCES items(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,                   -- public image URL from Cloudinary
  storage_key TEXT NOT NULL,                   -- Cloudinary public ID, needed to delete the file
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Postgres indexes primary keys and UNIQUE columns automatically, but NOT
-- foreign keys. These two cover the API's most common lookups:
-- "my boxes" (WHERE user_id = $1) and "items in this box" (WHERE box_id = $1).
CREATE INDEX ON boxes (user_id);
CREATE INDEX ON items (box_id);

-- Down Migration

DROP TABLE item_photos;
DROP TABLE items;
DROP TABLE boxes;
DROP TABLE users;

-- tables are dropped in this order because Postgres won't drop a table while there are still foreign keys pointing at it