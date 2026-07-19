# Hotel Cloud Solution — Build Log

## Status: backend + frontend built and tested end-to-end against PostgreSQL

Stack: **Firebase Hosting/Auth/Storage** (frontend + identity), **Render**
(Node.js/Express backend), **Aiven for PostgreSQL** (free tier database).

> Note: this project started out on MySQL and was converted to PostgreSQL
> partway through — `schema.sql` and every query in `backend/src/routes/`
> use Postgres syntax (`$1, $2` placeholders, `SERIAL`, native `ENUM` types).
> Don't mix in MySQL syntax if you extend this later.

```
backend/
  src/
    config/db.js          pg connection pool, with CA-cert SSL support
    config/firebase.js    Firebase Admin SDK (only loaded once DEV_SKIP_AUTH=false)
    middleware/auth.js     requireAuth / requireRole, with a local DEV_SKIP_AUTH bypass
    routes/rooms.js        list rooms, update room status
    routes/guests.js       create guest, staff guest search
    routes/reservations.js create booking (rejects overlaps), list, check-in, check-out
    routes/invoices.js     create invoice, mark paid, list (finance/management only)
    server.js               Express app, /api/health
  schema.sql                5 tables (with ENUM types) + sample rooms
  certs/                    put your downloaded Aiven CA certificate here
  .env.example
frontend/                   React (Vite)
  src/api.js                 fetch wrapper, sends x-dev-role header for local testing
  src/pages/BookingPage.jsx  guest-facing: room list + booking form
  src/pages/StaffDashboard.jsx staff: reservations, check-in/out, invoices, role switcher
  .env.example
```

### What's been verified end-to-end
Full flow tested against a real Postgres database: create guest → create
reservation → **overlapping booking on the same room correctly rejected
(409)** → check-in flips the room to `occupied` → invoice created by
`front_desk` → invoice list correctly blocked for `front_desk` (403) but
visible to `management` → check-out flips the room to `cleaning`. All in a
single DB transaction where relevant, so reservation status and room status
can never go out of sync.

## Deploying live (current step)

1. **Database — Aiven for PostgreSQL, free tier.** Create the service, download
   its CA certificate into `backend/certs/aiven-ca.pem`, and run `schema.sql`
   against it via the Aiven console's query editor.
2. **Backend — Render.** New Web Service from your GitHub repo, root directory
   `backend`, build `npm install`, start `npm start`. Set env vars from
   `backend/.env.example` using your real Aiven values. Commit
   `backend/certs/aiven-ca.pem` to git first (it's a public cert, not a secret)
   so Render has it. Confirm `<render-url>/api/health` returns
   `{"status":"ok","database":"connected"}`.
3. **Frontend — Firebase Hosting.** Set `VITE_API_URL` in
   `frontend/.env.local` to `<render-url>/api`, `npm run build`,
   `firebase init hosting` (public dir: `dist`, single-page app: yes),
   `firebase deploy`. The URL Firebase gives you is the one for the report.
4. Tighten `CORS_ORIGIN` on Render to the exact Firebase URL once you have it.

## Run it locally instead

```bash
# backend
cd backend
npm install
cp .env.example .env   # then point DB_HOST etc. at either your local Postgres
                        # or your live Aiven service — both work the same way
npm run dev

# frontend
cd frontend
npm install
npm run dev             # http://localhost:5173
```

`DEV_SKIP_AUTH=true` in `.env` lets every staff route work via the frontend's
role dropdown, without needing a Firebase project yet.
