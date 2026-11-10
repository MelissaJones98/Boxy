# Boxy — Project Plan

Nov 10, 2026 · @Melissa

## Overview

Boxy is a mobile-first PERN app (PostgreSQL, Express, React, Node) for cataloguing what's inside physical boxes: you create boxes, list their items, snap photos of items, move items between boxes, and lock a box so its contents can't be changed. It's built test-first.

**Who it's for:** anyone packing for a move, organising a loft or garage, or running storage for a club or small business — someone standing next to a box with a phone in one hand.

### MVP scope

| Feature | In MVP | Notes |
| --- | --- | --- |
| Accounts (sign up, log in, log out) | Yes | Needed so boxes belong to someone |
| Create, rename and delete boxes | Yes | Name required; description and location optional |
| Add, edit and delete items in a box | Yes | Name required; quantity defaults to 1 |
| Attach photos to items | Yes | Optional; taken with the phone camera or picked from files |
| Transfer an item to another box | Yes | Blocked if either box is locked |
| Lock and unlock a box | Yes | Locked box and its items are read-only |
| Search across all boxes | Stretch | "Which box is the drill in?" |
| Printable QR label per box | Stretch | Scan a box to open its page |
| Move several items at once | Stretch | Multi-select, then transfer |
| Transfer history per item | Stretch | Needs a `transfers` table |

**Decided:** locking applies to whole boxes, not individual items, and each item has at most one photo for now.

## User stories and acceptance criteria

Each criterion below is written so it can become a test name almost word for word — write the test first, watch it fail, then build.

### Accounts

*As a user, I want my own account so that only I see my boxes.*

- Signing up with a valid email and a password of 8+ characters logs me in and lands me on My Boxes.
- Signing up with an email already in use shows "An account with this email already exists".
- Logging in with a wrong password shows an error and keeps me on the login page.
- Visiting any `/boxes` page while logged out redirects to `/login`.

### Create boxes

*As a user, I want to create a box so I can record what goes in it.*

- The New box form requires a name; submitting without one shows "Name is required".
- A new box appears at the top of My Boxes showing 0 items and an unlocked icon.
- With no boxes yet, My Boxes shows an empty state with a "Create your first box" button.

### Record items

*As a user, I want to list items in a box so I know what's inside without opening it.*

- Adding an item with a name (quantity defaults to 1) shows it in the box's item list and bumps the item count.
- Editing an item's name, quantity or notes saves and shows the new values.
- An item name is required; quantity must be a whole number of 1 or more.

### Attach photos

*As a user, I want to photograph an item so I can recognise it at a glance.*

- On a phone, "Add photo" opens the rear camera; on desktop it opens a file picker.
- Only JPEG, PNG, WebP or HEIC files up to 5 MB are accepted; others show a clear error.
- An item with a photo shows a thumbnail in the item list; an item without one shows a placeholder icon.
- Each item has at most one photo; adding a new one replaces the old one (and deletes the old file). Removing a photo asks for confirmation and deletes the file from storage.

### Transfer items

*As a user, I want to move an item to another box when I repack.*

- "Move" on an item opens a sheet listing my other boxes; locked boxes are shown greyed out and can't be picked.
- Choosing a box moves the item, removes it from the current list, and shows "Moved to Kitchen — Undo".
- Undo moves the item back within 5 seconds.

### Delete items

*As a user, I want to remove an item I've taken out of the box.*

- Delete asks "Delete Hammer? This can't be undone." with Cancel and Delete buttons.
- Confirming removes the item and its photos; the item count goes down by 1.

### Lock and unlock boxes

*As a user, I want to lock a packed box so nothing in its record changes by accident.*

- Locking a box shows a lock badge on the box card and a "This box is locked" banner on its page.
- On a locked box, Add item, Edit, Move, Delete and Add photo controls are hidden or disabled.
- The API refuses any change to a locked box or its items with `423 Locked`, even if the UI is bypassed.
- Unlocking asks for confirmation, then restores all controls.

## Data model (PostgreSQL)

Four tables in a straight chain: a user has many boxes, a box has many items, an item has many photos. Deleting a box or item cascades down the chain.

### users

| Column | Type | Rules |
| --- | --- | --- |
| id | `SERIAL` | Primary key |
| email | `VARCHAR(255)` | `UNIQUE NOT NULL`, stored lower-case |
| password\_hash | `TEXT` | `NOT NULL` (bcrypt) |
| display\_name | `VARCHAR(80)` | Optional |
| created\_at | `TIMESTAMPTZ` | `DEFAULT now()` |

### boxes

| Column | Type | Rules |
| --- | --- | --- |
| id | `SERIAL` | Primary key |
| user\_id | `INTEGER` | `REFERENCES users(id) ON DELETE CASCADE` |
| name | `VARCHAR(100)` | `NOT NULL` |
| description | `TEXT` | Optional |
| location | `VARCHAR(100)` | Optional, e.g. "Loft, left side" |
| is\_locked | `BOOLEAN` | `NOT NULL DEFAULT false` |
| locked\_at | `TIMESTAMPTZ` | Set when locked, cleared when unlocked |
| created\_at / updated\_at | `TIMESTAMPTZ` | `DEFAULT now()` |

### items

| Column | Type | Rules |
| --- | --- | --- |
| id | `SERIAL` | Primary key |
| box\_id | `INTEGER` | `REFERENCES boxes(id) ON DELETE CASCADE` — changing this is a transfer |
| name | `VARCHAR(100)` | `NOT NULL` |
| quantity | `INTEGER` | `NOT NULL DEFAULT 1 CHECK (quantity > 0)` |
| notes | `TEXT` | Optional |
| created\_at / updated\_at | `TIMESTAMPTZ` | `DEFAULT now()` |

### item\_photos

| Column | Type | Rules |
| --- | --- | --- |
| id | `SERIAL` | Primary key |
| item\_id | `INTEGER` | `REFERENCES items(id) ON DELETE CASCADE` UNIQUE |
| url | `TEXT` | `NOT NULL` — public URL of the image |
| storage\_key | `TEXT` | `NOT NULL` — used to delete the file from storage |
| created\_at | `TIMESTAMPTZ` | `DEFAULT now()` |

`UNIQUE` on `item_id` enforces one photo per item. Keeping photos in their own table means allowing several later is just dropping that constraint. Add indexes on `boxes(user_id)` and `items(box_id)`.

### Lock rules (enforced on the server)

- When `boxes.is_locked` is true: no rename or delete of the box, and no create, edit, delete or photo change for its items.
- A transfer is refused if **either** the source or the destination box is locked.
- The only allowed change to a locked box is unlocking it.
- Put these checks in one Express middleware (e.g. `assertBoxUnlocked`) so every route uses the same rule and one test suite covers it.

## REST API (Express)

All routes except auth are under `/api`, need a logged-in session, and return `404` for boxes or items the user doesn't own (so other users' IDs aren't revealed).

| Method | Path | Does | Locked box → |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | Create account, start session | — |
| POST | `/api/auth/login` | Start session | — |
| POST | `/api/auth/logout` | End session | — |
| GET | `/api/auth/me` | Current user, or `401` | — |
| GET | `/api/boxes` | My boxes with item counts | Allowed |
| POST | `/api/boxes` | Create a box | — |
| GET | `/api/boxes/:boxId` | One box with its items and photo thumbnails | Allowed |
| PATCH | `/api/boxes/:boxId` | Rename / edit details | `423` |
| DELETE | `/api/boxes/:boxId` | Delete box and its contents | `423` |
| POST | `/api/boxes/:boxId/lock` | Lock | Allowed (no-op if locked) |
| POST | `/api/boxes/:boxId/unlock` | Unlock | Allowed |
| POST | `/api/boxes/:boxId/items` | Add an item | `423` |
| GET | `/api/items/:itemId` | One item with its photos | Allowed |
| PATCH | `/api/items/:itemId` | Edit name, quantity, notes | `423` |
| DELETE | `/api/items/:itemId` | Delete item and its photos | `423` |
| POST | `/api/items/:itemId/transfer` | Body `{ "toBoxId": 7 }` | `423` if source or target locked |
| POST | `/api/items/:itemId/photo` | `multipart/form-data`, field `photo` | `423` |
| DELETE | `/api/items/:itemId/photo` | Remove a photo | `423` |

Transfer gets its own route rather than a `box_id` edit through PATCH: it needs checks on two boxes, it's easy to test on its own, and it's where transfer history would go later. Uploading a photo to an item that already has one replaces it. Return errors as `{ "error": "message" }` with `400` for validation, `401` not logged in, `404` not found, `423` locked.

## Frontend (React)

Nine screens, designed at 375 px wide first and widened at a 768 px breakpoint. Each one matches a wireframe on the design canvas.

| Route | Screen | Key components |
| --- | --- | --- |
| `/` | Welcome | `Hero`, links to sign up / log in |
| `/signup`, `/login` | Auth forms | `AuthForm`, `FormField`, `ErrorMessage` |
| `/boxes` | My Boxes | `BoxList`, `BoxCard`, `LockBadge`, `EmptyState`, `Fab` (+ New box) |
| `/boxes/new`, `/boxes/:boxId/edit` | Box form | `BoxForm` |
| `/boxes/:boxId` | Box detail | `BoxHeader`, `LockToggle`, `LockedBanner`, `ItemList`, `ItemRow` |
| `/boxes/:boxId/items/new`, `/items/:itemId/edit` | Item form | `ItemForm`, `PhotoPicker` |
| `/items/:itemId` | Item detail | `PhotoGallery`, `ItemActions` (Edit, Move, Delete) |
| sheet over Item detail | Move item | `TransferSheet`, `BoxPicker` |
| dialog | Confirm | `ConfirmDialog` (delete, unlock) |

A shared `AppShell` holds the top bar and back button; `ProtectedRoute` redirects logged-out users.

**State:** Redux Toolkit with `authSlice`, `boxesSlice` and `itemsSlice` (thunks for each API call) fits what the Codecademy course teaches. React Router v6 for routing.

**Mobile-first details:** tap targets at least 44 × 44 px; the primary action sits in a bottom-right floating button within thumb reach; Move and Delete open bottom sheets rather than small menus.

## Photos, auth and security

**Photos:** the browser does the camera work — `<input type="file" accept="image/*" capture="environment">` opens the rear camera on phones with no extra library. On the server, Multer handles the upload with a 5 MB limit and an image MIME-type filter. Store files in a hosted service such as Cloudinary (free tier, gives back a URL and a public ID for `storage_key`); in tests, swap it for a fake storage module so tests never hit the network.

**Auth:** Passport.js local strategy with `express-session` and `connect-pg-simple` (sessions stored in Postgres), passwords hashed with bcrypt — the pattern the Codecademy course covers. Session cookie set `httpOnly`, `sameSite: 'lax'`, and `secure` in production.

**Security checklist**

- Every query filters by `user_id` from the session, never from the request body.
- Parameterised queries only (`pg` with `$1` placeholders).
- Validate request bodies (e.g. `express-validator`) and return `400` with field messages.
- `helmet` for headers, CORS limited to the client's origin, and rate-limit the login route.
- Secrets (`DATABASE_URL`, `SESSION_SECRET`, Cloudinary keys) in `.env`, never committed.

## TDD strategy

Test each feature from the outside in: write the failing API test, make it pass, then write the failing component test and build the UI against a mocked API.

| Layer | Tools | What to test |
| --- | --- | --- |
| API routes | Jest + Supertest, separate `boxy_test` database | Status codes, response bodies, ownership (`404` for someone else's box), every `423` lock case |
| Database queries | Jest against `boxy_test` | Cascade deletes, `CHECK` constraints, transfer moving `box_id` |
| React components | Jest + React Testing Library + `user-event` | Forms, validation messages, lock state hiding controls, empty states |
| API mocking in the client | Mock Service Worker (MSW) | Success, error and `423` responses without a running server |
| End-to-end (stretch) | Playwright or Cypress at a 375 px viewport | Sign up → create box → add item with photo → move → lock |

- Reset the test database before each test file (run migrations, then `TRUNCATE ... RESTART IDENTITY CASCADE`).
- Query by role and label in RTL (`getByRole('button', { name: /lock box/i })`) — it doubles as an accessibility check.
- Run tests on every push with GitHub Actions and a Postgres service container.

## Build order

Each milestone ends with a working, tested slice you could demo. Locking comes before transfer and photos because both of those have to respect it.

1. **Setup:** monorepo with `client/` (Vite + React) and `server/` (Express), Postgres migrations, Jest in both, GitHub Actions running tests.
2. **Auth:** sign up, log in, log out, `/me`, protected routes.
3. **Boxes:** create, list, view, rename, delete, plus the empty state.
4. **Items:** add, edit, delete inside a box; item counts on box cards.
5. **Lock and unlock:** the `assertBoxUnlocked` middleware, then UI badges, banner and hidden controls.
6. **Transfer:** transfer route, Move sheet, Undo toast.
7. **Photos:** upload route with fake storage in tests, `PhotoPicker`, thumbnails, delete photo.
8. **Polish and deploy:** 768 px layout, loading and error states, accessibility pass, deploy (e.g. Render for API + Postgres, client as a static site).
9. **Stretch:** search, QR labels, multi-select move, transfer history.

- [x] Decide: box-level lock only, or per-item lock too? **Box-level only.**
- [x] Decide: one photo per item for the MVP, or several? **One per item.**
