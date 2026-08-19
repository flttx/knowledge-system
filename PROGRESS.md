# Project Progress

## Status

- T01–T34: DONE before this task, including T13 Wikilink Parser and all
  previously completed wikilink, graph, search, PWA, export, CLI, suggestion,
  security, and performance work.
- T31 Codex Relation Discovery: DONE.
- T32 Local Ask Knowledge: DONE.
- T33 Observability and Security Hardening: DONE.
- T34 Performance Pass: DONE.
- T35 End-to-End Acceptance Pass: IN_PROGRESS; i18n closure and automated
  validation are complete, but visual browser acceptance remains blocked by the
  unavailable in-app browser runtime.

## UI Layout Architecture Reset

- Status: IN_PROGRESS. This task resets shared page geometry and route layout
  behavior while preserving the current Editorial Workspace visual language,
  domain behavior, and i18n architecture.
- Before implementation findings: PageContainer centers each max-width page,
  causing visible left-edge drift; Inbox, Library, and Notes still contain
  permanent creation forms; route titles still mix task labels with slogan-like
  copy; header/action placement is not yet shared.
- T35 remains pending until genuine browser acceptance passes.

## UI and Project Standards

- Status: DONE. Established durable UI and engineering standards without
  changing product behavior, schema, or user content.
- UI source of truth: `DESIGN.md` now uses the canonical token frontmatter and
  eight-section structure; it defines colors, typography, four layouts, depth,
  shapes, component states, accessibility, responsive rules, and Do/Don'ts.
- Design sidecar: `.impeccable/design.json` records motion, breakpoints,
  component previews, narrative rules, and non-frontmatter design extensions.
- Project source of truth: `PROJECT.md` defines architecture boundaries,
  directory responsibilities, TypeScript/React rules, UI implementation rules,
  data/security constraints, validation gates, Git delivery, and spec-change flow.
- Documentation checks: canonical DESIGN headings were checked and
  `.impeccable/design.json` parsed successfully as JSON.
- T35 remains pending; documentation work does not count as browser visual
  acceptance.
- Layout primitives created: four shared geometry variants via `PageContainer`
  (`list`, `detail`, `writing`, `canvas`), shared `PageHeader`,
  `WorkspacePageHeader`, `DetailPageHeader`, `Section`, `ActionBar`,
  `PropertyList`, `PropertyRow`, `Surface`, `EmptyState`, and accessible
  `WorkspaceDialog`.
- Geometry rules: 224px desktop sidebar, 40px desktop main padding, common
  left edge, list max 1160px, detail max 960px, writing max 760px, and canvas
  uses the remaining workspace width.
- Heading rules: muted 12px eyebrow, 28–32px page title, 32–36px detail title,
  34–38px Note title, 17–20px section title, 15–16px body, and 12–13px
  metadata. Slogan-like primary titles were replaced with task-oriented copy.
- Action placement rules: primary page actions sit in the top-right header;
  detail actions sit in the detail header; row actions remain at row right;
  Capture is the creation entry point for new Inbox content.
- Creation/edit interaction changes: Inbox route now renders review-only
  `InboxReview` with a Quick capture action; Library Add Source and Notes New
  Note are dialogs with focus management and trigger focus restoration; Source
  detail remains read-first with on-demand edit.
- Responsive behavior: shared headers wrap below 640px, main padding is 16px
  narrow / 24px tablet / 40px desktop, list rows stack naturally, and Graph
  remains full-width.
- i18n: added layout-specific zh-CN/en copy keys for task-oriented headings,
  descriptions, Inbox review guidance, Capture title, and dialog close labels;
  user content and locale architecture remain unchanged.
- Routes migrated in this reset: `/home`, `/inbox`, `/library`,
  `/library/[sourceId]`, `/notes`, `/notes/[noteId]`, `/search`, `/graph`,
  `/settings`, `/settings/local-agent`, `/settings/export`, and `/capture`.
- Validation after this reset: `npm run typecheck`, `npm run lint`, `npm test`
  (16 passed, 30 existing PostgreSQL-dependent tests skipped), `npm run build`,
  `npm run db:generate` (no schema changes), and `git diff --check` all passed.
- Layout detector result: `detect.mjs --scope layout` returned `[]` for the
  changed UI targets.
- Runtime HTTP check: `/login` returned 200, unauthenticated `/inbox` returned
  307 to `/login`, and unauthenticated `/api/db/health` returned 401.
- Browser visual verification: no connected in-app browser or equivalent
  Playwright runtime was available, so the required 1440/1280/1024/768/600/480/430
  viewport screenshot pass was not claimed.
- Issues found and fixed during closeout: preserved the legacy `notes.title`
  translation contract while routing the new page title through `layout.*`, and
  restored exact zh-CN/en key parity for the new layout copy.
- Known limitation: T35 visual acceptance remains pending; no database/schema
  or user-content behavior was changed by this layout reset.

## Editorial Workspace UI Upgrade

- Status: IN_PROGRESS. This deliberate whole-product visual upgrade preserves
  Quiet Editorial product behavior while moving the application toward a
  denser, content-first Editorial Workspace.
- Before implementation: reviewed the current shell, design tokens, route
  components, i18n messages, and the existing Quiet Editorial pass. The
  current UI relies on repeated rounded white cards, a persistent Source edit
  island, and one broad page container; these are the primary visual risks to
  address without changing domain behavior.
- Reference projects to review for principles only: Memoa/Uotion, Novel,
  Omnivore, and Lokus. No source, branding, unique assets, or pixel-copying
  will be used.
- T35 remains pending until real browser acceptance passes; automated checks
  and source inspection do not satisfy that gate.
- Reference projects reviewed for design principles: Memoa/Uotion, Novel,
  Omnivore, and Lokus. Extracted principles: content-page surfaces, restrained
  editor chrome, excerpt-first Inbox hierarchy, and one coherent workspace.
- Redesigned routes/components so far: `/login`, `/home`, `/inbox`, `/library`,
  `/library/:sourceId`, `/capture`, `/notes`, `/notes/:noteId`, `/search`,
  `/graph`, `/settings`, `/settings/export`, and `/settings/local-agent`.
- Shared components changed: AppShell, Button, new workspace primitives
  (PageContainer, PageHeader, Section, Surface, ListRow, PropertyList,
  PropertyRow, EmptyState, ActionBar), and global editorial tokens.
- Responsive decisions: reading pages remain narrow, detail pages use a
  medium measure, list/workspace pages expand to 1220px, Graph uses full
  available width, and Capture remains focused for split-screen use.
- i18n effect: no locale architecture or user content changed; existing UI
  message keys remain the source of labels. English width still requires real
  browser verification.
- Defects found during implementation: Source detail exposed a permanent edit
  form and broad card framing; fixed by on-demand read/edit state and inline
  properties. Browser visual defects remain unverified until a browser is
  available.
- Final implementation status: shared Editorial Workspace shell, page-width
  system, Source read/edit property page, dense Inbox/Notes/Library/Search
  rows, narrow Note editor, full-width Graph, focused Capture, and restrained
  Settings/Export/Local Agent surfaces are implemented. `DESIGN.md` records
  the durable visual system.
- Exact routes changed: `/login`, `/home`, `/inbox`, `/library`,
  `/library/[sourceId]`, `/capture`, `/notes`, `/notes/[noteId]`, `/search`,
  `/graph`, `/settings`, `/settings/export`, `/settings/local-agent`.
- Validation actually run: `npm run typecheck` PASS; `npm run lint` PASS;
  `npm test` PASS (46 tests, 16 pass, 30 existing PostgreSQL-dependent tests
  skipped by suite conditions); `npm run build` PASS; `npm run db:generate`
  PASS with no migration; `git diff --check` PASS; Impeccable detector PASS
  with no findings; runtime `/login` 200 and unauthenticated
  `/api/db/health` 401.
- Browser verification truth: not completed. No connected in-app browser was
  available, and Playwright control was unavailable in the runtime. No
  desktop/tablet/narrow screenshot acceptance is claimed; T35 remains
  IN_PROGRESS/PENDING for real browser verification.
- Known unresolved visual issues: English and 430px/480–600px split-screen
  layouts still need real viewport inspection; no screenshot evidence exists
  for Source detail, Inbox, Note detail, Home, Notes, Search, Graph, Settings,
  or Capture.

## Quiet Editorial UI and i18n pass

- Added a restrained editorial token system: warm neutral surfaces, one blue
  accent, system typography, light dividers, and reduced-motion handling.
- Added server-selected zh-CN / en UI copy with a browser cookie named
  knowledge_locale and no locale URL prefixes. User content, Markdown, and
  wikilink text remain unchanged.
- Updated the application shell, login, home, settings, Notes, Capture,
  Search, Sources, Graph, and Export surfaces to use the shared language
  provider and responsive layout.
- Added locale behavior tests. No database schema or migration was changed.
- Audited active application UI copy and localized Inbox, Suggestions, Graph,
  Backlinks, Sources, Notes, Export, loading states, and accessibility labels.
- Preserved user-authored Markdown, titles, tags, highlights, QuickNotes, Source
  data, and Local Agent proposal text as content rather than translatable UI.
- T35 browser acceptance is the only remaining acceptance gate; no T36 or later
  work is in scope.

## Authentication maintenance refactor

- Replaced environment-variable login with database-backed users using
  normalized usernames, scrypt password hashes, and active/disabled status.
- Added opaque 30-day browser sessions. Only SHA-256 token hashes are stored;
  multiple sessions per user are valid concurrently and logout revokes one
  session only.
- Added per-user Local Agent token storage, one-time token display, individual
  revocation, and authenticated settings management.
- Preserved the existing owner ID and existing Sources, Highlights, QuickNotes,
  Notes, Tags, AI suggestions, and Attachments during migration `0004`.
- Removed the old `AUTH_*` and `LOCAL_AGENT_TOKEN_HASH` runtime dependency.

## Current decisions

- The Web application remains the canonical system of record.
- Local Codex may write only validated proposal files under `.local-knowledge/suggestions/`.
- Relation proposals remain pending until explicit Web confirmation.
- Relation storage preserves directional `sourceNoteId -> targetNoteId` semantics.
- Rejected relation pairs remain available as rejection memory and are not silently converted to confirmed relations.
- Local Ask creates a UTF-8 request file for manual Codex use; it does not invoke a model or upload corpus content.

## Database and migrations

- PostgreSQL 16 is the validation database.
- Existing T05 schema and migrations through `0003_large_centennial.sql` were
  applied before this task. Authentication migration `0004_strong_skreet.sql`
  adds `user_status`, `sessions`, `local_agent_tokens`, and credential fields
  on `users`; it was applied to the real PostgreSQL 16 validation database.

## Authentication security

- Password verification is asynchronous scrypt with a random salt and constant-
  time derived-key comparison.
- Session cookies are HttpOnly, SameSite=Lax, Secure in production, explicit
  30-day expiry cookies. Raw tokens and passwords are never stored in cookies.
- Local Agent bearer requests resolve ownership only through the matching
  active token row and owning active user; the request cannot choose a user ID.
- Unknown server errors return a stable generic response; SQL text and stack
  details are logged/returned neither to API clients nor to browser UI.

## Validation

Validation completed after the authentication maintenance refactor:

- `npm run typecheck`: PASS with TypeScript 5.9.3.
- `npm run lint`: PASS.
- `npm test`: PASS, 43/43 tests against real PostgreSQL 16.
- `npm run build`: PASS, including production TypeScript checking.
- `npm run db:generate`: PASS, no schema changes after migration `0004`.
- `npm run db:migrate`: PASS against real PostgreSQL 16.
- `npm run db:seed`: PASS; the seed check reported one active user.
- Runtime HTTP check: `/login` returned 200 and unauthenticated
  `/api/db/health` returned 401.
- Manual relation flow: pull Notes, push relation, Web API confirm, repeated confirm, reject, and pull rejected memory all verified.
- Manual Local Ask flow: Chinese request file generated, UTF-8 content preserved, response path deterministic, no credentials written, and Codex was not invoked.

## Authentication simplification validation

- Correct, incorrect, empty, and missing-password configuration paths are covered by the server-side comparison/config tests.
- Signed session creation, expiration, and tamper rejection are covered by
  tests and the manual server-side check.
- `HttpOnly`/`SameSite`/`Secure` cookie flags and logout cookie clearing were
  verified in the server implementation; an HTTP request without a session
  returned `401` for `/api/inbox`.
- A source audit confirms the old environment credentials are not imported by
  client modules, returned by API responses, stored in cookies, or written to
  `.local-knowledge/` files.

## T33–T35 completion evidence

- Protected-page proxy rejects requests without a session cookie; private
  layouts and APIs verify the opaque session against the database and active
  user rather than trusting cookie presence or a client-supplied owner ID.
- Added baseline security response headers: `nosniff`, frame denial, strict referrer policy, and a restrictive permissions policy.
- Bounded Inbox source queries and filtered global Graph relation queries to the visible Note candidate set.
- Added `docs/DEPLOYMENT.md` with local PostgreSQL, migration, seed, Vercel, backup, auth, CLI, export, PWA, and unsupported-feature checklists.
- Real PostgreSQL 16 acceptance covered Note CRUD/archive/restore, ownership and tag boundaries, Markdown preservation, Sources/Highlights/QuickNotes, Inbox, graph/search/export, and Local Agent auth.
- CLI acceptance covered `status`, `pull --inbox`, `pull --notes`, `pull --all`, `push`, and `ask`; the request file contained no credentials.
- Autosave inspection and the serial queue test confirmed that an older response cannot clear a newer draft because save completion is guarded by the edit revision.

## Known validation limitation

- The in-app browser runtime was not used for a visual multi-device screenshot
  pass. Browser login mechanics are covered by the server implementation and
  real database session tests; final visual/browser acceptance remains T35.
- UI pass validation: typecheck, lint, tests (46/46), and production build
  passed. `db:generate` reported no schema changes, and `db:migrate` was
  applied successfully against real PostgreSQL 16.
- Browser availability check returned no connected in-app browser instances;
  therefore desktop/tablet/narrow visual acceptance was not claimed.
- The production server was started on port 3100 for a runtime check; the
  unauthenticated `/api/db/health` response was correctly `401`.

## Next

- T35 browser acceptance remains pending because no connected browser instance
  was available for the required route, viewport, locale, and screenshot pass.
  Stop here; T36 and later work remain deferred.
