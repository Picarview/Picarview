# Picarview

Picarview is a motion-led creative portfolio and content-managed website built with Next.js, GSAP, and Cloudflare. It includes a protected admin dashboard for managing projects, partner logos, the hero background, and the four “Selected expressions” images without editing source code.

## Current production architecture

- **Application:** Next.js 15 App Router and React 19
- **Cloudflare adapter:** OpenNext for Cloudflare
- **Runtime:** Cloudflare Worker
- **Production Worker:** `picarview-landing`
- **Database:** Cloudflare D1, bound as `CMS_DB`
- **Media storage:** Cloudflare R2, bound as `CMS_MEDIA`
- **Static assets:** Cloudflare Worker Assets, bound as `ASSETS`
- **Animations:** GSAP and ScrollTrigger
- **Smooth scrolling:** Lenis
- **Styling:** Tailwind CSS and project CSS in `src/app/globals.css`
- **Production URL:** <https://picarview-landing.devlab-8a9.workers.dev>
- **Admin dashboard:** <https://picarview-landing.devlab-8a9.workers.dev/admin>

This is deployed as a **Cloudflare Worker through OpenNext**, not as a static Cloudflare Pages site. The old Worker named `picarview` was retired; do not recreate or deploy to it.

## Main features

- Optimized, scroll-scrubbed canvas hero sequence with responsive frame skipping
- Optional CMS-managed hero image or streaming MP4/WebM video
- Native byte-range delivery for hero video playback
- Four CMS-managed “Selected expressions” image slots
- Animated service, partners, projects, contact, and editorial sections
- Full project archive with a two-column mobile grid and full-screen viewer
- CMS-managed projects and partner logos with repository fallbacks
- Draft/published states, search, date filters, sorting, and paginated admin library
- D1 metadata and R2 media lifecycle management
- Responsive desktop, tablet, and mobile layouts

## Repository structure

```text
Picarview/
├── migrations/
│   ├── 0001_content.sql
│   ├── 0002_admin_login_security.sql
│   └── 0003_site_media.sql
├── public/
│   ├── hero/                  # Repository hero frame fallback
│   ├── images/                # Repository project/section fallbacks
│   └── fonts/
├── scripts/
│   ├── generate-hero-manifest.mjs
│   └── generate-project-manifest.mjs
├── src/
│   ├── app/
│   │   ├── admin/             # Admin dashboard
│   │   ├── api/admin/         # Authenticated mutation APIs
│   │   ├── api/cms/           # Public content/media APIs
│   │   ├── contact/
│   │   ├── projects/
│   │   └── page.tsx
│   ├── components/
│   ├── generated/             # Generated fallback manifests
│   ├── hooks/
│   └── lib/cloudflare-cms.ts
├── .dev.vars.example
├── next.config.js
├── open-next.config.ts
├── package.json
└── wrangler.jsonc
```

## Prerequisites

- Node.js 20 or newer
- npm
- A Cloudflare account with Workers, D1, and R2 enabled
- Wrangler authentication for production operations

Install dependencies:

```bash
npm install
```

## Local development

### Public website only

```bash
npm run dev
```

Open <http://localhost:3000>.

The development script regenerates both asset manifests before starting Next.js.

### Local CMS and admin dashboard

Create a local secrets file from the committed example:

```bash
cp .dev.vars.example .dev.vars
```

Replace both placeholder values in `.dev.vars`:

```dotenv
ADMIN_PASSWORD=your-local-admin-password
ADMIN_SESSION_SECRET=a-long-random-session-secret
```

Generate a secure session secret with:

```bash
openssl rand -hex 32
```

Apply the D1 migrations to local Wrangler storage:

```bash
npx wrangler d1 migrations apply picarview-cms --local
```

Then start the app:

```bash
npm run dev
```

Open <http://localhost:3000/admin>.

`.dev.vars`, `.wrangler`, `.next`, and `.open-next` are ignored by Git. Never commit passwords, session secrets, or generated Cloudflare credentials.

### GitHub Codespaces

To use a specific preview port:

```bash
npm run dev -- --hostname 0.0.0.0 --port 8976
```

Set port `8976` to **Public** in the Codespaces Ports panel if the preview must be accessible outside your account. An `app.github.dev` URL is only a proxy to the running Codespace; the development server must remain active.

An HTTP 504 from a Codespaces preview normally means nothing is listening on the selected port.

## Generated asset manifests

Do not manually maintain the generated JSON lists.

```bash
npm run generate:manifests
```

This scans:

- `public/hero/` and writes `src/generated/hero-frames.json`
- repository project images and writes `src/generated/project-images.json`

`npm run dev` and `npm run build` run this automatically.

## CMS behavior

### Projects and partners

- D1 stores titles, descriptions, status, ordering, timestamps, and R2 object keys.
- R2 stores the uploaded image bytes.
- Published CMS projects replace repository project fallbacks.
- When no CMS content exists, the committed images remain visible.
- New projects receive their display order automatically.
- Deleting an entry removes both its D1 row and R2 object.

### Hero media

The `hero` CMS slot accepts:

- PNG, JPG, WebP, or AVIF up to 10 MB
- MP4 or WebM video up to 40 MB

When a CMS hero image or video is active, the 240-frame fallback sequence is not downloaded. Videos use native browser playback and byte-range responses. Restoring the original removes the R2 override and brings back the canvas sequence.

### Selected expressions

Slots `expression-1` through `expression-4` accept validated images up to 10 MB. Each slot independently falls back to its repository image when no override exists.

## Cloudflare resources

The checked-in `wrangler.jsonc` uses:

| Binding | Resource |
| --- | --- |
| `CMS_DB` | D1 database `picarview-cms` |
| `CMS_MEDIA` | R2 bucket `picarview-media` |
| `ASSETS` | `.open-next/assets` |

The Worker name is controlled by:

```jsonc
"name": "picarview-landing"
```

Changing this value creates or targets a different Worker. Do not change it casually.

## First-time Cloudflare setup

The production resources already exist. These commands are only for a fresh Cloudflare account or disaster recovery.

Authenticate:

```bash
npx wrangler login
npx wrangler whoami
```

Create storage:

```bash
npx wrangler d1 create picarview-cms
npx wrangler r2 bucket create picarview-media
```

Copy the exact D1 `database_id` returned by Cloudflare into `wrangler.jsonc`. Never invent or copy an ID from another account.

Apply all production migrations:

```bash
npx wrangler d1 migrations apply picarview-cms --remote
```

Set production secrets interactively:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Do not put secret values in command arguments, GitHub commits, screenshots, or chat messages.

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```bash
npx wrangler types --env-interface CloudflareEnv
```

## Build and validation workflow

Run the type check:

```bash
npx tsc --noEmit --pretty false
```

Run the complete production build:

```bash
npm run build
```

The build performs:

1. Hero and project manifest generation
2. Next.js production compilation
3. OpenNext Cloudflare Worker bundling
4. Output generation in `.open-next/`

Useful scripts:

```bash
npm run dev
npm run build
npm run build:cloudflare
npm run preview:cloudflare
npm run deploy:cloudflare
```

## Production deployment

### Full build and deployment

```bash
npm run deploy:cloudflare
```

### Deploy an already verified `.open-next` build

```bash
npx opennextjs-cloudflare deploy
```

Prefer the OpenNext deployment command. It uploads static assets, the Worker bundle, routes, and bindings in the format expected by the adapter.

After deployment, verify:

```bash
curl -I https://picarview-landing.devlab-8a9.workers.dev/
curl -I https://picarview-landing.devlab-8a9.workers.dev/admin
```

Expected result: `HTTP 200`.

### Important: GitHub and Cloudflare are separate

`git push` updates GitHub. An OpenNext/Wrangler deployment updates Cloudflare directly. One does not automatically guarantee the other is current.

```text
Local source ── git push ──▶ GitHub
      │
      └── OpenNext deploy ──▶ Cloudflare Worker
```

For every release:

1. Pull the latest branch.
2. Make and review the change.
3. Run TypeScript and the full production build.
4. Apply any new D1 migrations with `--remote`.
5. Deploy through OpenNext.
6. Verify the live site and admin routes.
7. Commit and push the exact deployed source.
8. Open or update the PR into `master`.

This order prevents Cloudflare from running code that is missing from GitHub.

## Git workflow

Create a focused branch:

```bash
git switch -c feature/short-description
```

Before pushing:

```bash
git status
git diff --check
npx tsc --noEmit --pretty false
npm run build
```

Commit and push:

```bash
git add <changed-files>
git commit -m "Describe the change"
git push -u origin feature/short-description
```

Use a pull request to merge into `master`. Do not commit `.dev.vars`, `.env`, `.open-next`, `.next`, `.wrangler`, tokens, or passwords.

## Database migrations

Migration history:

- `0001_content.sql` — projects and partners
- `0002_admin_login_security.sql` — login-attempt rate limiting
- `0003_site_media.sql` — hero and selected-expression slots

When adding a schema change:

```bash
npx wrangler d1 migrations create picarview-cms descriptive_name
npx wrangler d1 migrations apply picarview-cms --local
npx wrangler d1 migrations apply picarview-cms --remote
```

Never edit a migration that has already run in production. Add a new numbered migration.

## Security notes

The admin system includes:

- Signed 12-hour session cookies
- `HttpOnly`, `Secure`, and `SameSite=Strict` cookie settings
- Five-attempt, 15-minute login lockout per client IP
- Timing-safe password and signature comparison
- Authentication on every admin data route
- Same-origin mutation checks
- Prepared D1 statements
- Input length and request-size limits
- File MIME allowlists and byte-signature validation
- Cryptographic UUID object keys
- CSP, frame, MIME-sniffing, permission, referrer, and HTTPS headers

Optional future hardening: protect a dedicated hostname such as `admin.picarview.com` with Cloudflare Access and MFA. Do not protect the entire public Worker unless visitors are intended to authenticate.

## Troubleshooting

### Codespaces preview returns 504

The development server is stopped, crashed, using a different port, or the port visibility is private. Restart Next.js on the same port and check the Codespaces Ports panel.

### CSS or Next.js chunks return 404/MIME errors

Stop the development server, remove the stale `.next` build output, and restart. Do not delete user source or public assets.

### Admin says D1 or R2 is not configured

Check:

```bash
npx wrangler whoami
npx wrangler d1 list
npx wrangler r2 bucket list
npx wrangler secret list
```

Confirm the binding names remain exactly `CMS_DB` and `CMS_MEDIA`.

### Admin works live but not locally

Create `.dev.vars`, apply migrations with `--local`, and restart `npm run dev`. Production secrets are not copied into local development automatically.

### Upload appears slow

- Images are limited to 10 MB.
- Hero video is limited to 40 MB.
- The upload modal reports browser-to-Worker progress and then the R2/D1 save phase.
- Large video files should be compressed before upload even when they are below the limit.

### Wrangler says the Worker does not exist

Confirm `wrangler.jsonc` contains `"name": "picarview-landing"` and that Wrangler is authenticated to the `devlab@picarview.com` Cloudflare account.

## Additional documentation

See [docs/CLOUDFLARE_CMS_SETUP.md](docs/CLOUDFLARE_CMS_SETUP.md) for the focused CMS provisioning checklist.

## License

Private Picarview project. All rights reserved.
