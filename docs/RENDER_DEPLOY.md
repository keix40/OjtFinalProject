# Deploy backend to Render + Aiven MySQL

The Spring Boot API lives in `backend/Ecommerce`. The Angular frontend remains on **Vercel**; only the backend is deployed to **Render** using the Dockerfile in this directory.

## Prerequisites

- [Render](https://render.com) account connected to GitHub repo `keix40/OjtFinalProject`
- [Aiven](https://aiven.io) MySQL service with database and user created
- Secrets ready (never commit real values to git)

## 1. Aiven MySQL JDBC URL

In the Aiven console, open your MySQL service → **Overview** → **Connection information**.

Build `DB_URL` with SSL (required for Aiven):

```text
jdbc:mysql://<HOST>:<PORT>/<DATABASE>?sslMode=REQUIRED&serverTimezone=UTC
```

Alternative (older drivers):

```text
jdbc:mysql://<HOST>:<PORT>/<DATABASE>?useSSL=true&requireSSL=true&serverTimezone=UTC
```

Use the **Service URI** host/port and your database name. Do **not** paste the full URI with credentials into `DB_URL` — set username and password separately.

## 2. Render setup (Blueprint)

1. Merge the PR that adds `render.yaml`, `Dockerfile`, and `application-prod.properties`.
2. In Render: **New → Blueprint** → select this repository.
3. Render reads `render.yaml` and creates the `ojt-ecommerce-api` web service.
4. Open the service → **Environment** and set secret values (`sync: false` keys in the blueprint).

### Required secrets

| Variable | Description |
|----------|-------------|
| `DB_URL` | Aiven JDBC URL with `sslMode=REQUIRED` (see above) |
| `DB_USER` | Aiven MySQL username |
| `DB_PASSWORD` | Aiven MySQL password |
| `JWT_SECRET` | At least 64 random characters (HS512) |

### Recommended / optional

| Variable | Default | Notes |
|----------|---------|--------|
| `CORS_ALLOWED_ORIGINS` | `https://ojt-final-project.vercel.app` | Comma-separated Vercel production + preview URLs |
| `COOKIE_DOMAIN` | (empty) | Set if cookies must span subdomains |
| `RESEND_API_KEY` | — | **Recommended.** [Resend](https://resend.com) HTTPS API (works on Render free; SMTP is often blocked) |
| `MAIL_FROM` | — | Verified sender, e.g. `Britium Gallery <noreply@yourdomain.com>` (use Resend onboarding domain for testing) |
| `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` | — | Optional SMTP fallback when `RESEND_API_KEY` is unset (Gmail SMTP usually fails on Render) |
| `REDIS_ENABLED` | `false` | Set `true` + `REDIS_URL` for multi-instance JWT blacklist / rate limits |
| `TWILIO_*`, `IPQS_API_KEY` | — | Optional integrations |

Render sets `PORT` automatically. `SPRING_PROFILES_ACTIVE=prod` is defined in `render.yaml`.

## 3. Health check

After deploy succeeds:

```text
https://<your-service-name>.onrender.com/actuator/health
```

Expected: HTTP `200` with body `{"status":"UP"}`.

Render uses `/actuator/health` as the service health check path (see `render.yaml`).

## 4. Frontend (Vercel)

Set the Vercel project **Root Directory** to `frontend/Ecommerce` (or deploy from repo root using the root `vercel.json`).

Production uses **same-origin relative URLs** (`/api`, `/product/...`) with **Vercel rewrites** proxying to Render (`https://ojtfinalproject.onrender.com`). This keeps HttpOnly auth cookies on the Vercel origin (`SameSite=Lax` + `Secure`) without cross-site cookie issues.

Ensure `CORS_ALLOWED_ORIGINS` on Render includes every Vercel URL the browser will use (production and preview deployments).

### Email on Render

Gmail SMTP (`smtp.gmail.com:587`) typically **times out** on Render’s free tier. Configure:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
MAIL_FROM="Britium Gallery <onboarding@resend.dev>"
```

Register, OTP, forgot-password, and login-OTP flows use `EmailService`, which sends via Resend when `RESEND_API_KEY` is set. Without it, the API returns **503** with a clear message instead of an opaque 500.

## 5. Local Docker smoke test

From the repo root:

```bash
docker build -t ojt-ecommerce-api ./backend/Ecommerce
docker run --rm -p 8080:8080 \
  -e SPRING_PROFILES_ACTIVE=prod \
  -e DB_URL='jdbc:mysql://host:port/db?sslMode=REQUIRED&serverTimezone=UTC' \
  -e DB_USER=your_user \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET='your-local-dev-secret-at-least-64-characters-long-for-testing-only' \
  ojt-ecommerce-api
```

Then open `http://localhost:8080/actuator/health`.

## 6. Static assets and upload storage

The API serves user-uploaded and catalog images from local directories mapped in `WebConfig` (`product_image`, `uploads`, `brand_and_category_image`, `review`, `return_images`, `event`). The Dockerfile creates these as **empty** directories at `/app` so handlers resolve cleanly; it does **not** bundle the repo’s large `product_image.zip` sample set.

### Ephemeral disk on Render

Render’s filesystem is **ephemeral**. Any file written at runtime (profile photos, product uploads, etc.) is **lost on redeploy, restart, or spin-down**. Missing files return **HTTP 404** (`Static asset not found`), not 500.

For production:

1. **Recommended:** Object storage (Cloudflare R2, AWS S3, etc.) with the app storing URLs instead of local paths.
2. **Alternative:** [Render persistent disk](https://render.com/docs/disks) mounted at `/app/uploads` (and the other dirs if needed).
3. **Not recommended:** Baking a full catalog image zip into the Docker image — the sample archive is ~98MB and bloats every deploy.

After a fresh deploy with an empty MySQL database, catalog rows may reference image filenames that are not on disk until you re-upload assets or restore from backup/storage.
