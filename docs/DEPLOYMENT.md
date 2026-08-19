# Deployment and production checklist

This project is a private Next.js application. PostgreSQL is the system of
record; the Web application is the only canonical writer for Notes, Sources,
Inbox items, tags, and relations. Accounts are provisioned administratively;
public registration and OAuth are intentionally out of scope.

## Required environment variables

Set these as server-side variables. Do not use a `NEXT_PUBLIC_` prefix.

```env
DATABASE_URL=postgresql://user:password@host:5432/knowledge_system
```

Browser users and Local Agent tokens are stored in PostgreSQL. No password,
session secret, or bearer token is required in the deployment environment.
Provision the first user after migrations with the administrative command below;
the password is entered interactively and only its scrypt hash is stored.

## PostgreSQL setup

Use PostgreSQL 16 or a compatible managed PostgreSQL service. The schema uses
the `pg_trgm` extension for active-record search indexes. Enable it before
applying migrations if the provider does not allow the migration user to
create extensions:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

From a clean checkout, install dependencies and apply the checked-in Drizzle
migrations:

```bash
npm install
npm run db:migrate
npm run db:seed
npx tsx scripts/user-admin.ts create --username xuqing
```

For an older installation, preserve the existing owner ID and run:

```bash
npx tsx scripts/user-admin.ts set-password --user-id <existing-user-id> --username <username>
```

Run `npm run db:generate` only after an intentional change to `db/schema.ts`.
Inspect the generated SQL before committing it; do not hand-edit generated
migrations. Back up the database before applying production migrations.

For local PostgreSQL 16, the repository's documented port is `55432`:

```bash
docker run --detach --name knowledge-system-postgres \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=knowledge_system \
  --publish 55432:5432 \
  postgres:16-alpine

# .env.local
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:55432/knowledge_system
```

Verify connectivity after login with `GET /api/db/health`. This endpoint
requires the authenticated Web session and returns only a health result, not
database credentials or query details.

## Vercel checklist

- Configure all required environment variables separately for Preview and
  Production.
- Point `DATABASE_URL` at a managed PostgreSQL database reachable from Vercel;
  do not use `127.0.0.1` in deployment.
- Run `npm run db:migrate` from a controlled release job against the target
  database before serving code that depends on a new schema.
- Run `npm run db:seed` as a connectivity/schema check. It does not create an
  account or overwrite user data.
- Confirm the deployment can reach PostgreSQL and that the login flow creates
  an `httpOnly`, `sameSite=lax` session cookie. Production cookies are secure.
- Each browser or device can log in independently. Sessions are opaque,
  server-side records with a 30-day lifetime; logging out revokes only the
  current session and does not invalidate other devices.
- Review Vercel function logs for status and error rates. Application errors
  return stable API error codes; raw database errors are not returned to users.
- Configure a managed PostgreSQL backup and test restoration separately from
  application deployment. The application does not provide backup or restore
  orchestration.

Revoke an individual Local Agent token from `/settings/local-agent`. The raw
token is shown only once; if it is lost, create a new token and revoke the old
one. To invalidate every browser session, revoke or delete session rows in a
controlled maintenance operation.

## Data portability and unsupported operations

- `POST /api/export` creates a Markdown-preserving ZIP archive. Attachment
  export is metadata-only because upload/storage is not implemented.
- The PWA manifest is available, but there is no service worker or offline
  synchronization. Private API responses are not cached by a service worker.
- The local CLI pulls canonical data and submits validated suggestions; it does
  not connect directly to PostgreSQL or invoke Codex.
- PDF upload/reading, embeddings, semantic/hybrid search, Web chatbot,
  automatic AI runners, and full offline sync are intentionally unsupported.

## Pre-release verification

Run against a validation PostgreSQL instance before release:

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

Also exercise authenticated API ownership boundaries, export, graph/search,
local CLI pull/push/ask flows, and the Note autosave failure/retry path. Do not
call a release accepted until the real database and the intended deployment
environment have both been checked.
