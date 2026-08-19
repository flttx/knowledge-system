# AI-Native Personal Reading & Knowledge System
## Development Requirements Specification

> Status: Draft v1.0
> Audience: Codex / Claude Code / AI coding agents / human developers
> Primary goal: Build a private, web-based reading and knowledge system that combines Obsidian-like note linking and graph exploration with AI-native reading, organization, retrieval, and knowledge synthesis.

---

# 0. How AI Agents Should Use This Document

This document is the source of truth for product and engineering requirements.

When implementing:

1. Do not invent product behaviors that contradict this document.
2. Prefer the simplest implementation that satisfies the stated acceptance criteria.
3. Do not add enterprise/team/workspace features unless explicitly requested.
4. Preserve Markdown portability and exportability.
5. Keep AI-generated relationships distinguishable from user-confirmed relationships.
6. Source materials, highlights, quick notes, and durable knowledge notes are different domain objects.
7. Tablet UX and desktop UX are intentionally different.
8. The system must remain usable without AI.
9. AI may suggest organization, but should not silently rewrite or destroy user knowledge.
10. When a requirement is ambiguous, prefer:
   - data safety
   - reversibility
   - portability
   - lower interaction cost during reading
   - fewer features over speculative complexity

---

# 1. Product Definition

## 1.1 Product Summary

Build a private web-based personal reading and knowledge system.

The user should be able to:

- read magazines, PDFs, articles, or other material on a tablet
- quickly capture highlights and personal thoughts without interrupting reading flow
- open the same system on a desktop computer without file synchronization concerns
- convert raw reading material into durable Markdown knowledge notes
- create and navigate `[[wikilinks]]`
- inspect backlinks and local/global relationship graphs
- search using keyword search; semantic search is future/optional
- let AI propose summaries, classifications, relationships, and durable notes
- retain full control over what becomes part of the confirmed knowledge graph
- export the entire knowledge base to portable Markdown

The system should feel closer to:

- Obsidian for note linking and graph exploration
- Readwise Reader for reading capture
- an AI-native PKM system for organization and synthesis

It should NOT feel like:

- a team wiki
- a project-management SaaS
- an enterprise knowledge platform
- a chatbot with notes bolted on

---

# 2. Core Product Philosophy

## 2.1 Human Responsibilities

The human primarily does:

- reading
- highlighting
- writing short personal thoughts
- confirming or rejecting AI suggestions
- editing durable knowledge notes
- exploring knowledge relationships

## 2.2 AI Responsibilities

The local knowledge agent primarily does:

- summarization
- classification
- tag suggestions
- topic extraction
- durable-note draft generation
- related-note discovery
- local corpus synthesis
- local question answering
- Inbox organization proposals

The agent should reduce manual knowledge-management work without becoming a trusted writer of production data.

The deployed Web application does not directly call a model provider for this workflow. Local processing is intentionally delayed until the user runs the `knowledge` CLI and Codex on a trusted local computer.

## 2.3 Key Principle

> The human keeps judgment. AI carries organizational labor.

---

# 3. Primary Usage Scenario

## 3.1 Tablet Reading Flow

Typical scenario:

1. User opens a magazine/PDF/article in another app or browser.
2. User runs the knowledge system beside it in split-screen or as a PWA.
3. User captures:
   - highlight
   - source
   - optional personal thought
4. Item is saved to Inbox.
5. User continues reading immediately.

The system must NOT require the user to decide:

- final folder
- final tags
- final knowledge-note title
- exact graph relations

during the reading session.

## 3.2 Desktop Processing Flow

Later on a desktop computer:

1. User runs `knowledge pull --inbox`.
2. Codex reads the local workspace and groups Highlights and QuickNotes.
3. Codex proposes:
   - durable notes
   - tags
   - related existing notes
   - relationships
4. `knowledge push` validates and imports proposals into the Web application.
5. User reviews imported suggestions in Web UI.
6. Accepted proposals become durable knowledge.
7. Knowledge graph is updated.
8. User may explore, edit, search, or ask questions over the corpus.

This local, delayed workflow is intentional. Tablet capture and core Web use do not require real-time AI availability.

---

# 4. Product Scope

## 4.1 MVP Scope

MVP must support:

- single-user authentication
- responsive web app
- PWA installability
- quick note capture
- sources
- highlights
- Markdown notes
- `[[wikilinks]]`
- backlinks
- tags
- full-text search
- local graph
- global graph
- Markdown export
- basic Inbox workflow

## 4.2 Phase 2

Add through the local Knowledge CLI and Codex workflow:

- AI Inbox processing
- AI note draft generation
- AI tag suggestions
- AI related-note suggestions
- AI relationship suggestions
- local corpus-grounded Ask Knowledge

## 4.3 Phase 3

Add:

- integrated PDF reader
- page-level citation
- highlight extraction from PDF
- offline cache
- richer PWA behavior

The local CLI bridge is part of the post-MVP roadmap beginning at T25, not a Web runtime feature.

## 4.4 Explicit Non-Goals

Do NOT build initially:

- multi-user workspaces
- shared notebooks
- comments
- team permissions
- kanban boards
- task management
- calendars
- email integration
- enterprise audit logs
- plugin marketplace
- public publishing
- social features
- collaborative real-time editing
- complex folder automation
- automatic destructive AI cleanup

---

# 5. Information Architecture

Primary navigation:

```text
Home
Inbox
Library
Notes
Graph
Search
```

AI should be embedded contextually.

A separate "AI" page is optional and should not be the primary interaction model.

## 5.1 Home

Purpose:

- continue recent reading
- show today's activity
- show recent notes
- show recent sources
- surface a small number of meaningful AI suggestions

## 5.2 Inbox

Contains unprocessed or partially processed items:

- highlights
- quick notes
- source fragments
- AI-generated note proposals
- relationship suggestions

## 5.3 Library

Contains source material:

- magazines
- articles
- PDFs
- books
- web pages

## 5.4 Notes

Contains durable knowledge notes.

## 5.5 Graph

Supports:

- global graph
- local graph
- relation filters
- confirmed vs AI-suggested relation distinction

## 5.6 Search

Supports now:

- title search
- full-text search

Future/optional local workflows may add semantic search and hybrid ranking.

---

# 6. Domain Model

The following objects MUST remain conceptually distinct.

## 6.1 Source

Represents something the user consumed.

Examples:

- magazine article
- PDF
- web article
- book chapter

Fields:

```ts
type Source = {
  id: string
  title: string
  publication?: string
  author?: string
  issue?: string
  sourceType: 'article' | 'magazine' | 'pdf' | 'book' | 'web' | 'other'
  url?: string
  fileUrl?: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}
```

## 6.2 Highlight

A captured excerpt from a Source.

```ts
type Highlight = {
  id: string
  sourceId?: string
  text: string
  page?: number
  location?: string
  personalComment?: string
  status: 'inbox' | 'processed' | 'archived'
  createdAt: string
  updatedAt: string
}
```

## 6.3 Quick Note

Fast human input.

May exist without a Source.

```ts
type QuickNote = {
  id: string
  content: string
  sourceId?: string
  status: 'inbox' | 'processed' | 'archived'
  createdAt: string
  updatedAt: string
}
```

## 6.4 Durable Note

A persistent knowledge note.

Content must be Markdown.

```ts
type Note = {
  id: string
  title: string
  slug: string
  contentMarkdown: string
  createdAt: string
  updatedAt: string
  archivedAt?: string
}
```

## 6.5 Tag

```ts
type Tag = {
  id: string
  name: string
}
```

## 6.6 Note Relation

Represents a graph edge.

```ts
type NoteRelation = {
  id: string
  sourceNoteId: string
  targetNoteId: string
  relationType: 'wikilink' | 'manual' | 'ai_suggested' | 'semantic'
  status: 'confirmed' | 'suggested' | 'rejected'
  confidence?: number
  reason?: string
  createdAt: string
}
```

Critical rule:

- `ai_suggested` relationships are NOT equivalent to confirmed relationships.
- Suggested edges should be visually different.
- Suggested edges must not pollute confirmed graph traversal unless explicitly enabled.

---

# 7. Markdown Requirements

Markdown is a first-class storage and portability format.

## 7.1 Supported Syntax

Minimum:

- headings
- bold
- italic
- blockquote
- ordered list
- unordered list
- task list
- links
- images
- fenced code blocks
- tables
- horizontal rule
- tags
- `[[wikilinks]]`

## 7.2 Wikilinks

Supported forms:

```md
[[消费趋势]]
[[消费趋势|年轻人消费变化]]
```

Behavior:

1. While typing `[[`, show autocomplete.
2. Search existing Note titles.
3. Allow creation of a missing note.
4. On save, parse all wikilinks.
5. Update relation table.
6. Generate backlinks automatically.

## 7.3 Markdown Export

Every Note must export as a valid `.md` file.

Recommended frontmatter:

```yaml
---
id: note_xxx
created: 2026-08-17T10:00:00+08:00
updated: 2026-08-17T12:00:00+08:00
tags:
  - AI
  - 就业
---
```

Do not make application-specific metadata mandatory for basic readability.

---

# 8. Editor Requirements

Preferred implementation:

- CodeMirror 6

Alternative:

- TipTap only if Markdown round-trip integrity is preserved

## 8.1 Editor Features

Required:

- Markdown editing
- inline Markdown-friendly rendering
- wikilink autocomplete
- tag autocomplete
- keyboard shortcuts
- paste image
- drag/drop image
- autosave
- undo/redo
- tablet-friendly touch behavior

## 8.2 Autosave

Autosave should:

- debounce writes
- show save state
- avoid data loss
- preserve draft on network failure when possible

States:

```text
Saved
Saving...
Offline changes
Save failed
```

---

# 9. Backlinks

Each Note page must expose backlinks.

Example:

```text
Current Note: 消费趋势

Backlinks:
- 年轻人消费结构
- 日本低欲望社会
- 房地产与消费
```

Backlinks derive from:

- wikilinks
- confirmed manual relations

AI suggestions should appear in a separate section:

```text
Suggested Related Notes
```

---

# 10. Graph Requirements

## 10.1 Graph Types

Two graph modes are required:

### Global Graph

Purpose:

- explore corpus-level structure
- discover topic clusters

### Local Graph

Purpose:

- inspect current note neighborhood
- depth 1 by default
- allow depth 2 optionally

## 10.2 Node Types

Minimum node types:

- Note
- optionally Source in later phase

## 10.3 Edge Styling Semantics

Confirmed:

```text
solid line
```

AI suggestion:

```text
dashed line
```

Rejected:

```text
not displayed by default
```

## 10.4 Graph Interaction

Required:

- pan
- zoom
- select node
- open note
- hover preview
- filter by tag
- filter by relation type

Optional later:

- cluster labels
- topic coloring
- force layout settings

## 10.5 Graph Technology

Preferred:

- React Flow
- d3-force or compatible layout engine

---

# 11. Tablet UX

Tablet interaction is optimized for reading capture, not deep knowledge administration.

## 11.1 Primary Tablet Layout

Expected common use:

```text
┌─────────────────────────┬───────────────┐
│                         │               │
│ Magazine / PDF / Web    │ Knowledge PWA │
│                         │               │
│         65-70%          │    30-35%     │
│                         │               │
└─────────────────────────┴───────────────┘
```

The knowledge app should remain useful in a narrow-width split-screen state.

## 11.2 Quick Capture Screen

Required fields:

```text
Source (optional)
Highlight / content
Personal thought (optional)
Save
```

Do not require:

- folder
- final tags
- relation selection
- durable-note title

## 11.3 Tablet Navigation

Recommended:

```text
Home
Inbox
Search
Graph
```

Use bottom navigation.

Avoid desktop-style 3-column layouts on tablet.

## 11.4 Tablet Design Principle

> Capture first, organize later.

---

# 12. Desktop UX

Desktop is optimized for processing and exploration.

Recommended layout:

```text
┌─────────────┬─────────────────────────────┬────────────────────┐
│ Sidebar     │ Main Content                │ Context Panel      │
│             │                             │                    │
│ Inbox       │ Note / Inbox / Source       │ Backlinks          │
│ Notes       │                             │ Related Notes      │
│ Library     │                             │ Local Graph        │
│ Graph       │                             │ AI Suggestions     │
│ Search      │                             │                    │
└─────────────┴─────────────────────────────┴────────────────────┘
```

Desktop should support keyboard-heavy workflows.

---

# 13. Inbox Workflow

Inbox is a core system.

## 13.1 Inbox Item Types

May include:

- Highlight
- QuickNote
- grouped highlights
- AI-generated note draft
- AI relationship suggestion

## 13.2 AI Processing

AI may propose:

- topic
- tags
- summary
- durable note title
- durable note body
- existing related notes
- graph relationships

AI must not automatically:

- delete source content
- overwrite user-written notes
- merge notes irreversibly
- create large numbers of confirmed graph edges

## 13.3 Inbox Review Actions

User can:

```text
Accept
Edit
Ignore
Archive
Reject relation
Create Note
Merge into existing Note
```

---

# 14. AI Durable Note Generation

Example input:

```text
Source:
三联生活周刊

Highlights:
1. ...
2. ...
3. ...

User thoughts:
...
```

AI output:

```json
{
  "proposedTitle": "年轻人的消费结构变化",
  "summary": "...",
  "bodyMarkdown": "...",
  "suggestedTags": ["消费", "年轻人"],
  "relatedNotes": [
    {
      "noteId": "...",
      "reason": "...",
      "confidence": 0.87
    }
  ]
}
```

AI output should be treated as draft state until accepted.

---

# 15. AI Relationship Discovery

AI/embedding system may detect similarity between notes.

Example:

```text
年轻人消费结构变化
↔
日本低欲望社会
```

Suggestion UI must show:

- candidate note
- confidence
- reason
- relevant overlapping concepts

Actions:

```text
Confirm
Ignore
Reject
```

Confirmed relationship becomes graph edge.

Rejected relationships should not be repeatedly suggested unless content changes materially.

---

# 16. Search

## 16.1 Search Modes

### A. Title Search

Fast prefix/fuzzy title search.

### B. Full-Text Search

Use PostgreSQL full-text search.

Search:

- title
- note content
- source title
- highlight text

### C. Semantic Search (Future / Optional)

Use embeddings.

Recommended:

- pgvector

### D. Hybrid Search (Future / Optional)

Combine:

- lexical relevance
- semantic similarity

## 16.2 Result Types

Search results may include:

- Notes
- Sources
- Highlights

Each result must indicate type.

---

# 17. Ask Knowledge (Local First; Future)

Initial Ask Knowledge is a local Codex workflow after `knowledge pull --notes`; a Web chatbot and remote model endpoint are not required.

User can ask:

```text
最近我关于房地产和消费之间记录了哪些观点？
```

Answer must:

- retrieve relevant user knowledge
- synthesize findings
- cite underlying Notes/Sources/Highlights
- allow click-through to source objects

The workflow must prefer user corpus evidence over generic model knowledge.

---

# 18. Data Model

Recommended PostgreSQL tables:

```text
users
sources
highlights
quick_notes
notes
tags
note_tags
note_relations
attachments
embeddings (future/optional)
ai_suggestions
```

## 18.1 Suggested SQL-Level Structure

### notes

```sql
id uuid primary key
user_id uuid not null
title text not null
slug text not null
content_markdown text not null
created_at timestamptz not null
updated_at timestamptz not null
archived_at timestamptz
```

### sources

```sql
id uuid primary key
user_id uuid not null
title text not null
publication text
author text
issue text
source_type text not null
url text
file_url text
published_at timestamptz
created_at timestamptz not null
updated_at timestamptz not null
```

### highlights

```sql
id uuid primary key
user_id uuid not null
source_id uuid
text text not null
page integer
location text
personal_comment text
status text not null
created_at timestamptz not null
updated_at timestamptz not null
```

### note_relations

```sql
id uuid primary key
user_id uuid not null
source_note_id uuid not null
target_note_id uuid not null
relation_type text not null
status text not null
confidence numeric
reason text
created_at timestamptz not null
```

### ai_suggestions

```sql
id uuid primary key
user_id uuid not null
suggestion_type text not null
source_object_type text not null
source_object_id uuid not null
payload jsonb not null
status text not null
created_at timestamptz not null
reviewed_at timestamptz
```

---

# 19. API Requirements

Use REST-style route handlers or server actions.

Do not expose internal DB directly to unauthenticated clients.

## 19.1 Notes

```text
GET    /api/notes
POST   /api/notes
GET    /api/notes/:id
PATCH  /api/notes/:id
DELETE /api/notes/:id
```

DELETE should be soft delete by default.

## 19.2 Sources

```text
GET    /api/sources
POST   /api/sources
GET    /api/sources/:id
PATCH  /api/sources/:id
```

## 19.3 Highlights

```text
GET    /api/highlights
POST   /api/highlights
PATCH  /api/highlights/:id
```

## 19.4 Search

```text
GET /api/search?q=
GET /api/search/semantic?q=
GET /api/search/hybrid?q=
```

## 19.5 Graph

```text
GET /api/graph/global
GET /api/graph/local/:noteId?depth=1
```

## 19.6 Local Agent Integration

The Web application exposes authenticated, user-scoped APIs for the future local `knowledge` CLI:

```text
GET  /api/local-agent/status
POST /api/local-agent/pull
POST /api/local-agent/suggestions/import
POST /api/local-agent/suggestions/:id/accept
POST /api/local-agent/suggestions/:id/reject
POST /api/local-agent/suggestions/:id/ignore
```

These endpoints are not implemented by T01-T24 and must not invoke Codex or a model provider from the server runtime. The server validates every imported object ID and persists valid proposals into `ai_suggestions`.

---

# 20. Authentication

Single-user product initially, but authentication is required because the app is internet-accessible.

Requirements:

- secure login
- session management
- CSRF-safe mutation behavior
- route protection
- object-level ownership checks

Browser login uses a normalized username and a server-side scrypt password
hash stored on the `users` row. The server never accepts a client-supplied
owner ID. Successful login creates a cryptographically random opaque token;
only its SHA-256 hash is stored in `sessions`, while the raw token is kept in
an HttpOnly cookie.

The browser session is not single-device: each login receives its own
HttpOnly, SameSite=Lax cookie with a 30-day lifetime. Multiple devices may
remain logged in at the same time, and logout revokes only the current session
row. There is no latest-login invalidation or server-side single-session lock.

Local Agent authentication uses independently generated per-user bearer tokens.
Only token hashes are stored; the raw token is shown once when created and can
be revoked individually from the authenticated settings page.

No unauthenticated private content endpoints.

---

# 21. Privacy and Security

Important architectural reality:

The system is cloud-hosted.

Therefore:

- app data is stored remotely
- Vercel/server infrastructure processes requests
- database provider stores application data

Do NOT claim the system is local-only.

## 21.1 Minimum Security Requirements

- HTTPS
- encrypted database storage where provider supports it
- private file buckets
- signed file URLs where appropriate
- authentication
- authorization
- no public source files by default
- no logging of full note bodies in production application logs
- redact sensitive AI request logs where possible

## 21.2 Future E2EE

Client-side end-to-end encryption is NOT an MVP requirement.

Local Codex processing reduces the need to send corpus content to a remote model provider, but E2EE would still affect Web search, review, export, and authenticated pull/push workflows. If E2EE is later added, it requires a separate design.

---

# 22. Export and Data Ownership

Critical requirement:

The user must be able to export all durable knowledge.

## 22.1 Export Format

Example:

```text
knowledge-export/
├── Notes/
│   ├── AI与就业.md
│   ├── 消费趋势.md
│   └── 日本经济.md
├── Sources/
│   └── sources.json
├── Highlights/
│   └── highlights.json
├── Assets/
└── manifest.json
```

## 22.2 Obsidian Compatibility

Exported Markdown should remain readable in Obsidian.

Preserve:

- Markdown
- wikilinks where possible
- tags
- attachments with relative paths where possible

---

# 23. Codex Integration

The Web application is the daily interaction surface and canonical data store.

The local Knowledge CLI is the secure bridge between the Web application and local Codex processing. Codex is a local knowledge-processing agent, not a Web runtime dependency.

## 23.1 Desired Future CLI

Example:

```bash
knowledge pull
knowledge push
knowledge status
knowledge pull --inbox
knowledge pull --notes
```

Possible workflow:

```text
Tablet/Desktop Web
   ↓
PostgreSQL
   ↓
Secure pull API
   ↓
Local `.local-knowledge/`
   ↓
Codex writes suggestions only
   ↓
Secure suggestion import API
   ↓
Web review / accept
   ↓
PostgreSQL confirmed knowledge
```

The CLI must not receive direct PostgreSQL credentials. Codex must not directly modify production data, and local source files remain immutable inputs during processing.

---

# 24. Technical Stack

Preferred stack:

```text
Frontend:
Next.js
React
TypeScript

Styling:
Tailwind CSS
shadcn/ui

Editor:
CodeMirror 6

Graph:
React Flow
d3-force or equivalent

Backend:
Next.js Route Handlers / Server Actions

Database:
PostgreSQL

ORM:
Drizzle ORM

Full-text Search:
PostgreSQL FTS

File Storage:
Vercel Blob or Cloudflare R2

Local knowledge processing:
knowledge CLI + Codex CLI

Remote model providers:
future/optional; not called by the deployed Web application

Deployment:
Vercel
```

Equivalent technology substitutions are allowed only when they preserve requirements and simplify implementation.

---

# 25. Suggested Repository Structure

```text
/
├── app/
│   ├── (auth)/
│   ├── home/
│   ├── inbox/
│   ├── library/
│   ├── notes/
│   ├── graph/
│   ├── search/
│   └── api/
│
├── components/
│   ├── editor/
│   ├── graph/
│   ├── notes/
│   ├── sources/
│   ├── highlights/
│   ├── inbox/
│   ├── search/
│   └── ui/
│
├── lib/
│   ├── db/
│   ├── markdown/
│   ├── wikilinks/
│   ├── graph/
│   ├── search/
│   ├── ai/
│   └── auth/
│
├── db/
│   ├── schema.ts
│   └── migrations/
│
├── public/
├── tests/
└── docs/
```

---

# 26. Core Service Boundaries

Keep business logic out of page components.

Recommended services:

```text
NoteService
SourceService
HighlightService
WikilinkService
GraphService
SearchService
AIInboxService
AIRelationService
ExportService
```

Example responsibilities:

## WikilinkService

- parse wikilinks
- resolve title to Note
- create missing relation records
- remove stale relation records after note edits
- calculate backlinks

## GraphService

- build local graph
- build global graph
- filter suggested edges
- calculate node metadata

## AIInboxService

- group inbox content
- generate summaries
- propose durable notes
- persist suggestions

---

# 27. Required User Flows

## Flow A: Quick Highlight Capture

```text
Open quick capture
→ select source
→ paste/write highlight
→ optionally add thought
→ save
→ item appears in Inbox
```

Acceptance:

- should work in narrow tablet split-screen
- no classification required
- save should be fast
- user can immediately continue reading

## Flow B: Create Durable Note

```text
Open Notes
→ New Note
→ enter title
→ write Markdown
→ add [[wikilink]]
→ save
→ backlink graph updates
```

Acceptance:

- wikilink autocomplete works
- backlinks update
- local graph includes linked note

## Flow C: AI Inbox Review

```text
Open Inbox
→ run/review AI proposal
→ inspect generated durable-note draft
→ edit or accept
→ Note created
→ source items marked processed
```

Acceptance:

- source highlights remain intact
- user can reject without data loss

## Flow D: AI Relation Review

```text
Open Note
→ Suggested Related Notes
→ inspect reason
→ Confirm
→ relation becomes solid graph edge
```

Acceptance:

- before confirmation edge is visually suggested
- after confirmation it becomes persistent confirmed relation

## Flow E: Export

```text
Settings
→ Export All
→ download archive
```

Acceptance:

- Markdown opens outside system
- note content survives export
- metadata is understandable
- attachments are referenced correctly

---

# 28. UI States

Every major data screen must handle:

```text
loading
empty
error
success
offline/degraded where applicable
```

Examples:

Inbox empty state:

```text
今天没有待整理内容。
继续阅读或快速记录一条想法。
```

Graph empty state:

```text
创建至少两篇相互关联的笔记后，这里会显示知识关系。
```

---

# 29. Performance Requirements

Target behavior:

- normal note list loads quickly
- editor typing must remain responsive
- graph must remain usable for hundreds to low-thousands of notes
- search feedback should feel immediate
- expensive semantic operations should be asynchronous at request level, but results must be surfaced clearly

Avoid loading full corpus into browser if unnecessary.

---

# 30. AI Cost Control

Local agent actions should be explicit and user-triggered.

Do NOT invoke remote model APIs from the Web application, and do not automatically run local processing on every keystroke.

Recommended triggers:

- user runs `knowledge pull --inbox` and starts Codex processing
- user runs `knowledge pull --notes` for local questions or relation discovery
- user runs `knowledge push` to submit validated suggestions

Cache or skip local suggestions when canonical input content has not changed.

---

# 31. AI Safety / Data Integrity Rules

AI must never silently:

- delete notes
- destroy source records
- remove user highlights
- replace original human text
- merge notes without review
- convert suggested relation into confirmed relation
- overwrite export files

AI generated content must be distinguishable from human-authored content until accepted.

---

# 32. Testing Requirements

## 32.1 Unit Tests

Required for:

- wikilink parser
- backlink generation
- relation synchronization
- Markdown export
- hybrid search rank combination
- AI suggestion state transitions

## 32.2 Integration Tests

Required for:

- create Note → add wikilink → backlink appears
- create Highlight → Inbox → local suggestion import → review → create Note
- imported relation suggestion → confirm → graph update
- export → valid Markdown archive

## 32.3 End-to-End Tests

At minimum:

1. authentication
2. quick capture
3. note creation
4. wikilink
5. graph navigation
6. export

---

# 33. MVP Acceptance Criteria

MVP is complete only if all are true:

## Authentication

- user can securely sign in
- private pages are protected

## Capture

- tablet user can quickly create Highlight or QuickNote
- capture works in narrow viewport

## Sources

- user can create/edit Source
- Highlight may reference Source

## Notes

- user can create/edit/archive Markdown Note
- autosave works

## Wikilinks

- `[[note]]` autocomplete works
- link relation persists
- backlinks display correctly

## Graph

- local graph works
- global graph works
- clicking a node opens corresponding Note

## Search

- title search works
- full-text search works

## Export

- all Notes export to Markdown
- archive is usable outside application

## Responsive UX

- desktop UI is usable
- tablet split-screen UI is usable

---

# 34. Phase 2 Acceptance Criteria

The local-agent phase is complete when:

- Codex can produce durable-note proposals locally
- imported suggestions are reviewable in Web UI
- relation candidates display reason/confidence
- user can confirm/reject imported relations
- local Ask Knowledge provides source-linked answers

Semantic search and hybrid search remain future/optional and are not required for this phase.

---

# 35. Product UX Principles

All UI implementation should follow these principles.

## 35.1 Quiet Interface

Prefer:

- whitespace
- typography
- restrained controls
- contextual actions

Avoid:

- dashboard overload
- excessive cards
- gamification
- enterprise SaaS appearance

## 35.2 Reading Mode vs Processing Mode

Tablet:

```text
capture-oriented
```

Desktop:

```text
processing/exploration-oriented
```

Do not force feature parity into identical layouts.

## 35.3 Progressive Disclosure

Common actions visible.

Advanced actions hidden until needed.

Example:

Visible:

```text
Save
Link
Search
```

Contextual:

```text
Merge
AI relation confidence
embedding details
export metadata
```

---

# 36. Important Product Decisions Already Made

These should NOT be reopened during implementation unless explicitly requested.

1. This is a web-first system.
2. Vercel deployment is acceptable.
3. The system is not local-only.
4. Markdown remains the durable portable format.
5. Obsidian Sync is not required.
6. Tablet and desktop access the same online service.
7. Tablet commonly uses split-screen with external reading app.
8. The app does not initially need to be the magazine/PDF reader.
9. Source and Note are separate objects.
10. AI organizes; human confirms.
11. Suggested graph edges are visually distinct.
12. Export must preserve long-term ownership.
13. Obsidian compatibility is desirable but Obsidian itself is not a runtime dependency.
14. Codex integration is a local post-MVP workflow, not a Web runtime dependency.
15. The deployed Web application must not directly call OpenAI for knowledge processing.

---

# 37. Recommended Development Sequence

Implement in this order.

## Step 1: Foundation

- Next.js project
- authentication
- database
- design system
- responsive shell

## Step 2: Core Content Model

- Source
- Highlight
- QuickNote
- Note
- Tag

## Step 3: Markdown Editor

- CodeMirror
- autosave
- Markdown rendering

## Step 4: Wikilinks

- parser
- autocomplete
- link persistence
- backlinks

## Step 5: Graph

- local graph
- global graph

## Step 6: Search

- title
- full text

## Step 7: Tablet UX

- quick capture
- narrow split-screen layout
- PWA installability

## Step 8: Export

- Markdown
- JSON metadata
- attachments

## Step 9: Local Knowledge CLI and Codex

- secure pull/push
- local workspace
- structured suggestion files
- Web suggestion review

## Step 10: Optional Semantic Layer

- embeddings
- semantic search
- hybrid search
- Ask Knowledge

Do not start integrated PDF Reader before core flows are stable.

---

# 38. Definition of Done for Any Feature

A feature is not complete until:

- UI exists
- backend behavior exists
- authorization is enforced
- loading state exists
- empty state exists
- failure state exists
- mobile/tablet behavior is checked
- tests cover critical logic
- no destructive AI behavior is hidden
- data remains exportable where relevant

---

# 39. Example Initial Seed Data

Use for development/demo.

## Sources

```text
三联生活周刊 - 年轻人的消费正在发生变化
中国新闻周刊 - AI正在改变什么
```

## Notes

```text
年轻人的消费结构变化
消费趋势
人口结构
住房成本
日本低欲望社会
AI与就业
任务自动化
```

## Example Relations

```text
年轻人的消费结构变化 -> 消费趋势
年轻人的消费结构变化 -> 住房成本
消费趋势 -> 人口结构
AI与就业 -> 任务自动化
```

Suggested AI relation:

```text
消费趋势 - - -> 日本低欲望社会
```

---

# 40. Final Product Mental Model

The system pipeline is:

```text
Reading Material
      ↓
   Source
      ↓
 Highlight / Quick Note
      ↓
    Inbox
      ↓
knowledge pull → local Codex processing
      ↓
validated suggestions → Web review
      ↓
Durable Markdown Notes
      ↓
Confirmed + Suggested Relations
      ↓
Knowledge Graph
      ↓
Search / Explore / local Ask Knowledge
```

The system should optimize for:

```text
low-friction capture
→ low-friction organization
→ high-quality durable knowledge
→ explainable relationships
→ long-term portability
```

---

# 41. Short Implementation Brief for Coding Agents

If starting from scratch, build a single-user Next.js knowledge application with PostgreSQL.

First complete:

1. auth
2. Source / Highlight / QuickNote / Note CRUD
3. CodeMirror Markdown editor
4. wikilink parsing and autocomplete
5. backlinks
6. local/global graph
7. title/full-text search
8. tablet quick-capture UI
9. Markdown export

Only then add:

10. Local Knowledge CLI foundation
11. Secure pull/push and Web suggestion review
12. Codex relation discovery
13. Local Ask Knowledge

Remote OpenAI API integration, embeddings, semantic search, hybrid search, Web Ask Knowledge, PDF reader, and offline synchronization remain optional future work.

Never silently convert AI suggestions into confirmed knowledge.

Keep Markdown export working throughout development.

---

End of specification.
