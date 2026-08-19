# API_CONTRACT.md

## Purpose

This document defines the canonical HTTP/API contract for the AI-native personal reading and knowledge system.

Primary references:

```text
AGENTS.md
docs/DEVELOPMENT_SPEC.md
IMPLEMENTATION_PLAN.md
DATA_MODEL.md
UI_SPEC.md
```

This document is authoritative for:

- endpoint shape
- request/response formats
- validation rules
- error semantics
- ownership requirements
- pagination
- AI endpoint behavior

Do not invent incompatible endpoint shapes without explicit reason.

---

# 1. Global API Rules

## 1.1 Authentication

All private endpoints require an authenticated user.

Unauthenticated response:

```http
401 Unauthorized
```

## 1.2 Ownership

Every object lookup must be scoped by authenticated user.

Never fetch by ID alone.

Bad:

```ts
getNote(id)
```

Good:

```ts
getNote(userId, id)
```

## 1.3 Content Type

Use JSON for application APIs.

```http
Content-Type: application/json
```

File downloads may use binary/archive responses.

## 1.4 Error Shape

Canonical error body:

```json
{
  "error": {
    "code": "NOTE_NOT_FOUND",
    "message": "Note not found",
    "details": {}
  }
}
```

`details` is optional.

## 1.5 Success Shape

Do not wrap every response unnecessarily.

Prefer direct resource payloads.

Example:

```json
{
  "id": "...",
  "title": "...",
  "contentMarkdown": "..."
}
```

Lists may use:

```json
{
  "items": [],
  "nextCursor": null
}
```

## 1.6 Pagination

Use cursor pagination for large lists.

Query:

```text
?cursor=<opaque>&limit=20
```

Response:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

Default limit:

```text
20
```

Maximum:

```text
100
```

## 1.7 Dates

Use ISO 8601 strings.

Example:

```text
2026-08-17T16:00:00+08:00
```

## 1.8 IDs

UUID strings.

---

# 2. Common Error Codes

Use stable machine-readable codes.

```text
UNAUTHORIZED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
RATE_LIMITED
INTERNAL_ERROR
AI_PROVIDER_ERROR
AI_INVALID_OUTPUT
EXPORT_FAILED
FILE_TOO_LARGE
UNSUPPORTED_FILE_TYPE
```

Domain-specific examples:

```text
NOTE_NOT_FOUND
SOURCE_NOT_FOUND
HIGHLIGHT_NOT_FOUND
QUICK_NOTE_NOT_FOUND
RELATION_NOT_FOUND
SUGGESTION_NOT_FOUND
DUPLICATE_NOTE_SLUG
WIKILINK_TARGET_AMBIGUOUS
```

---

# 3. Notes API

## GET /api/notes

List notes.

### Query

```text
cursor?
limit?
tag?
archived?
q?
```

### Response

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "消费趋势",
      "slug": "消费趋势",
      "excerpt": "……",
      "tags": ["消费", "经济"],
      "updatedAt": "2026-08-17T10:00:00+08:00"
    }
  ],
  "nextCursor": null
}
```

Do not include full `contentMarkdown` in list payload by default.

---

## POST /api/notes

Create note.

### Request

```json
{
  "title": "消费趋势",
  "contentMarkdown": "# 消费趋势\n\n...",
  "tagNames": ["消费", "经济"]
}
```

### Validation

- title required
- contentMarkdown may be empty
- tagNames optional
- generated slug must be unique within user

### Response

```http
201 Created
```

```json
{
  "id": "uuid",
  "title": "消费趋势",
  "slug": "消费趋势",
  "contentMarkdown": "# 消费趋势\n\n...",
  "tags": ["消费", "经济"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## GET /api/notes/:id

Return full note.

### Response

```json
{
  "id": "uuid",
  "title": "消费趋势",
  "slug": "消费趋势",
  "contentMarkdown": "...",
  "tags": ["消费"],
  "createdAt": "...",
  "updatedAt": "...",
  "archivedAt": null
}
```

---

## PATCH /api/notes/:id

Update note.

### Request

Partial:

```json
{
  "title": "新的标题",
  "contentMarkdown": "...",
  "tagNames": ["消费"]
}
```

### Behavior

If `contentMarkdown` changes:

1. save note
2. parse wikilinks
3. synchronize wikilink relations
4. update timestamps

This should be transactional.

### Response

Updated Note.

---

## DELETE /api/notes/:id

MVP semantics:

Soft archive.

### Response

```json
{
  "archived": true
}
```

Permanent deletion should use a separate explicit endpoint later.

---

# 4. Sources API

## GET /api/sources

Query:

```text
cursor?
limit?
sourceType?
publication?
archived?
q?
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "年轻人的消费正在发生变化",
      "publication": "三联生活周刊",
      "sourceType": "magazine",
      "publishedAt": "...",
      "highlightCount": 8
    }
  ],
  "nextCursor": null
}
```

---

## POST /api/sources

Request:

```json
{
  "title": "年轻人的消费正在发生变化",
  "publication": "三联生活周刊",
  "author": null,
  "issue": "2026年第32期",
  "sourceType": "magazine",
  "url": null,
  "publishedAt": "2026-08-17T00:00:00+08:00"
}
```

Response:

```http
201 Created
```

Source resource.

---

## GET /api/sources/:id

Response includes:

```json
{
  "id": "uuid",
  "title": "...",
  "publication": "...",
  "author": "...",
  "issue": "...",
  "sourceType": "magazine",
  "url": null,
  "fileUrl": null,
  "publishedAt": "...",
  "highlightCount": 8,
  "createdAt": "...",
  "updatedAt": "..."
}
```

Do not inline all highlights by default.

---

## PATCH /api/sources/:id

Partial update.

---

## DELETE /api/sources/:id

Archive by default.

Must not delete associated Highlights.

---

# 5. Highlights API

## GET /api/highlights

Query:

```text
cursor?
limit?
status?
sourceId?
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "sourceId": "uuid",
      "sourceTitle": "年轻人的消费正在发生变化",
      "text": "……",
      "personalComment": "可能不是消费降级，而是消费迁移。",
      "page": 46,
      "status": "inbox",
      "createdAt": "..."
    }
  ],
  "nextCursor": null
}
```

---

## POST /api/highlights

Request:

```json
{
  "sourceId": "uuid",
  "text": "年轻人的消费正在从物质占有转向体验型消费。",
  "page": 46,
  "location": null,
  "personalComment": "可能不是消费降级，而是消费迁移。"
}
```

Minimum:

```json
{
  "text": "..."
}
```

Response:

```http
201 Created
```

Highlight resource.

New Highlight status:

```text
inbox
```

---

## PATCH /api/highlights/:id

Allowed updates:

```text
sourceId
text
page
location
personalComment
status
```

AI must not call this endpoint to rewrite original Highlight text without explicit user-triggered behavior.

---

## DELETE /api/highlights/:id

Archive by default.

---

# 6. Quick Notes API

## GET /api/quick-notes

Query:

```text
cursor?
limit?
status?
sourceId?
```

---

## POST /api/quick-notes

Request:

```json
{
  "content": "住房成本可能是影响年轻人消费意愿的重要变量。",
  "sourceId": "uuid"
}
```

Only `content` is required.

New item status:

```text
inbox
```

---

## PATCH /api/quick-notes/:id

Partial update.

---

## DELETE /api/quick-notes/:id

Archive by default.

---

# 7. Inbox API

Inbox is a derived view.

## GET /api/inbox

Query:

```text
cursor?
limit?
type?
```

`type`:

```text
highlight
quick_note
ai_suggestion
```

Response:

```json
{
  "items": [
    {
      "type": "highlight",
      "id": "uuid",
      "createdAt": "...",
      "data": {}
    },
    {
      "type": "ai_suggestion",
      "id": "uuid",
      "createdAt": "...",
      "data": {}
    }
  ],
  "nextCursor": null
}
```

Sort:

```text
createdAt desc
```

unless later product requirements introduce explicit Inbox ordering.

---

# 8. Tags API

## GET /api/tags

Query:

```text
q?
limit?
```

Response:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "消费",
      "noteCount": 12
    }
  ]
}
```

## POST /api/tags

Usually not required directly if tags are created through Note mutation.

If exposed:

```json
{
  "name": "消费"
}
```

---

# 9. Backlinks API

## GET /api/notes/:id/backlinks

Response:

```json
{
  "items": [
    {
      "noteId": "uuid",
      "title": "年轻人的消费结构变化",
      "relationType": "wikilink",
      "context": "...[[消费趋势]]..."
    }
  ]
}
```

Only confirmed incoming relations.

Suggested relations are NOT included.

---

# 10. Related Suggestions API

## GET /api/notes/:id/suggestions

Response:

```json
{
  "items": [
    {
      "suggestionId": "uuid",
      "noteId": "uuid",
      "title": "日本低欲望社会",
      "confidence": 0.87,
      "reason": "Both notes discuss income expectations, savings preference, housing burden, and consumption structure."
    }
  ]
}
```

---

# 11. Graph API

## GET /api/graph/local/:noteId

Query:

```text
depth=1|2
includeSuggested=false|true
```

Default:

```text
depth=1
includeSuggested=false
```

Response:

```json
{
  "nodes": [
    {
      "id": "uuid",
      "title": "消费趋势",
      "tags": ["消费"]
    }
  ],
  "edges": [
    {
      "id": "uuid",
      "source": "uuid",
      "target": "uuid",
      "relationType": "wikilink",
      "status": "confirmed"
    }
  ]
}
```

Do not include full Note bodies.

---

## GET /api/graph/global

Query:

```text
tag?
relationType?
includeSuggested=false|true
limit?
```

Response uses same node/edge shape.

Server should enforce safe maximums.

---

# 12. Search API

## GET /api/search

Query:

```text
q=<query>
type=all|note|source|highlight
limit=20
```

Lexical/full-text search.

Response:

```json
{
  "items": [
    {
      "type": "note",
      "id": "uuid",
      "title": "消费趋势",
      "snippet": "……",
      "score": 0.92
    }
  ]
}
```

`score` may remain internal if UI does not need it.

---

## GET /api/search/semantic (Future / Optional)

Phase 2.

Query:

```text
q=<query>
type=note
limit=20
```

Response same basic result shape.

---

## GET /api/search/hybrid (Future / Optional)

Phase 2.

Query:

```text
q=<query>
type=all
limit=20
```

Backend determines ranking.

Do not expose weighting parameters to ordinary users initially.

---

# 13. Local Agent Suggestion APIs

The current architecture does not expose Web endpoints that trigger model calls. The local `knowledge` CLI pulls canonical data, Codex writes structured local suggestions, and the CLI imports them through authenticated APIs.

All local-agent endpoints are private, user-scoped, schema-validated, and must not accept direct PostgreSQL credentials.

## GET /api/local-agent/status

Returns compact authenticated status for the local workspace/CLI handshake. It must not include private content or secrets.

Authentication uses `Authorization: Bearer <token>`. The server hashes the
token and looks up an active, unrevoked row in `local_agent_tokens`, then
resolves the owning user from that row. The request cannot provide a user ID.
Tokens are created and revoked per user from the authenticated settings API;
the raw token is returned only once at creation time.

## Local Agent token management

`GET /api/settings/local-agent-tokens` lists the authenticated user's token
metadata without token values. `POST /api/settings/local-agent-tokens` creates
a token from a validated name and returns the raw token once. `POST
/api/settings/local-agent-tokens/:id` revokes only the authenticated user's
matching token. All three endpoints require the browser session and enforce
ownership server-side.

## POST /api/local-agent/pull

Request:

```json
{
  "scope": "inbox"
}
```

Supported scopes include `inbox`, `notes`, and `all`. `inbox` returns only current Inbox Highlights and QuickNotes plus referenced Sources. `notes` returns active Notes, tag names, and confirmed relations. `all` returns both and all owned Highlight, QuickNote, and Source records. Every query is scoped to the authenticated user. Markdown remains canonical.

## POST /api/local-agent/suggestions/import

Uses the Local Agent Bearer credential. Request:

```json
{
  "suggestions": [
    {
      "version": 1,
      "type": "durable_note",
      "id": "local-generated-id",
      "sourceReferences": [{ "type": "highlight", "id": "uuid" }],
      "proposedTitle": "A reusable concept",
      "summary": "A short summary",
      "bodyMarkdown": "# A reusable concept",
      "suggestedTags": ["topic"]
    }
  ]
}
```

T28–T30 support `inbox_group` and `durable_note`. The CLI validates all local files before upload; the server validates the schema, authenticated ownership of every referenced ID, supported type, and duplicate/idempotency rules before inserting `ai_suggestions` rows. Import never creates a durable Note or confirmed relation directly. `input_hash` is computed from the canonical validated payload and is unique per user.

## POST /api/local-agent/suggestions/:id/accept

Uses the authenticated Web session, not the Local Agent Bearer credential. Accepts an imported suggestion after user review. Durable-note acceptance may create a Note and associated tags transactionally.

## POST /api/local-agent/suggestions/:id/reject

Uses the authenticated Web session. Persists rejection without deleting source data.

## POST /api/local-agent/suggestions/:id/ignore

Uses the authenticated Web session. Dismisses the suggestion from the current review workflow without treating it as confirmed knowledge.

The following provider-triggering endpoint shapes are historical and superseded. Do not implement them:

---

## Historical / superseded: POST /api/ai/process-inbox

Goal:

Group Inbox items.

Request:

```json
{
  "highlightIds": ["uuid"],
  "quickNoteIds": ["uuid"]
}
```

If omitted, server may select recent eligible Inbox items for the user.

Response:

```json
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "inbox_group",
      "status": "pending",
      "payload": {
        "title": "年轻人的消费结构变化",
        "itemIds": ["uuid"],
        "reason": "..."
      }
    }
  ]
}
```

No source object statuses change yet.

---

## Historical / superseded: POST /api/ai/suggest-note

Request:

```json
{
  "highlightIds": ["uuid"],
  "quickNoteIds": ["uuid"],
  "sourceIds": ["uuid"]
}
```

Response:

```json
{
  "suggestion": {
    "id": "uuid",
    "type": "durable_note",
    "status": "pending",
    "payload": {
      "proposedTitle": "年轻人的消费结构变化",
      "bodyMarkdown": "# 年轻人的消费结构变化\n\n...",
      "suggestedTags": ["消费", "年轻人"],
      "relatedNotes": [
        {
          "noteId": "uuid",
          "reason": "...",
          "confidence": 0.87
        }
      ]
    }
  }
}
```

---

## Historical / superseded: POST /api/ai/suggest-relations

Request:

```json
{
  "noteId": "uuid"
}
```

Response:

```json
{
  "suggestions": [
    {
      "id": "uuid",
      "type": "relation",
      "status": "pending",
      "payload": {
        "sourceNoteId": "uuid",
        "targetNoteId": "uuid",
        "confidence": 0.87,
        "reason": "...",
        "overlappingConcepts": [
          "收入预期",
          "储蓄倾向",
          "住房负担"
        ]
      }
    }
  ]
}
```

---

# 14. Local Agent Suggestion Review Semantics

## POST /api/local-agent/suggestions/:id/accept

Behavior depends on suggestion type.

### Durable Note

Request may include edits:

```json
{
  "title": "年轻人的消费结构变化",
  "bodyMarkdown": "...",
  "tagNames": ["消费", "年轻人"],
  "confirmedRelatedNoteIds": ["uuid"]
}
```

Transaction:

1. validate suggestion ownership/status
2. create Note
3. create tags
4. create explicitly confirmed relations
5. mark selected source items processed
6. mark suggestion accepted

Response:

```json
{
  "suggestionId": "uuid",
  "status": "accepted",
  "createdNoteId": "uuid"
}
```

### Relation

Accept converts/creates confirmed relation.

Response:

```json
{
  "relationId": "uuid",
  "status": "confirmed"
}
```

---

## POST /api/local-agent/suggestions/:id/reject

Response:

```json
{
  "id": "uuid",
  "status": "rejected"
}
```

Persist rejection.

---

## POST /api/local-agent/suggestions/:id/ignore

Response:

```json
{
  "id": "uuid",
  "status": "ignored"
}
```

Difference:

- reject = actively do not suggest again for unchanged input
- ignore = dismiss from current workflow, may reappear later under changed conditions

---

# 15. Ask Knowledge (Local First; No Web Model Endpoint)

Initial Ask Knowledge is a local Codex workflow over a pulled workspace:

```bash
knowledge pull --notes
codex
```

Do not implement a Web model endpoint for this workflow. A future local or remote provider may define a separate contract after explicit architecture review.

## Historical / superseded: POST /api/ai/ask

Request:

```json
{
  "question": "最近我关于房地产和消费之间记录了哪些观点？"
}
```

Optional later:

```json
{
  "question": "...",
  "filters": {
    "tags": ["消费"],
    "sourceTypes": ["magazine"]
  }
}
```

Response:

```json
{
  "answerMarkdown": "你的知识库里主要形成了三个观点……",
  "citations": [
    {
      "type": "note",
      "id": "uuid",
      "title": "住房成本与消费挤压"
    },
    {
      "type": "highlight",
      "id": "uuid",
      "title": "三联生活周刊摘录"
    }
  ],
  "insufficientEvidence": false
}
```

If evidence is weak:

```json
{
  "answerMarkdown": "目前你的知识库里没有足够资料支持明确结论。",
  "citations": [],
  "insufficientEvidence": true
}
```

---

# 16. Export API

## POST /api/export

Request:

```json
{
  "format": "archive"
}
```

Response may be:

```json
{
  "jobId": "uuid"
}
```

or direct file response if small enough.

MVP single-user archive can be generated synchronously if reliable.

Archive structure follows `DATA_MODEL.md`.

---

## GET /api/export/:id

If job-based.

Returns status or download.

---

# 17. Attachment API

Phase when file upload is implemented.

## POST /api/attachments

Multipart upload.

Validation:

- authenticated
- max size
- allowed MIME types
- private storage
- ownership

Response:

```json
{
  "id": "uuid",
  "fileName": "image.png",
  "mimeType": "image/png",
  "sizeBytes": 12345
}
```

Do not return permanent public storage URL.

---

# 18. Validation Rules

Use a schema validator such as Zod.

Validation should happen:

```text
client for UX
+
server for trust
```

Server validation is authoritative.

---

# 19. Idempotency

Consider idempotency for:

- AI suggestion generation
- export generation
- repeated acceptance actions
- file upload callbacks

At minimum, accepting an already accepted suggestion must not create duplicate Notes or relations.

---

# 20. Rate Limiting

Apply where useful:

```text
AI endpoints
auth endpoints
file upload
expensive search
```

Do not overcomplicate ordinary CRUD initially.

---

# 21. API Compatibility Rules

Do not casually rename:

```text
contentMarkdown
sourceId
personalComment
relationType
status
```

These names are part of the product contract.

When changing API shape:

1. update this file
2. update schemas/types
3. update client calls
4. update tests

---

# 22. Required API Tests

At minimum:

```text
unauthenticated private endpoint -> 401
cross-user object fetch -> 404 or 403
create Note
update Note
wikilink sync on Note update
create Highlight
Inbox list
import and accept a local durable-note suggestion transaction
reject relation suggestion
local graph
full-text search
export
```

---

# 23. API Decisions Already Made

1. APIs are private by default.
2. Ownership is checked server-side.
3. Lists do not return full Note bodies.
4. Inbox is a derived endpoint.
5. Local Codex/agent output is imported as persisted suggestions.
6. Accepting AI suggestions is explicit.
7. Rejection is persistent.
8. Graph payloads are compact.
9. Search supports multiple object types.
10. Ask Knowledge returns internal citations.

---

End of API_CONTRACT.md

## T31-T32 additions

The local suggestion import endpoint also accepts `relation` proposals with `sourceNoteId`, `targetNoteId`, `relationType` (`semantic` or `ai_suggested`), non-empty `reason`, and `confidence` from 0 to 1. The server validates active Note ownership, self-links, confirmed relation duplicates, and rejected relation memory. Import creates only a pending `ai_suggestions` row.

The Web accept endpoint confirms a relation transactionally and returns:

```json
{
  "suggestionId": "uuid",
  "status": "accepted",
  "relationId": "uuid"
}
```

Relation rejection persists a rejected `note_relations` memory row. Local Notes pull includes confirmed and rejected relation memory. T32 has no Web ask endpoint; `knowledge ask` is a local request-file workflow.
