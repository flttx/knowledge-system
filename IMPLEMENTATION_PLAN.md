# IMPLEMENTATION_PLAN.md

## Purpose

This document converts the product specification into an executable engineering plan for AI coding agents and human developers.

Primary references:

```text
AGENTS.md
docs/DEVELOPMENT_SPEC.md
```

Use this file to decide **what to implement next**.

Do not skip ahead unless the current task explicitly requires it.

---

# 1. Execution Rules

For every task:

1. Read `AGENTS.md`.
2. Read the relevant sections of `docs/DEVELOPMENT_SPEC.md`.
3. Inspect the current repository state.
4. Implement only the requested task and its direct dependencies.
5. Avoid speculative refactors.
6. Run the listed validation commands.
7. Report:
   - implemented
   - key decisions
   - validation performed
   - intentionally deferred work

A task is complete only when all acceptance criteria are satisfied.

---

# 2. Recommended Delivery Strategy

Use vertical slices.

Prefer:

```text
schema
→ service
→ API/server action
→ UI
→ tests
```

over large isolated infrastructure work.

Each task should leave the repository in a usable state.

---

# 3. Milestones

```text
M0  Project Foundation
M1  Core Reading Capture
M2  Durable Markdown Notes
M3  Wikilinks & Backlinks
M4  Knowledge Graph
M5  Search
M6  Tablet/PWA Experience
M7  Export & Portability
M8  Local Knowledge CLI
M9  Local Agent Suggestions
M10 Local Knowledge Workflows
```

---

# 4. Task Index

```text
T01 Project bootstrap
T02 Authentication
T03 Database + Drizzle
T04 Application shell
T05 Core domain schema
T06 Source CRUD
T07 Highlight CRUD
T08 QuickNote CRUD
T09 Note CRUD
T10 Tags
T11 Markdown editor
T12 Autosave + draft resilience
T13 Wikilink parser
T14 Wikilink autocomplete
T15 Relation synchronization
T16 Backlinks
T17 Local graph
T18 Global graph
T19 Title search
T20 Full-text search
T21 Tablet quick capture
T22 PWA
T23 Markdown export
T24 Full archive export
T25 Local Knowledge CLI foundation
T26 Secure Knowledge Pull API
T27 Local Workspace Format
T28 Codex Inbox Workflow
T29 Suggestion Push / Import
T30 Web Suggestion Review
T31 Codex Relation Discovery
T32 Local Ask Knowledge
T33 Observability/security hardening
T34 Performance pass
T35 End-to-end acceptance pass
```

---

# 5. Milestone M0 — Project Foundation

## T01 — Project Bootstrap

### Goal

Create a clean Next.js + TypeScript application ready for the rest of the system.

### Dependencies

None.

### Required Work

- initialize Next.js app
- enable TypeScript strict mode
- configure Tailwind CSS
- initialize shadcn/ui
- establish directory structure
- add lint/typecheck/build scripts
- add `.env.example`
- add `docs/DEVELOPMENT_SPEC.md`
- add `AGENTS.md`
- add this file

### Expected Structure

```text
app/
components/
lib/
db/
tests/
docs/
```

### Acceptance Criteria

- `npm/pnpm run typecheck` passes
- `npm/pnpm run lint` passes
- `npm/pnpm run build` passes
- home page renders
- no unnecessary product features exist

### Do Not Implement

- auth
- database models
- notes
- graph
- AI

---

## T02 — Authentication

### Goal

Protect all private application routes.

### Dependencies

T01.

### Required Work

- choose auth provider compatible with Vercel
- implement login
- implement logout
- protect private routes
- expose current-user helper
- add ownership-ready user ID handling

### Required States

```text
unauthenticated
authenticating
authenticated
auth error
```

### Acceptance Criteria

- unauthenticated users cannot access private pages
- authenticated user can access application
- server-side current user can be resolved
- auth secret values are not committed

### Tests

- unauthenticated redirect
- authenticated access

### Do Not Implement

- organizations
- invitations
- roles beyond what is necessary
- billing

---

## T03 — Database + Drizzle

### Goal

Establish PostgreSQL persistence and migrations.

### Dependencies

T01, T02.

### Required Work

- configure PostgreSQL connection
- configure Drizzle
- migration workflow
- DB health check
- base `users` reference strategy
- development seed infrastructure

### Acceptance Criteria

- local/dev database connection works
- migration command works
- schema can be applied from scratch
- DB client is server-only
- no secrets leak to browser bundle

### Do Not Implement

Core content models yet unless required for connection smoke test.

---

## T04 — Responsive Application Shell

### Goal

Create desktop and tablet navigation foundations.

### Dependencies

T01, T02.

### Required Work

Desktop shell:

```text
left sidebar
main content
optional context panel slot
```

Tablet shell:

```text
compact header
bottom navigation
single-column main content
```

Primary routes:

```text
/home
/inbox
/library
/notes
/graph
/search
```

### Acceptance Criteria

- desktop layout usable at common desktop widths
- narrow tablet split-screen remains functional
- tablet layout does not render desktop 3-column UI
- route navigation works

### Do Not Implement

Feature-specific screens beyond placeholders.

---

# 6. Milestone M1 — Core Reading Capture

## T05 — Core Domain Schema

### Goal

Create database models for core content.

### Dependencies

T03.

### Models

```text
sources
highlights
quick_notes
notes
tags
note_tags
note_relations
ai_suggestions
attachments
```

### Required Fields

Follow `docs/DEVELOPMENT_SPEC.md`.

### Required Constraints

- user ownership
- timestamps
- soft-delete/archive fields where applicable
- indexes for common lookups
- relation uniqueness where appropriate

### Acceptance Criteria

- migration generated
- migration applies cleanly
- TypeScript schema types available
- seed data can be inserted

### Tests

- schema-level constraint tests where practical

---

## T06 — Source CRUD

### Goal

Users can create and manage reading Sources.

### Dependencies

T05.

### Required Work

- Source service
- create/list/detail/edit UI
- API/server actions
- authorization
- validation

### Fields

At minimum:

```text
title
publication
author
issue
sourceType
url
publishedAt
```

### Acceptance Criteria

- create Source
- edit Source
- view Source
- list Sources
- only owner can access
- empty/error/loading states exist

### Do Not Implement

- PDF upload
- PDF reader
- AI extraction

---

## T07 — Highlight CRUD

### Goal

Capture excerpts tied optionally to a Source.

### Dependencies

T05, T06.

### Required Work

- Highlight service
- create/edit/archive
- optional Source relation
- page/location metadata
- personal comment
- Inbox status

### Acceptance Criteria

- user can create Highlight with only text
- user can optionally select Source
- user can add personal comment
- new Highlight defaults to Inbox
- original text is never rewritten automatically

---

## T08 — QuickNote CRUD

### Goal

Capture fast thoughts without requiring a Source.

### Dependencies

T05.

### Required Work

- QuickNote service
- create/edit/archive
- optional Source
- Inbox status

### Acceptance Criteria

- one-field quick capture works
- user can optionally attach Source
- saved item appears in Inbox
- no classification required

---

# 7. Milestone M2 — Durable Markdown Notes

## T09 — Note CRUD

### Goal

Create durable Markdown notes.

### Dependencies

T05.

### Required Work

- Note service
- list/detail/create/edit/archive
- slug handling
- authorization
- timestamps

### Acceptance Criteria

- create Note
- edit Note
- archive Note
- Note content stored as Markdown
- no proprietary editor state required for persistence

---

## T10 — Tags

### Goal

Attach reusable tags to Notes.

### Dependencies

T09.

### Required Work

- Tag model/service
- tag autocomplete
- attach/detach tags
- tag filter

### Acceptance Criteria

- create tag implicitly or explicitly
- add/remove tag from Note
- filter Notes by tag
- duplicate normalized tags avoided

---

## T11 — Markdown Editor

### Goal

Provide Obsidian-like Markdown editing.

### Dependencies

T09.

### Preferred Technology

CodeMirror 6.

### Required Features

- Markdown syntax
- headings
- lists
- task lists
- links
- code blocks
- blockquotes
- tables
- images
- `[[wikilinks]]` text support
- keyboard shortcuts
- touch compatibility

### Acceptance Criteria

- edit large Note without visible typing lag
- Markdown round-trip preserves content
- editor works on tablet
- switching between edit/read view does not corrupt syntax

### Do Not Implement

Wikilink resolution yet.

---

## T12 — Autosave + Draft Resilience

### Goal

Prevent note loss.

### Dependencies

T11.

### Required Work

- debounced autosave
- save-state indicator
- optimistic UI where safe
- local temporary draft protection for transient network failure

### Required States

```text
Saved
Saving...
Offline changes
Save failed
```

### Acceptance Criteria

- edits persist without explicit Save button
- failed save is visible
- retry path exists
- temporary network failure does not immediately lose text

---

# 8. Milestone M3 — Wikilinks & Backlinks

## T13 — Wikilink Parser

### Goal

Parse Obsidian-style links.

### Dependencies

T09.

### Supported Forms

```md
[[Note Title]]
[[Note Title|Alias]]
```

### Required Output

Parser should return:

```ts
{
  targetTitle: string
  alias?: string
  start: number
  end: number
}
```

### Acceptance Criteria

- multiple links parsed
- aliases preserved
- malformed links handled safely
- parser does not mutate source text

### Unit Tests

Required.

---

## T14 — Wikilink Autocomplete

### Goal

Typing `[[` suggests existing Notes.

### Dependencies

T11, T13.

### Required Work

- detect active wikilink token
- search Note titles
- keyboard navigation
- touch selection
- optional create-new-note action

### Acceptance Criteria

- suggestions appear after `[[`
- selecting Note inserts correct Markdown
- alias text can still be typed manually
- missing-note creation is explicit

---

## T15 — Relation Synchronization

### Goal

Persist graph edges derived from wikilinks.

### Dependencies

T13, T09, T05.

### Required Work

On Note save:

1. parse wikilinks
2. resolve target Notes
3. create `wikilink` relations
4. remove stale wikilink-derived relations
5. preserve manual/AI relations

### Acceptance Criteria

- adding wikilink creates edge
- removing wikilink removes only corresponding wikilink edge
- manual relations are not removed accidentally
- duplicate edges are avoided

### Unit + Integration Tests

Required.

---

## T16 — Backlinks

### Goal

Show incoming confirmed links.

### Dependencies

T15.

### Required Work

- backlinks query/service
- context panel UI
- note navigation

### Acceptance Criteria

- Note A linking to Note B appears in B backlinks
- backlinks update after editing A
- AI suggestions appear separately, not mixed as confirmed backlinks

---

# 9. Milestone M4 — Knowledge Graph

## T17 — Local Graph

### Goal

Show current Note neighborhood.

### Dependencies

T15, T16.

### Preferred Technology

React Flow.

### Defaults

```text
depth = 1
```

Optional:

```text
depth = 2
```

### Required Work

- graph service
- compact node DTO
- confirmed edge rendering
- suggested edge rendering if present later
- node click navigation

### Acceptance Criteria

- current Note centered/identifiable
- related Notes visible
- pan/zoom works
- node click opens Note
- graph does not load full Note bodies

---

## T18 — Global Graph

### Goal

Explore overall Note network.

### Dependencies

T17.

### Required Work

- global graph endpoint/service
- basic force layout
- tag filtering
- relation-type filtering
- performance guardrails

### Acceptance Criteria

- hundreds of nodes remain usable
- filters work
- graph does not expose private data outside owner
- rejected relations are hidden

---

# 10. Milestone M5 — Search

## T19 — Title Search

### Goal

Fast command-palette-style Note discovery.

### Dependencies

T09.

### Required Work

- title search endpoint/service
- fuzzy/prefix ranking
- keyboard UI

### Acceptance Criteria

- search responds quickly
- results navigate to Note
- no full corpus bodies sent to browser

---

## T20 — Full-Text Search

### Goal

Search Notes, Sources, and Highlights lexically.

### Dependencies

T06, T07, T09.

### Required Work

- PostgreSQL FTS indexes
- ranked result query
- grouped or typed results
- snippets/highlights where practical

### Result Types

```text
Note
Source
Highlight
```

### Acceptance Criteria

- content search works
- result type is visible
- query is owner-scoped
- indexes exist

---

# 11. Milestone M6 — Tablet / PWA

## T21 — Tablet Quick Capture

### Goal

Make split-screen reading capture fast.

### Dependencies

T06, T07, T08, T04.

### Narrow Layout

Required fields:

```text
Content
Source (optional)
Personal thought (optional)
Save
```

### Acceptance Criteria

- usable in narrow split-screen
- no folder/tag requirement
- user can save in a few interactions
- after save, form resets or clearly confirms success
- saved item appears in Inbox

### UX Priority

```text
capture first
organize later
```

---

## T22 — PWA

### Goal

Allow install-like tablet experience.

### Dependencies

T04, T21.

### Required Work

- manifest
- app icons
- installability
- standalone display where supported
- safe caching of static assets

### Acceptance Criteria

- installable on supported browsers
- app opens without normal browser chrome where supported
- private content is not cached insecurely
- basic app navigation works after install

### Do Not Implement

Full offline knowledge editing yet unless simple and safe.

---

# 12. Milestone M7 — Export & Portability

## T23 — Markdown Export

### Goal

Export each durable Note to ordinary Markdown.

### Dependencies

T09, T10, T15.

### Required Work

- frontmatter generation
- stable filenames
- tags
- timestamps
- content
- wikilinks preserved

### Acceptance Criteria

- exported file opens in text editor
- exported file opens meaningfully in Obsidian
- Markdown content is not app-dependent

---

## T24 — Full Archive Export

### Goal

Export entire corpus.

### Dependencies

T23, T06, T07.

### Archive Shape

```text
knowledge-export/
├── Notes/
├── Sources/
│   └── sources.json
├── Highlights/
│   └── highlights.json
├── Assets/
└── manifest.json
```

### Acceptance Criteria

- single downloadable archive
- all Notes included
- Source metadata included
- Highlight metadata included
- attachment references understandable
- no cross-user data leakage

---

# 13. Milestone M8 — Local Knowledge CLI

## T25 — Local Knowledge CLI Foundation

### Goal

Build a local CLI named conceptually `knowledge`. It runs on the user's computer and never inside Vercel.

### Initial Commands

```bash
knowledge status
knowledge pull
knowledge push
```

### Responsibilities

- authenticate securely to the Web application
- pull user-owned knowledge data
- write a local working directory
- validate local suggestion files
- push suggestions back to the Web application

### Constraints

- use `.local-knowledge/` as the recommended local directory
- keep `.local-knowledge/` gitignored because it may contain private knowledge
- do not invoke Codex from Web runtime code

### Acceptance Criteria

- CLI authentication does not require direct PostgreSQL credentials
- local workspace creation is explicit and recoverable
- status reports local/server state without exposing content in logs

---

## T26 — Secure Knowledge Pull API

### Goal

Provide authenticated HTTPS endpoints for the local CLI.

### Pullable Data

```text
Inbox
Sources
Highlights
QuickNotes
Notes
Tags
confirmed relations
minimal metadata
```

Support focused pulls such as:

```bash
knowledge pull --inbox
knowledge pull --notes
```

### Acceptance Criteria

- no direct PostgreSQL credentials are exposed to the CLI
- every response is authenticated and user-scoped
- compact pull payloads preserve stable IDs and source provenance

---

## T27 — Local Workspace Format

### Goal

Define the canonical local working format.

### Recommended Shape

```text
.local-knowledge/
├── context.json
├── inbox/
│   ├── highlights.json
│   ├── quick-notes.json
│   └── sources.json
├── notes/
│   └── <note-id>.md
├── relations.json
└── suggestions/
```

### Rules

- preserve stable IDs
- preserve source provenance
- keep Markdown Notes readable
- source objects remain immutable local input unless explicitly edited through Web
- local generated suggestion files use validated schemas
- filenames are presentation only and never object identity

---

# 14. Milestone M9 — Local Agent Suggestions

## T28 — Codex Inbox Workflow

### Goal

Codex processes pulled local data and writes structured proposals without modifying production knowledge.

### Workflow

```bash
knowledge pull --inbox
codex
```

Codex reads `.local-knowledge/inbox/` and writes only `.local-knowledge/suggestions/` during knowledge-processing tasks.

### Allowed Proposal Types

```text
inbox_group
durable_note
tag
relation
```

### Acceptance Criteria

- source Highlights and QuickNotes remain unchanged
- every proposal preserves source references
- malformed or unknown local outputs are rejected before import

---

## T29 — Suggestion Push / Import

### Goal

Implement `knowledge push` to validate and import local suggestions into existing `ai_suggestions` records.

### Import Flow

1. read `.local-knowledge/suggestions/`
2. validate schemas locally
3. send suggestions to the Web application
4. validate them again on the server
5. persist valid proposals into `ai_suggestions`

### Security

- local files are untrusted input
- all referenced IDs must belong to the authenticated user
- import must not create durable Notes directly
- import must not create confirmed graph relations

---

## T30 — Web Suggestion Review

### Goal

Extend Web Inbox/review UI for imported suggestions.

### Actions

```text
View
Edit
Accept
Ignore
Reject
```

Accepting a durable-note proposal must use a transaction for Note/tag/relation/source-status mutations. Source Highlights and QuickNotes remain preserved.

---

# 15. Milestone M10 — Local Knowledge Workflows

## T31 — Codex Relation Discovery

### Goal

Allow Codex to inspect local Notes and generate relation proposals.

### Input

```text
.local-knowledge/notes/
.local-knowledge/relations.json
```

### Required Proposal Fields

```text
sourceNoteId
targetNoteId
reason
confidence
```

Imported relations remain `suggested` until explicitly confirmed in Web UI. Codex must never create confirmed graph edges.

---

## T32 — Local Ask Knowledge

### Goal

Provide an initial local Codex workflow for corpus-grounded questions.

### Workflow

```bash
knowledge pull --notes
codex
```

Codex answers by reading the local knowledge workspace. Do not require embeddings, pgvector, or a Web chatbot initially.

---

## Future / Optional

The following are not part of the immediate T25-T32 roadmap:

```text
Embeddings
pgvector
Semantic Search
Hybrid Search
Web Ask Knowledge
Direct OpenAI API provider
Local model provider
automated local agent runner
PDF reader
offline sync
```

These may be reconsidered only after real knowledge-base scale justifies them.

# 16. Cross-Cutting Tasks

## T33 — Observability + Security Hardening

### Goal

Prepare for safe internet deployment.

### Required Work

- security headers
- auth/session review
- ownership audit
- sensitive logging audit
- rate limiting where appropriate
- file-access review
- error telemetry with redaction

### Acceptance Criteria

- private objects cannot be fetched cross-user
- no public file bucket by default
- logs do not contain full Note bodies
- AI secrets protected
- destructive routes protected

---

## T34 — Performance Pass

### Goal

Ensure core flows remain responsive.

### Review Areas

```text
Note list
editor
global graph
search
Inbox
AI requests
```

### Required Work

- query analysis
- indexes
- pagination
- payload trimming
- N+1 audit
- graph DTO optimization

### Acceptance Criteria

- no full note bodies in graph response
- long lists paginated or virtualized where needed
- common DB queries indexed
- editor interaction remains smooth

---

## T35 — End-to-End Acceptance Pass

### Goal

Validate the product as one coherent system.

### Core Scenario

```text
login
→ create Source
→ capture Highlight
→ capture QuickNote
→ open Inbox
→ create durable Markdown Note
→ add [[wikilink]]
→ verify backlink
→ inspect local graph
→ inspect global graph
→ search
→ export
```

If the local agent phase is enabled:

```text
Inbox
→ AI proposal
→ edit
→ accept
→ relation suggestion
→ confirm
→ Ask Knowledge
```

### Acceptance Criteria

All requirements in `docs/DEVELOPMENT_SPEC.md` MVP checklist pass.

---

# 17. Suggested Development Batches

For Codex, do not request all tasks at once.

Recommended batches:

## Batch A

```text
T01-T04
```

Foundation only.

## Batch B

```text
T05-T08
```

Capture domain.

## Batch C

```text
T09-T12
```

Durable Notes/editor.

## Batch D

```text
T13-T16
```

Wikilinks/backlinks.

## Batch E

```text
T17-T20
```

Graph/search.

## Batch F

```text
T21-T24
```

Tablet/PWA/export.

At this point MVP should be usable.

Then:

## Batch G

```text
T25-T28
```

Local CLI, secure pulls, workspace format, and Codex proposal workflow.

## Batch H

```text
T29-T32
```

Suggestion import/review, Codex relation discovery, and local Ask Knowledge.

## Batch I

```text
T33-T35
```

Hardening and final acceptance.

---

# 18. Recommended Prompt Template for Each Task

Use a prompt like:

```text
Read AGENTS.md, docs/DEVELOPMENT_SPEC.md, and IMPLEMENTATION_PLAN.md.

Inspect the current repository and identify the existing implementation relevant to task TXX.

Implement only TXX: <task name>.

Requirements:
- follow existing project conventions
- do not implement later-phase features
- preserve Markdown portability
- enforce object ownership
- add/update tests for critical logic
- handle loading, empty, and error states where applicable

After implementation:
1. run typecheck
2. run lint
3. run relevant tests
4. run build if feasible

Report:
- implemented
- key decisions
- validation actually run
- intentionally deferred work
```

---

# 19. Milestone Exit Criteria

## M0 Complete

- auth works
- DB works
- app shell works

## M1 Complete

- Sources, Highlights, QuickNotes can be captured
- Inbox has raw items

## M2 Complete

- durable Markdown Notes work
- editor/autosave stable

## M3 Complete

- wikilinks create relations
- backlinks correct

## M4 Complete

- local/global graph usable

## M5 Complete

- title + full-text search usable

## M6 Complete

- tablet split-screen capture is comfortable
- PWA install works

## M7 Complete

- full export works
- Markdown remains portable

At this point:

> MVP is production-usable for one user.

## M8 Complete

- local `knowledge` CLI foundation and pull workflow are usable

## M9 Complete

- local Codex suggestions can be validated, imported, and reviewed safely

## M10 Complete

- local relation discovery and corpus-grounded Ask Knowledge workflow are traceable

---

# 20. Risks to Watch

## Risk 1 — Building Too Much Agent Automation Too Early

Mitigation:

Do not start T25+ before basic knowledge flows are stable. Keep local processing proposal-only until import and review boundaries are proven.

## Risk 2 — Graph Becomes Visual Noise

Mitigation:

- local graph first
- confirmed vs suggested distinction
- filtering
- AI does not auto-confirm

## Risk 3 — Editor Locks Data Into Proprietary Format

Mitigation:

Markdown remains canonical.

## Risk 4 — Tablet UI Becomes Desktop UI Shrunk Down

Mitigation:

Implement T21 explicitly as a separate interaction model.

## Risk 5 — Knowledge Capture Becomes Too Slow

Mitigation:

Do not require tags/folders/relations during quick capture.

## Risk 6 — AI Pollutes User Knowledge

Mitigation:

`ai_suggestions` state + server validation + explicit review gate. Codex never writes directly to production knowledge.

## Risk 7 — Cloud Deployment Creates Privacy Misunderstanding

Mitigation:

Be explicit: system is cloud-hosted, not local-only.

## Risk 8 — Export Is Added Too Late

Mitigation:

Implement T23/T24 before AI layers.

---

# 21. Definition of MVP

MVP is NOT:

```text
a demo with AI chat
```

MVP IS:

```text
a stable private reading and knowledge system
where a user can:
- capture reading material on tablet
- write durable Markdown notes
- link notes
- inspect backlinks
- navigate a graph
- search
- export everything
```

AI is an enhancement after this foundation works.

---

# 22. First Recommended Codex Task

If the repository is empty, start with:

```text
T01 Project Bootstrap
T02 Authentication
T03 Database + Drizzle
T04 Responsive Application Shell
```

Do not ask Codex to implement the whole system in one request.

After Batch A, inspect the result and continue with Batch B.

---

End of implementation plan.
