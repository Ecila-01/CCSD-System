# CCSD / ICRMS — Deployment & Security Handover

Integrated Counseling and Referral Management System for the UB Center for Counseling and Student Development. This document is for whoever deploys the system. It is host-agnostic — it works whether you deploy on your own server, a PaaS (Render/Railway/Fly), or split static-host + API-host (Vercel/Netlify + a Node host).

The app has two parts:

- **Backend** — Node.js / Express API (`/backend`). Long-running process. Connects to MongoDB.
- **Frontend** — React single-page app (`/frontend`). Built to static files (`frontend/dist`) and served by any static host or reverse proxy.

---

## 1. Prerequisites

- **Node.js 18+** (tested on Node 22).
- **MongoDB** (Atlas or self-hosted). One database; collections are created automatically.
- A **Cloudinary** account (image uploads) and a **Gmail account with OAuth2** (transactional email). Both can be swapped for equivalents, but the code currently targets these.

---

## 2. Backend configuration (environment variables)

Create `backend/.env` (never commit it — it is git-ignored). All of these are required unless noted.

| Variable | Purpose | Notes |
|---|---|---|
| `MONGO_URI` | MongoDB connection string | Use a **least-privilege** DB user (read/write to this one DB only), not an admin-all user. |
| `JWT_SECRET` | Signs/verifies login tokens | **Must be a long, random string** (e.g. `openssl rand -base64 48`). Anyone who knows it can forge admin sessions. |
| `NODE_ENV` | Runtime mode | **Set to `production`.** Enables the safe error handler that hides internal error details. |
| `PORT` | Port the API listens on | Defaults to 5000. |
| `CORS_ORIGINS` | Comma-separated list of allowed frontend origins | e.g. `https://ccsd.university.edu`. If unset, falls back to dev origins. **Set this to your real frontend URL(s).** |
| `FRONTEND_URL` | Base URL used to build links in emails (guest tracking links) | e.g. `https://ccsd.university.edu`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Image storage | From the Cloudinary dashboard. |
| `GMAIL_USER` | Sender email address | The mailbox that sends system email. |
| `OAUTH_CLIENT_ID` / `OAUTH_CLIENT_SECRET` / `OAUTH_REFRESH_TOKEN` | Gmail OAuth2 credentials | Generated via Google Cloud + OAuth Playground. |
| `BASE_URL` | Backend's own public URL | Optional; used where the API references itself. |

### Build & run (backend)

```bash
cd backend
npm install
npm start          # runs node server.js
```

Put a process manager in front of it (systemd, pm2, or the platform's own supervisor) so it restarts on crash. Terminate TLS/HTTPS at your reverse proxy or platform. If you run behind a proxy/load balancer, `app.set('trust proxy', 1)` is already set so client IPs (used for rate limiting) resolve correctly.

---

## 3. Frontend configuration

Create `frontend/.env`:

```
VITE_API_URL=https://api.ccsd.university.edu     # the deployed backend base URL (no trailing slash)
```

### Build & serve (frontend)

```bash
cd frontend
npm install
npm run build      # outputs static files to frontend/dist
```

Serve `frontend/dist` as static files. Because it is a single-page app, configure the host to **rewrite all unknown paths to `/index.html`** (otherwise deep links like `/dashboard` 404 on refresh). Examples:

- **Vercel:** `frontend/vercel.json` already does this (rewrites + security headers).
- **nginx:** `location / { try_files $uri /index.html; }`

---

## 4. Security configuration the deployer must apply

The application code enforces authentication (JWT), role-based access, rate limiting, input sanitization, and output escaping. The following are **deployment-layer** responsibilities:

1. **Serve everything over HTTPS.** Redirect HTTP→HTTPS at the proxy. The app sends an HSTS header assuming TLS.
2. **Set `NODE_ENV=production`** and a **strong `JWT_SECRET`** (section 2).
3. **Set `CORS_ORIGINS`** to the exact frontend origin(s). Do not use `*`.
4. **Security response headers on the frontend host.** If you deploy the frontend on Vercel, `vercel.json` applies them automatically. On any other host, replicate them. Recommended set:
   - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY`
   - `Referrer-Policy: strict-origin-when-cross-origin`
   - `Strict-Transport-Security: max-age=15552000; includeSubDomains`

   The CSP's `connect-src 'self' https:` intentionally allows the frontend to reach any HTTPS backend, so it works regardless of where the API is hosted. If you want it stricter, replace `https:` with your exact backend origin.
   *nginx example:* `add_header Content-Security-Policy "..." always;` for each header.
5. **Rate limiting is in-process.** It is correct for a **single backend instance**. If you scale to multiple instances behind a load balancer, either enable sticky sessions or move the limiter to a shared store (Redis) — see `backend/middleware/security.js`.
6. **MongoDB hardening:** restrict network access to the DB (IP allowlist / private networking), use a least-privilege user, and enable automated backups.

---

## 5. First administrator account (important)

Account creation (`POST /api/users/register`) is **admin-only** — so you cannot create the very first admin through the API on a fresh database. Seed one directly:

- Insert a `User` document with `role: "admin"` and a **bcrypt-hashed** password, **or**
- Adapt `backend/migrate.js` to create the initial admin.

After the first admin exists, all further staff accounts are created from the in-app admin dashboard.

---

## 6. Post-deployment verification

1. Load the frontend, log in as the seeded admin → the dashboard should load.
2. Submit the public request form while logged out → it should succeed and send a guest-tracking email.
3. **Confirm access control:** while logged out, run
   ```bash
   curl -i https://<your-api>/api/requests
   ```
   It must return **401 Unauthorized**, not a list of records. Same for `POST /api/system/backup`. This is the proof the core protections are active.
4. Open the deployed site, press F12 → Console, and check for any **Content-Security-Policy** violation warnings. If a needed resource is blocked, widen the relevant CSP directive.

---

## 7. Dependency maintenance

Run `npm audit` in both `backend/` and `frontend/` periodically and apply `npm audit fix`. Two backend packages (`cloudinary`, `nodemailer`) may require a major-version bump (`npm audit fix --force`) — after doing so, verify **image upload/delete** and **email sending** still work. Most frontend audit findings are build-time tooling (Vite/esbuild/Babel) and do not affect the deployed static site.

---

*The application-level security controls (JWT verification, RBAC, rate limiting, NoSQL-injection sanitization, OTP hardening, output escaping) are implemented in code and require no configuration. This document covers only the environment and hosting configuration the deployer must provide.*
