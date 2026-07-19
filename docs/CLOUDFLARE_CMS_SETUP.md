# Picarview Cloudflare CMS setup

The CMS uses:

- D1 binding `CMS_DB` for content metadata.
- R2 binding `CMS_MEDIA` for project images and partner logos.
- Worker secrets `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` for dashboard access.

## 1. Authenticate Wrangler

```bash
npx wrangler login
npx wrangler whoami
```

## 2. Create the Cloudflare resources

```bash
npx wrangler d1 create picarview-cms
npx wrangler r2 bucket create picarview-media
```

Copy the `database_id` returned by the D1 command into `wrangler.jsonc`:

```jsonc
"d1_databases": [
  {
    "binding": "CMS_DB",
    "database_name": "picarview-cms",
    "database_id": "THE_REAL_D1_DATABASE_ID",
    "migrations_dir": "migrations"
  }
],
"r2_buckets": [
  {
    "binding": "CMS_MEDIA",
    "bucket_name": "picarview-media"
  }
]
```

Never invent or reuse a database ID. Use the exact ID returned by Cloudflare.

## 3. Apply the database migration

```bash
npx wrangler d1 migrations apply picarview-cms --remote
```

For local-only testing:

```bash
npx wrangler d1 migrations apply picarview-cms --local
```

## 4. Set production secrets

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Use a unique admin password. Generate the session secret with a password manager or:

```bash
openssl rand -base64 48
```

For local development, copy `.dev.vars.example` to `.dev.vars` and replace both values.

## 5. Build and deploy

```bash
npm run build
npx wrangler deploy
```

Open `/admin`, sign in, and upload a test partner logo and project image. Published content appears automatically on the website.

## Storage behavior

- Images are stored as R2 objects under `partners/` or `projects/`.
- D1 stores the object key, title, subtitle, alt text, order, and publication state.
- Deleting an entry removes both its D1 record and its R2 object.
- The upload endpoint accepts PNG, JPG, WebP, and AVIF files up to 10 MB.
- File signatures are checked server-side; changing an unsafe file's extension or MIME type is not sufficient.
- Login attempts are limited to five failures per client IP in a 15-minute window.
- Admin sessions use signed, `HttpOnly`, `Secure`, `SameSite=Strict` cookies with a 12-hour lifetime.
- Global CSP, clickjacking, MIME-sniffing, referrer, browser-permission, and HTTPS headers are enabled.
