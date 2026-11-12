# CCSD / ICRMS — Deployment & Security Handover

Integrated Counseling and Referral Management System for the UB Center for Counseling and Student Development. This document is for whoever deploys the system. It is host-agnostic — it works whether you deploy on your own server, a PaaS (Render/Railway/Fly), or split static-host + API-host (Vercel/Netlify + a Node host).

The app has two parts:

- **Backend** — Node.js / Express API (`/backend`). Long-running process. Connects to MongoDB.
- **Frontend** — React single-page app (`/frontend`). Built to static files (`frontend/dist`) and served by any static host or reverse proxy.

---

## 1. Prerequisites

- **Node.js 18+** (tested on Node 22).
- **MongoDB** (Atlas or self-hosted). One database; collections are created automatically.
- An approved outbound email service with SMTP access. The backend uses Nodemailer, so the provider can be the university relay or another SMTP service.
- MongoDB (Atlas or university-managed) and Cloudinary (or an alternative image/object storage service, which requires adapting the upload integration).

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
| `MAIL_HOST` | SMTP server hostname | Obtain from MIS or the selected email provider. |
| `MAIL_PORT` | SMTP port | Usually `587` for STARTTLS or `465` for implicit TLS; use the value MIS approves. Defaults to `587`. |
| `MAIL_SECURE` | Whether to use implicit TLS | Set `true` for port `465`; normally `false` for STARTTLS on `587`. |
| `MAIL_FROM` | Approved sender email address | MIS must authorize this sender/domain for the application. |
| `MAIL_USER` / `MAIL_PASSWORD` | Optional SMTP authentication | Set only if the university relay requires credentials. Keep the password in the hosting provider's secret store. |
| `BASE_URL` | Backend's own public URL | Optional; used where the API references itself. |
| `MONGODB_DNS_SERVERS` | Optional DNS resolver override | Development workaround only for networks that block Atlas SRV lookups. Do not set in production unless MIS directs it. |

### Build & run (backend)

```bash
cd backend
npm install
npm start          # runs node server.js
```

> **Dependency note:** image uploads go through the official `cloudinary` v2 SDK
> directly (`middleware/upload.js` uses multer memory storage +
> `cloudinary.uploader.upload_stream`). The unmaintained `multer-storage-cloudinary`
> wrapper was removed because it only declares a `cloudinary@^1` peer dependency and
> breaks a plain `npm install` on strict npm hosts (Render, CI). Do not re-add it.

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
   - `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
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

## 7. University turnover checklist

Transfer ownership before asking MIS to operate production. The university should own the source repository, hosting projects, domain/DNS, database organization, image storage account, and email sender. Do not transfer personal passwords; create university-owned accounts and rotate credentials.

### Decisions and access MIS needs to provide

- **Hosting and domain:** choose where to run the Node.js backend and serve the Vite static frontend; provide the production frontend and API hostnames, TLS certificates, DNS access, and deployment/restart method. The frontend needs a single-page-app fallback to `/index.html` for routes such as `/dashboard`.
- **Database:** choose university-managed MongoDB or an institution-owned Atlas organization; provision a database, least-privilege application user, network/private connectivity, backups, retention, and a migration window. The app stores requests, accounts, services, schedules, announcements, departments, and system settings in MongoDB.
- **Email:** choose an approved SMTP relay/provider and supply host, port, TLS mode, approved sender, and optional authentication. Confirm allowed recipients, sending limits, SPF/DKIM/DMARC or relay policy, and whether password-reset and guest-link emails are permitted. The app sends submission links, status/cancellation/reschedule notices, reminders, counselor notifications, and password-reset OTPs.
- **Images:** decide whether to keep Cloudinary under a university-owned account or migrate uploads to university object storage. Current image uploads use Cloudinary; changing provider requires code changes and migrating existing image URLs/assets.
- **Secrets and users:** create fresh production values for `JWT_SECRET`, database credentials, SMTP credentials (if used), and Cloudinary credentials. Seed the first admin securely, then let that admin create staff accounts. Never copy secrets into Git, tickets, or this guide.
- **Operations and privacy:** name service owners, support contacts, monitoring/log retention, incident response, database backup/restore responsibility, data retention, and an approved process for student-data access. Confirm institutional privacy/security review before production cutover.

### Environment handoff

Set backend variables in the university host's secret manager (or a protected server environment file): `MONGO_URI`, `JWT_SECRET`, `NODE_ENV=production`, `CORS_ORIGINS`, `FRONTEND_URL`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_SECURE`, `MAIL_FROM`, and optional `MAIL_USER`/`MAIL_PASSWORD`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`. The platform supplies `PORT` when applicable. Set frontend build variable `VITE_API_URL` to the university API origin. `VITE_API_URL` is embedded in the public frontend bundle and must never contain a secret.

### Suggested cutover sequence

1. MIS provisions university-owned hosting, database, SMTP sender/relay, domain, and image-storage account (or approves keeping Cloudinary).
2. Export and securely transfer database records and upload assets as approved; verify ownership and access before changing DNS.
3. Configure fresh secrets, build/deploy the frontend with the new API URL, and deploy the backend with the exact frontend origin in CORS.
4. Validate login/roles, request submission and guest links, password-reset OTP, counselor notifications, status messages, scheduled reminders, uploads, database backup/restore, and deep-link refresh.
5. Switch DNS, monitor logs and email delivery, then revoke personal-account credentials and hosting access after MIS accepts operations.

## 8. Dependency maintenance

Run `npm audit` in both `backend/` and `frontend/` periodically and apply `npm audit fix`. Two backend packages (`cloudinary`, `nodemailer`) may require a major-version bump (`npm audit fix --force`) — after doing so, verify **image upload/delete** and **email sending** still work. Most frontend audit findings are build-time tooling (Vite/esbuild/Babel) and do not affect the deployed static site.

---

*The application-level security controls (JWT verification, RBAC, rate limiting, NoSQL-injection sanitization, OTP hardening, output escaping) are implemented in code and require no configuration. The university must still approve the hosting, data handling, and external services described above.*
