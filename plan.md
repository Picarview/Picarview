# Picarview Client Portal Plan

**Status:** Planning approved in principle; implementation has not started  
**Last updated:** July 23, 2026  
**Purpose:** Preserve the agreed direction for Picarview's customer accounts, designer workspace, project delivery, storage quotas, and future paid storage plans.

## 1. Product vision

Picarview will add a secure client portal to the existing public website and CMS. Customers will have accounts where they can see their projects, upload reference files, receive work from assigned Picarview designers, review versions, and download final deliverables.

This should behave like a focused creative-project workspace rather than a general-purpose cloud drive.

The existing public website and owner CMS should remain operational and logically separate from customer authentication and private client files.

## 2. Is it achievable?

Yes. The existing Next.js application and Cloudflare deployment can support it.

Recommended platform responsibilities:

- **Cloudflare Worker/OpenNext:** application pages, APIs, authentication checks, permissions, and download authorization.
- **Cloudflare D1:** users, accounts, projects, assignments, file metadata, quotas, plans, activity, and audit records.
- **Cloudflare R2:** private customer uploads and designer deliverables.
- **Cloudflare Turnstile:** bot protection on signup, login, password reset, and other sensitive public forms.
- **Transactional email provider:** verification emails, password resets, project assignments, and delivery notifications.
- **Stripe or equivalent:** paid storage upgrades and subscription lifecycle when billing is introduced.
- **Optional Cloudflare Stream:** optimized video previews if customers need in-browser video streaming or transcoding. Original production files can remain in R2.

## 3. User roles

### Customer

A customer can:

- Create an account or accept an invitation, depending on the final signup policy.
- Verify their email and manage their password and sessions.
- See only their own organization and projects.
- Upload briefs, documents, images, videos, fonts, and other permitted references.
- View project status and assigned designer information.
- Receive draft, revision, and final files from Picarview.
- Download authorized files.
- Leave review notes or comments.
- See storage used, storage available, and current plan.
- Request or purchase additional storage.

### Designer

A designer can:

- See only customers and projects assigned to them.
- Read the project brief and access customer reference files.
- Upload drafts, revisions, previews, and final deliverables.
- Create new delivery versions without overwriting earlier versions.
- Move assigned projects through permitted workflow states.
- Read customer feedback and respond where enabled.

A designer should not automatically see every customer, manage subscriptions, change account ownership, or permanently delete customer uploads.

### Owner/Admin

An owner or administrator can:

- Manage customers, designers, roles, and account access.
- Create projects and assign designers.
- Access all projects and delivery histories.
- Control storage plans and account-specific allowances.
- Suspend or archive accounts and projects.
- Review storage usage, subscriptions, uploads, downloads, and audit events.
- Retain access to the existing website CMS.

## 4. Proposed application areas

Suggested route structure:

```text
/                         Public Picarview website
/projects                 Public selected-work archive
/admin                    Existing owner CMS
/portal                   Customer dashboard
/portal/projects/:id      Customer project workspace
/studio                   Designer workspace
/studio/projects/:id      Assigned designer project workspace
/account                  Profile, security, sessions, and storage plan
```

The final route names can change, but the customer, designer, and owner permissions must remain separate.

## 5. Customer dashboard

The first customer dashboard should include:

- Welcome and account summary.
- Active project cards.
- Current project status and due dates where applicable.
- Recent activity.
- Recent designer deliveries.
- Upload reference files.
- Secure file previews where the format is safe.
- Download actions.
- Storage meter, for example: `312 MB of 500 MB used`.
- Upgrade or request-more-storage action.
- Account and security settings.

## 6. Designer dashboard

The designer workspace should include:

- Assigned-project queue.
- Search and status filtering.
- Customer brief and project details.
- Customer reference-file access.
- Upload draft, revision, preview, or final deliverables.
- Version history.
- Customer review notes.
- Project-status controls.
- Activity history.

## 7. Project workflow

Recommended statuses:

```text
New
  → Brief received
  → In progress
  → For review
  → Revision requested
  → Approved
  → Delivered
  → Archived
```

Status transitions should be permission-controlled. For example, a customer may request a revision or approve a delivery, while the assigned designer may submit work for review.

Each project should contain:

- Customer account.
- Assigned designer or designers.
- Title, description, and brief.
- Status and optional deadline.
- Customer uploads.
- Designer deliveries.
- File versions.
- Review notes or messages.
- Activity history.
- Created, updated, delivered, and archived timestamps.

## 8. File and version model

Files should be immutable after a completed upload. Replacing a delivery should create a new version instead of overwriting the original object.

Example:

```text
Logo package
├── Version 1 — For review
├── Version 2 — Revised
└── Version 3 — Final delivery
```

Each file record should include:

- Unique file ID.
- Owning account and project.
- Uploader and uploader role.
- Original filename.
- Private R2 object key.
- MIME type and validated file type.
- Actual byte size.
- Checksum where supported.
- Purpose: customer reference, designer draft, preview, or final delivery.
- Version number.
- Upload status: pending, quarantined, ready, rejected, or deleted.
- Created and deleted timestamps.

## 9. R2 storage architecture

Use a private R2 bucket. Do not expose the bucket through public `r2.dev` URLs.

Suggested object-key layout:

```text
clients/{account-id}/projects/{project-id}/customer-uploads/{file-id}
clients/{account-id}/projects/{project-id}/deliveries/{delivery-id}/{file-id}
clients/{account-id}/avatars/{file-id}
```

Object paths help organize files but are not authorization. Every API action must verify the authenticated user, account membership, role, and project access.

Downloads should use either:

- An authenticated Worker response that streams the authorized R2 object; or
- A short-lived presigned GET URL generated only after authorization.

Uploads should go directly from the browser to R2 using a short-lived presigned PUT URL. Large files should use multipart/resumable uploads. This avoids sending large files through the application Worker and improves reliability.

Official references:

- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/)
- [Cloudflare R2 presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/)
- [Cloudflare R2 upload guidance](https://developers.cloudflare.com/r2/objects/upload-objects/)

## 10. The 500 MB quota

R2 does not automatically give each customer an isolated 500 MB drive. Picarview must enforce a logical per-account quota in D1.

Use **500 MiB**, equal to **524,288,000 bytes**, as the included allowance unless the business chooses decimal 500 MB instead.

Suggested account counters:

```text
storage_limit_bytes
storage_used_bytes
storage_reserved_bytes
```

### Safe upload sequence

1. The browser sends the proposed filename, type, and byte size.
2. The server verifies the session, account, project, extension, MIME type, and size policy.
3. D1 atomically reserves the proposed bytes only if:

   ```text
   used bytes + reserved bytes + proposed bytes <= storage limit
   ```

4. The server creates a pending file record and short-lived upload permission.
5. The browser uploads directly to the assigned R2 object key.
6. The server performs a finalize request and checks the actual R2 object size and metadata.
7. The pending record becomes ready.
8. Reserved bytes decrease and used bytes increase by the verified size.
9. Failed or abandoned uploads release their reservations and remove partial objects.

The reservation step prevents simultaneous uploads from bypassing the quota.

### Deletion and quota recovery

- A normal delete should first become a soft delete.
- Soft-deleted files should be excluded from the customer interface but retained for a defined recovery period.
- The product must decide whether soft-deleted files continue counting against quota during that recovery period. Recommended: they continue counting until permanently removed.
- Permanent deletion removes the R2 object and decrements used storage exactly once.
- Quota changes and deletion events must be recorded in the audit log.

### Reconciliation

A scheduled reconciliation task should periodically compare D1 metadata with R2 objects. It should identify:

- Pending uploads that expired.
- R2 objects with no database record.
- Database records whose R2 object is missing.
- Incorrect account usage totals.

## 11. Proposed storage plans

Initial plan structure:

| Plan | Storage allowance | Intended use |
|---|---:|---|
| Included | 500 MiB | Every active customer account |
| Plus | 5 GB | Customers with larger project references and deliverables |
| Studio | 25 GB | Ongoing or media-heavy customer relationships |
| Custom | Configurable | Large accounts, video work, or retained archives |

Plan names, prices, upload limits, and retention policies should live in D1 rather than being hard-coded.

Suggested configurable plan fields:

```text
name
storage_limit_bytes
maximum_single_file_bytes
maximum_active_projects
retention_days
monthly_price
currency
active
```

Do not price plans using raw R2 storage cost alone. Pricing must also account for project management, support, file operations, backups, scanning, authentication, email, payment fees, and Picarview's service value.

## 12. Storage cost estimates

As of July 2026, Cloudflare documents R2 Standard storage at **$0.015 per GB-month**, with **10 GB-month of Standard storage included each month** and no R2 internet egress charge. Operations are billed separately after their included usage.

If every customer completely consumes the included allowance:

| Customers | Maximum stored data | Approximate storage charge after 10 GB free tier |
|---:|---:|---:|
| 20 | 10 GB | $0.00/month |
| 100 | 50 GB | $0.60/month |
| 500 | 250 GB | $3.60/month |
| 1,000 | 500 GB | $7.35/month |

These are planning estimates, not a full operating-cost forecast. R2 request operations, Workers, D1, email, authentication, payment processing, malware scanning, monitoring, preview generation, and optional video streaming are separate costs. Pricing should be rechecked before launch.

## 13. Authentication

The existing single-password CMS session must not be reused for customer accounts.

The portal authentication system needs:

- Unique user accounts.
- Verified email addresses.
- Secure password hashing through a proven authentication library or managed authentication provider.
- Password reset with short-lived, single-use tokens.
- Revocable sessions.
- Session/device listing.
- Rate-limited signup, login, verification, and reset endpoints.
- Role and account membership checks on every protected request.
- Optional two-factor authentication, strongly recommended for designers and mandatory or strongly encouraged for administrators.
- Secure, `HttpOnly`, `Secure`, `SameSite` session cookies.

Cloudflare Access is useful for workforce applications but should not be treated as the default customer-signup product. We should select a customer-identity solution that works cleanly with Next.js on Cloudflare and supports the required email and session workflows.

## 14. Turnstile and abuse protection

Protect signup, login, password reset, resend-verification, invitation acceptance, and other abuse-prone public actions with Cloudflare Turnstile.

Turnstile tokens must be verified on the server. Client-side rendering alone is not protection.

Official references:

- [Cloudflare Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/)
- [Cloudflare Turnstile server-side validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)

## 15. File security

Customer project files may be confidential. Required safeguards:

- Private R2 bucket.
- No permanent public file URLs.
- Short-lived authorized downloads.
- File extension, MIME type, and magic-byte validation.
- Maximum file-size and file-count limits.
- Random server-generated R2 keys; never trust filenames as object keys.
- Store the original filename as metadata only.
- Prevent inline execution of arbitrary HTML, JavaScript, and SVG.
- Force unsafe formats to download using appropriate `Content-Disposition` headers.
- Quarantine newly uploaded files until validation or scanning completes.
- Malware scanning before files become available to other users.
- Do not send confidential customer files to public malware-analysis services.
- Audit uploads, downloads, replacements, approvals, deletions, assignments, and role changes.
- Rate limits for upload initialization, finalization, downloads, and invitations.
- Account suspension and session revocation controls.

## 16. Video policy

If videos only need to be uploaded and downloaded, store them in R2.

If customers need smooth browser playback, adaptive quality, thumbnails, and transcoding:

- Keep the original production file in private R2.
- Create an authorized preview copy through Cloudflare Stream or another private video service.
- Treat Stream usage as a separate cost from the customer's raw R2 quota unless the business chooses otherwise.

## 17. Notifications

Potential notifications:

- Verify your email.
- Password reset requested.
- Customer invited to Picarview.
- Designer assigned to a project.
- Customer uploaded new references.
- Designer submitted work for review.
- Customer requested a revision.
- Final delivery is ready.
- Storage is 80%, 90%, or 100% full.
- Payment or subscription status changed.

Notifications should exist inside the dashboard, with important events also sent by email. Email delivery failures should be logged and retried safely.

## 18. Billing and storage upgrades

Billing should be introduced only after the free quota workflow is stable.

Recommended flow:

1. Customer chooses a storage plan.
2. Server creates a hosted Stripe Checkout session.
3. Stripe collects payment details.
4. A verified Stripe webhook records the subscription and changes the account quota.
5. The dashboard displays the resulting plan and allowance.

The application must never trust a browser redirect as proof of payment.

Downgrade rules must be decided before launch. Recommended behavior when usage exceeds the new plan:

- Do not delete files automatically.
- Prevent new uploads.
- Allow downloads and deletions.
- Show a clear over-quota warning.
- Give the customer a grace period to reduce usage or restore the larger plan.

## 19. Suggested D1 model

Likely tables:

```text
users
accounts
account_members
sessions
email_verification_tokens
password_reset_tokens

projects
project_assignments
project_messages
project_activity

files
file_versions
upload_reservations

storage_plans
subscriptions
billing_events
notifications
audit_logs
```

Every customer-owned row should contain or resolve to an `account_id`. Tenant isolation must be included directly in database queries instead of loading a record first and checking ownership later wherever possible.

A shared D1 database is appropriate for the first version. One database per customer would add operational complexity without an immediate benefit. Cloudflare currently documents a 10 GB maximum per D1 database on Workers Paid, with horizontal scale-out available later if required: [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/).

## 20. Delivery phases

### Phase 0 — Product decisions and technical proof

- Decide public signup versus invitation-only access.
- Decide who creates projects.
- Confirm initial permitted file types and maximum single-file size.
- Confirm whether customer organizations can have multiple members.
- Confirm customer/designer messaging requirements.
- Select authentication and transactional-email providers.
- Decide whether the first release needs billing.
- Build a proof of direct private R2 upload, finalize, quota reservation, and authorized download.

**Exit condition:** The team has approved product rules and the storage proof works without exposing private files.

### Phase 1 — Identity and tenancy foundation

- Implement customer-grade authentication.
- Email verification and password reset.
- Customer, designer, and admin roles.
- Accounts and memberships.
- Protected route layouts.
- Turnstile and endpoint rate limits.
- Session management and revocation.
- Permission helpers and automated authorization tests.
- Audit-log foundation.

**Exit condition:** Each role can sign in and can access only the correct empty workspace.

### Phase 2 — Customer portal and storage

- Customer dashboard.
- Project list and project detail.
- Secure upload initialization and direct R2 upload.
- Upload finalization and verification.
- 500 MiB quota, reservations, and storage meter.
- Authorized downloads.
- Soft deletion and recovery rules.
- Upload/activity history.
- Basic notifications.

**Exit condition:** A customer can safely upload and retrieve project files without exceeding quota or accessing another account.

### Phase 3 — Designer workspace and delivery

- Designer dashboard.
- Project assignment.
- Customer reference access.
- Versioned draft and final delivery uploads.
- Review and approval workflow.
- Customer review notes.
- Delivery notifications.
- Final-delivery download area.

**Exit condition:** A designer can deliver work to one selected customer while all other customer data remains inaccessible.

### Phase 4 — Storage plans and billing

- Plan-management UI.
- Stripe Checkout.
- Verified and idempotent webhooks.
- Upgrade, downgrade, cancellation, and grace-period behavior.
- Billing history and admin overrides.
- Storage-threshold warnings.

**Exit condition:** Plan changes reliably modify quotas and duplicate webhooks cannot duplicate billing state.

### Phase 5 — Production hardening

- Private malware-scanning workflow.
- Multipart/resumable large uploads.
- Scheduled storage reconciliation.
- Monitoring and error alerts.
- Backup and recovery procedures.
- Two-factor authentication.
- Security review and tenant-isolation tests.
- Accessibility and performance review.
- Data-retention and account-deletion workflow.
- Support documentation and incident procedures.

**Exit condition:** The system is ready for real confidential customer projects and has documented recovery procedures.

## 21. Testing requirements

At minimum, automated tests must prove:

- A customer cannot read another customer's project.
- A customer cannot download another customer's R2 object by changing an ID.
- A designer can access only assigned projects.
- A suspended user loses access immediately.
- An expired or revoked session is rejected.
- Simultaneous uploads cannot exceed quota.
- A failed upload releases reserved storage.
- Finalization rejects an object whose real size differs from the reservation.
- Permanent deletion decrements quota only once.
- Replayed Stripe webhooks are idempotent.
- Archived projects do not accidentally expose files.
- Unsafe file types cannot execute inside the Picarview origin.

## 22. Operational recommendations

- Use separate development/staging and production resources before the portal handles real client data.
- Keep client R2 storage separate from the existing public CMS media bucket.
- Never place customer files in the repository.
- Never log passwords, session tokens, presigned URLs, or private filenames unnecessarily.
- Document database migrations and apply them before compatible Worker releases.
- Introduce feature flags for signup and paid plans.
- Begin with a small invited-customer pilot.
- Monitor upload failures, quota discrepancies, authentication failures, and unusual download volume.

## 23. Recommended MVP boundary

The first useful release should include:

- Invitation-only customer accounts.
- One owner-admin role and one designer role.
- Picarview-created projects.
- Customer reference uploads.
- Designer versioned deliveries.
- Customer downloads and simple review notes.
- 500 MiB enforced storage.
- In-dashboard and email delivery notifications.
- No paid billing initially.

This boundary reduces account abuse and lets Picarview validate the workflow with real customers before public signup and subscriptions are introduced.

## 24. Open decisions for the next session

These must be answered before implementation:

1. **Signup policy:** Can anyone sign up, or must Picarview invite each customer?
2. **Project creation:** Can customers create projects, or does Picarview create and assign them?
3. **Account membership:** Can one customer company invite multiple employees?
4. **File policy:** Which extensions are permitted, and what is the maximum size of one file?
5. **Video:** Download-only videos, or browser streaming and previews?
6. **Reviews:** Simple written notes, or comments attached to specific files and versions?
7. **Retention:** How long should deleted files remain recoverable?
8. **Billing:** Is paid storage required in the first release or after the pilot?
9. **Plans:** Are 500 MiB, 5 GB, and 25 GB acceptable starting allowances?
10. **Notifications:** Which events require email in addition to dashboard alerts?

## 25. Recommended starting point when work resumes

Do not start by designing all dashboard screens.

Resume in this order:

1. Answer the open business decisions above.
2. Choose the authentication and email approach.
3. Define the permission matrix for customer, designer, and admin.
4. Write the initial D1 schema and migrations.
5. Build a narrow storage proof:
   - authenticated upload intent;
   - atomic quota reservation;
   - direct private R2 upload;
   - upload finalization;
   - authorized download;
   - safe deletion and quota recovery.
6. Test cross-account isolation and simultaneous quota usage.
7. Only then build the polished customer and designer dashboard interfaces.

The most important rule for the next phase is: **authorization and quota enforcement belong on the server. The dashboard must never be trusted to decide what a user may access or how much storage remains.**
