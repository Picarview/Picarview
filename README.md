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
- pnpm 10.32.1
- A Cloudflare account with Workers, D1, and R2 enabled
- Wrangler authentication for production operations

Install dependencies:

```bash
pnpm install --frozen-lockfile
```

The repository is pnpm-only: its pnpm version is pinned in `package.json`, its
lockfile is committed, and installation with another package manager is rejected.

## Local development

### Public website only

```bash
pnpm run dev
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
pnpm exec wrangler d1 migrations apply picarview-cms --local
```

Then start the app:

```bash
pnpm run dev
```

Open <http://localhost:3000/admin>.

`.dev.vars`, `.wrangler`, `.next`, and `.open-next` are ignored by Git. Never commit passwords, session secrets, or generated Cloudflare credentials.

### GitHub Codespaces

To use a specific preview port:

```bash
pnpm run dev -- --hostname 0.0.0.0 --port 8976
```

Set port `8976` to **Public** in the Codespaces Ports panel if the preview must be accessible outside your account. An `app.github.dev` URL is only a proxy to the running Codespace; the development server must remain active.

An HTTP 504 from a Codespaces preview normally means nothing is listening on the selected port.

## Generated asset manifests

Do not manually maintain the generated JSON lists.

```bash
pnpm run generate:manifests
```

This scans:

- `public/hero/` and writes `src/generated/hero-frames.json`
- repository project images and writes `src/generated/project-images.json`

`pnpm run dev` and `pnpm run build` run this automatically.

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
pnpm exec wrangler login
pnpm exec wrangler whoami
```

Create storage:

```bash
pnpm exec wrangler d1 create picarview-cms
pnpm exec wrangler r2 bucket create picarview-media
```

Copy the exact D1 `database_id` returned by Cloudflare into `wrangler.jsonc`. Never invent or copy an ID from another account.

Apply all production migrations:

```bash
pnpm exec wrangler d1 migrations apply picarview-cms --remote
```

Set production secrets interactively:

```bash
pnpm exec wrangler secret put ADMIN_PASSWORD
pnpm exec wrangler secret put ADMIN_SESSION_SECRET
```

Do not put secret values in command arguments, GitHub commits, screenshots, or chat messages.

Generate Cloudflare binding types after changing `wrangler.jsonc`:

```bash
pnpm exec wrangler types --env-interface CloudflareEnv
```

## Build and validation workflow

Run the type check:

```bash
pnpm exec tsc --noEmit --pretty false
```

Run the complete production build:

```bash
pnpm run build
```

The build performs:

1. Hero and project manifest generation
2. Next.js production compilation
3. OpenNext Cloudflare Worker bundling
4. Output generation in `.open-next/`

Useful scripts:

```bash
pnpm run dev
pnpm run build
pnpm run build:cloudflare
pnpm run preview:cloudflare
pnpm run deploy:cloudflare
```

## Production deployment

### Full build and deployment

```bash
pnpm run deploy:cloudflare
```

### Deploy an already verified `.open-next` build

```bash
pnpm exec opennextjs-cloudflare deploy
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
pnpm exec tsc --noEmit --pretty false
pnpm run build
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
pnpm exec wrangler d1 migrations create picarview-cms descriptive_name
pnpm exec wrangler d1 migrations apply picarview-cms --local
pnpm exec wrangler d1 migrations apply picarview-cms --remote
```

Never edit a migration that has already run in production. Add a new numbered migration.

## SEO, Google Search Console, and crawler setup

The application generates its technical SEO files through the Next.js App Router:

| URL | Purpose |
| --- | --- |
| `https://picarview.com/robots.txt` | Allows the public site and excludes `/admin` and `/api/` |
| `https://picarview.com/sitemap.xml` | Lists the home, projects, and contact pages |

Global metadata, canonical URLs, social previews, Google preview permissions, and Organization/WebSite JSON-LD are configured in `src/app/layout.tsx`. Page-specific metadata lives beside the relevant route. The admin layout explicitly uses `noindex` and `nofollow`.

### Fresh Google Search Console setup

1. Open [Google Search Console](https://search.google.com/search-console/) and add `picarview.com` as a **Domain property**.
2. Select **Domain name provider** verification.
3. Copy the Google verification TXT value into Cloudflare under **DNS > Records**.
4. Wait for DNS propagation, then select **Verify** in Search Console.
5. Keep the TXT record permanently. Removing it can cause the property to lose verification.
6. Optionally add another method under **Settings > Ownership verification** as a recovery method.
7. Open **Sitemaps** and submit:

   ```text
   https://picarview.com/sitemap.xml
   ```

8. Use **URL Inspection** and request indexing for:

   ```text
   https://picarview.com
   https://picarview.com/projects
   https://picarview.com/contact
   ```

9. After deployment, monitor Search Console's **Page indexing**, **Sitemaps**, **Core Web Vitals**, **Security issues**, and **Manual actions** reports.

Search indexing is asynchronous. Successful verification and sitemap submission do not guarantee immediate appearance or a particular ranking.

### Adding or removing public pages

Update `src/app/sitemap.ts` whenever an indexable top-level page is added, renamed, or removed. Every public page should have a unique title, description, and canonical URL. Private dashboards and API routes must remain excluded from search.

Do not serve search engines content that differs from what visitors receive. This is search-engine cloaking and can cause ranking penalties or removal from search results. JavaScript fallbacks should remain accessible to both visitors and verified search crawlers.

### Cloudflare crawler configuration

Cloudflare **AI Crawl Control** manages AI crawlers; it is not a replacement for Google Search Console or `robots.txt`.

- Keep verified **Search Engine** crawlers such as Googlebot and Bingbot allowed.
- Choose allow, block, or charge policies for AI crawlers separately according to the company's content policy.
- Do not create a broad bot rule that challenges or blocks verified search-engine crawlers.
- After changing WAF, Bot, or AI Crawl Control settings, use Search Console URL Inspection to confirm Google can still fetch the site.

### Domain and ownership protection

For a fresh Cloudflare account or domain recovery:

- Enable DNSSEC and wait for Cloudflare to show it as active.
- Keep registrar lock and domain auto-renewal enabled.
- Require MFA for Cloudflare and registrar accounts.
- Give each team member an individual account with the minimum required permissions.
- Store recovery codes offline and keep account recovery details current.
- Review DNS records, Worker routes, redirects, and account members after any suspicious activity.
- Use scoped API tokens instead of global API keys.
- Keep one canonical hostname (`https://picarview.com`) and redirect alternate hostnames such as `www` to it.

The official square Picarview brand mark should be used for the favicon when the design team supplies it. Do not invent or crop a new brand symbol without approval.

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
pnpm exec wrangler whoami
pnpm exec wrangler d1 list
pnpm exec wrangler r2 bucket list
pnpm exec wrangler secret list
```

Confirm the binding names remain exactly `CMS_DB` and `CMS_MEDIA`.

### Admin works live but not locally

Create `.dev.vars`, apply migrations with `--local`, and restart `pnpm run dev`. Production secrets are not copied into local development automatically.

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
