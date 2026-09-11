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
| `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD` | — | Required for email features |
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

Point the Angular app’s API base URL to your Render service, e.g.:

```text
https://<your-service-name>.onrender.com
```

Ensure `CORS_ALLOWED_ORIGINS` on Render includes every Vercel URL the browser will use (production and preview deployments).

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

## 6. Upload storage note

File uploads are stored on the container filesystem by default. Render’s disk is **ephemeral** — uploaded images are lost on redeploy unless you add persistent disk or external object storage later.
