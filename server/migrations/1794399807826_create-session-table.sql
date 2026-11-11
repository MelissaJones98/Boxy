-- 1794399807826_create-session-table.sql
--
-- Login sessions (Step 2: Auth). express-session keeps each logged-in user's
-- session data on the SERVER; the browser only holds a random session ID in a
-- cookie. connect-pg-simple stores that server-side data in this table, so
-- sessions survive a server restart or redeploy, and every server instance on
-- Render sees the same sessions.
--
-- The table shape is exactly connect-pg-simple's own table.sql
-- (node_modules/connect-pg-simple/table.sql), minus the obsolete
-- "WITH (OIDS=FALSE)", which Postgres 12+ no longer accepts.

-- Up Migration

CREATE TABLE session (
  sid    VARCHAR NOT NULL PRIMARY KEY,  -- the random session ID from the cookie
  sess   JSON NOT NULL,                 -- the session data, e.g. { "passport": { "user": 1 } }
  expire TIMESTAMP(6) NOT NULL          -- when the session stops being valid
);

-- connect-pg-simple regularly deletes expired sessions
-- (DELETE ... WHERE expire < now()), so index that column.
CREATE INDEX session_expire_idx ON session (expire);

-- Down Migration

DROP TABLE session;  -- its index is dropped along with it
