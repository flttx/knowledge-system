# DATA_MODEL.md

## Purpose

This document defines the canonical data model for the AI-native personal reading and knowledge system.

Primary references:

```text
AGENTS.md
docs/DEVELOPMENT_SPEC.md
IMPLEMENTATION_PLAN.md
```

This document is authoritative for:

- database entities
- ownership rules
- lifecycle states
- relation semantics
- indexes
- uniqueness constraints
- deletion behavior
- AI suggestion state
- export mapping

Do not change this model casually.

---

# 1. Global Conventions

## 1.1 Primary Keys

Use UUIDs.

```sql
id uuid primary key
```

## 1.2 Ownership

Every user-owned table must include:

```sql
user_id uuid not null
```

Every read/write must be scoped by `user_id`.

## 1.3 Timestamps

Use:

```sql
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 1.4 Soft Deletion / Archival

Prefer soft deletion or archival for user knowledge.

Use `archived_at timestamptz null` where relevant.

Hard delete should be reserved for explicit permanent-delete flows.

## 1.5 Text Storage

Durable Note content is stored as Markdown.

Canonical field:

```sql
content_markdown text not null
```

Do not use editor-specific JSON as the only canonical source.

---

# 2. Entity Overview

```text
User
 ├─ Sources
 │   └─ Highlights
 ├─ QuickNotes
 ├─ Notes
 │   ├─ NoteTags
 │   ├─ NoteRelations
 │   └─ Embeddings
 ├─ Tags
 ├─ Attachments
 └─ AISuggestions
```

---

# 3. users

Represents authenticated application users.

The exact auth-provider schema may differ, but application ownership must resolve to a stable internal user ID.

Current app-level shape:

```sql
users
-----
id uuid primary key
username text unique
password_hash text
status text not null -- active | disabled
email text unique null
display_name text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Users are provisioned administratively; there is no public registration. User
names are normalized before uniqueness checks. Password hashes use the server's
scrypt format and are never returned to clients. Existing knowledge rows keep
their `user_id` values during authentication migration.

## 3.1 sessions

```sql
sessions
--------
id uuid primary key
user_id uuid not null references users(id) on delete cascade
token_hash text unique not null
created_at timestamptz not null default now()
expires_at timestamptz not null
last_seen_at timestamptz null
revoked_at timestamptz null
```

Sessions are opaque, server-side records. The browser receives only a random
HttpOnly token; the database stores its SHA-256 hash. Multiple active sessions
for one user are valid concurrently, and logout revokes only the current row.

## 3.2 local_agent_tokens

```sql
local_agent_tokens
------------------
id uuid primary key
user_id uuid not null references users(id) on delete cascade
name text not null
token_hash text unique not null
created_at timestamptz not null default now()
last_used_at timestamptz null
expires_at timestamptz null
revoked_at timestamptz null
```

Local Agent tokens are per-user bearer credentials. The raw token is displayed
only at creation time and is never persisted.

---

# 4. sources

Represents material the user consumed.

Examples:

- magazine article
- PDF
- web article
- book chapter

## 4.1 Schema

```sql
sources
-------
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
archived_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 4.2 source_type

Allowed values:

```text
article
magazine
pdf
book
web
other
```

Prefer database enum or validated text union.

## 4.3 Indexes

```text
(user_id, created_at desc)
(user_id, title)
(user_id, source_type)
```

Optional later:

```text
FTS index over title/publication/author
```

---

# 5. highlights

Represents a raw excerpt from a Source.

Highlights are evidence and should remain immutable by AI unless the user edits them.

## 5.1 Schema

```sql
highlights
----------
id uuid primary key
user_id uuid not null
source_id uuid null
text text not null
page integer
location text
personal_comment text
status text not null default 'inbox'
archived_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 5.2 status

Allowed values:

```text
inbox
processed
archived
```

## 5.3 Constraints

- `source_id` is optional.
- if `source_id` is set, referenced Source must belong to same user.
- `text` must not be empty.

## 5.4 Indexes

```text
(user_id, status, created_at desc)
(user_id, source_id)
```

---

# 6. quick_notes

Represents fast human thoughts.

May exist independently of a Source.

## 6.1 Schema

```sql
quick_notes
-----------
id uuid primary key
user_id uuid not null
source_id uuid null
content text not null
status text not null default 'inbox'
archived_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 6.2 status

```text
inbox
processed
archived
```

## 6.3 Indexes

```text
(user_id, status, created_at desc)
(user_id, source_id)
```

---

# 7. notes

Represents durable knowledge.

## 7.1 Schema

```sql
notes
-----
id uuid primary key
user_id uuid not null
title text not null
slug text not null
content_markdown text not null default ''
archived_at timestamptz
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 7.2 Constraints

Unique within user:

```text
(user_id, slug)
```

Title does not need to be globally unique, but duplicate titles should be discouraged in UI because wikilink resolution becomes ambiguous.

## 7.3 Slug Rules

Slug should be stable enough for URLs but not treated as identity.

Identity is `id`.

Slug changes should not break internal relations because relations use IDs.

## 7.4 Indexes

```text
(user_id, updated_at desc)
(user_id, title)
(user_id, slug unique)
```

Add FTS indexes in search phase.

---

# 8. tags

Reusable labels.

## 8.1 Schema

```sql
tags
----
id uuid primary key
user_id uuid not null
name text not null
normalized_name text not null
created_at timestamptz not null default now()
```

## 8.2 Constraint

Unique:

```text
(user_id, normalized_name)
```

Normalization may include:

- trim
- lowercase where appropriate
- Unicode normalization

Do not aggressively transliterate or alter Chinese tags.

---

# 9. note_tags

Many-to-many mapping.

```sql
note_tags
---------
note_id uuid not null
tag_id uuid not null
created_at timestamptz not null default now()

primary key (note_id, tag_id)
```

Ownership must be validated through parent records.

---

# 10. note_relations

Represents graph edges.

This is a critical table.

## 10.1 Schema

```sql
note_relations
--------------
id uuid primary key
user_id uuid not null
source_note_id uuid not null
target_note_id uuid not null
relation_type text not null
status text not null
confidence numeric
reason text
origin_key text
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 10.2 relation_type

Allowed:

```text
wikilink
manual
ai_suggested
semantic
```

Interpretation:

### wikilink
Derived from literal Markdown `[[wikilink]]`.

### manual
Explicit user-created relation not necessarily represented in Markdown.

### ai_suggested
AI-proposed relationship.

### semantic
System-derived similarity relation.

Use sparingly. Semantic similarity should not automatically become confirmed knowledge.

## 10.3 status

Allowed:

```text
confirmed
suggested
rejected
```

Rules:

```text
wikilink => confirmed
manual => confirmed
ai_suggested => suggested initially
semantic => suggested initially
```

## 10.4 Constraints

Disallow:

```text
source_note_id = target_note_id
```

Avoid duplicates for same semantic edge.

Recommended uniqueness:

```text
(user_id, source_note_id, target_note_id, relation_type, origin_key)
```

## 10.5 Directionality

Wikilinks are directional at storage level:

```text
A -> B
```

Backlinks are derived from incoming edges.

## 10.6 AI Rejection Memory

Rejected AI relationships should persist.

Do not delete rejected rows immediately.

This prevents repeated re-suggestion.

---

# 11. attachments

Represents uploaded assets.

## 11.1 Schema

```sql
attachments
-----------
id uuid primary key
user_id uuid not null
storage_key text not null
file_name text not null
mime_type text not null
size_bytes bigint not null
source_id uuid null
note_id uuid null
created_at timestamptz not null default now()
```

## 11.2 Rules

- object bucket is private
- use signed access URLs where applicable
- attachment must belong to user
- one attachment may optionally associate with Source or Note

Do not make object storage URLs permanently public by default.

---

# 12. ai_suggestions

Stores reviewable agent/AI proposals. In the current architecture, the primary producer is local Codex through the Knowledge CLI. Future approved producers may include an OpenAI API provider, a local model, or another agent, but the producer never bypasses server validation and user review.

## 12.1 Schema

```sql
ai_suggestions
--------------
id uuid primary key
user_id uuid not null
suggestion_type text not null
source_object_type text not null
source_object_id uuid not null
payload jsonb not null
input_hash text
prompt_version text
status text not null default 'pending'
created_at timestamptz not null default now()
reviewed_at timestamptz
```

## 12.2 suggestion_type

Initial allowed values:

```text
inbox_group
durable_note
tags
relation
summary
```

## 12.3 status

```text
pending
accepted
rejected
ignored
expired
```

## 12.4 Rules

Agent/AI output must not directly mutate durable knowledge before review unless the user explicitly invokes an action whose semantics are clear.

Local Codex mapping:

```text
.local-knowledge/suggestions/<validated-file>.json
        ↓ authenticated import
ai_suggestions.payload
```

The imported `suggestion_type`, `payload`, `input_hash`, and `prompt_version` preserve proposal type, provenance, deduplication context, and instruction/schema version. The server must validate all referenced object IDs against the authenticated user before persistence.

The local file type `tag` maps to the existing database enum value `tags`; no schema rename or migration is required.

## 12.5 input_hash

Used to avoid recomputing identical suggestions.

Hash should be based on relevant canonical input content and prompt version.

---

# 13. embeddings (Future / Optional)

Phase 2+.

Stores vector representations.

## 13.1 Schema

```sql
embeddings
----------
id uuid primary key
user_id uuid not null
object_type text not null
object_id uuid not null
model text not null
content_hash text not null
embedding vector(...)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

## 13.2 Initial object_type

Start with:

```text
note
```

Later:

```text
highlight
source
```

## 13.3 Uniqueness

```text
(user_id, object_type, object_id, model)
```

## 13.4 Update Rule

Regenerate only when `content_hash` changes.

---

# 14. Inbox Semantics

Inbox is not a separate table initially.

Inbox is a query over:

```text
highlights.status = inbox
quick_notes.status = inbox
ai_suggestions.status = pending
```

This avoids an unnecessary generic polymorphic Inbox table.

If future requirements require independent Inbox ordering/pinning/group lifecycle, introduce `inbox_items` later.

Do not add it preemptively.

---

# 15. Derived Data

Derived rather than duplicated:

## Backlinks

Incoming confirmed `note_relations`.

## Local Graph

Relations around current Note.

## Global Graph

Visible Notes + relations.

## Suggested Related Notes

Pending relation suggestions or suggested `note_relations`.

## Note Tag Names

Derived from `note_tags` + `tags`.

---

# 16. Lifecycle Rules

## Highlight

```text
inbox
↓
processed
↓
archived
```

## QuickNote

```text
inbox
↓
processed
↓
archived
```

## AI Suggestion

```text
pending
├─ accepted
├─ rejected
├─ ignored
└─ expired
```

## Note

```text
active
↓
archived
```

Permanent deletion is separate.

---

# 17. Transaction Rules

Use transactions for multi-step mutations.

## Accept Durable-Note Suggestion

Transaction:

```text
create Note
create tags if accepted
create explicitly confirmed relations
mark suggestion accepted
mark selected source Inbox items processed
```

Rollback if a critical step fails.

## Wikilink Synchronization

Transaction:

```text
save Note content
parse links
add missing wikilink relations
remove stale wikilink relations
```

Do not leave content and graph inconsistent.

---

# 18. Search Indexing

Initial searchable fields:

## Notes

```text
title
content_markdown
```

## Sources

```text
title
publication
author
```

## Highlights

```text
text
personal_comment
```

Use PostgreSQL FTS and keep queries user-scoped.

---

# 19. Export Mapping

## Note

```text
Notes/<safe-file-name>.md
```

Frontmatter:

```yaml
---
id: <uuid>
created: <timestamp>
updated: <timestamp>
tags:
  - ...
---
```

Body is `content_markdown`.

## Sources

```text
Sources/sources.json
```

## Highlights

```text
Highlights/highlights.json
```

## Relations

Wikilinks remain in Markdown.

Non-wikilink confirmed relations may be exported in:

```text
relations.json
```

Do not modify user Markdown just to force export representation.

---

# 20. Explicit Data Decisions

1. Source and Note are separate.
2. Highlight and QuickNote are separate.
3. Inbox is initially derived.
4. Markdown is canonical Note content.
5. Graph edges use Note IDs.
6. AI suggestions are persisted separately.
7. Rejected AI relations are remembered.
8. Wikilinks create confirmed directed relations.
9. Backlinks are derived.
10. Export is first-class.
11. Ownership applies to every private entity.
12. Embeddings are derived and regenerable.

---

End of DATA_MODEL.md
