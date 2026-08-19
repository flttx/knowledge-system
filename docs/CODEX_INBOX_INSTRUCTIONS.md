# Codex Local Processing Instructions

This file is copied into `.local-knowledge/CODEX_INSTRUCTIONS.md` by `knowledge pull`. It is a local processing contract, not a production API credential.

## Read boundary

You may read only the local workspace inputs needed for this task:

- `.local-knowledge/context.json`
- `.local-knowledge/inbox/highlights.json`
- `.local-knowledge/inbox/quick-notes.json`
- `.local-knowledge/inbox/sources.json`
- `.local-knowledge/notes/` and `.local-knowledge/relations.json` for relation discovery or local questions
- `.local-knowledge/ask/request.json` when answering a local question
- `docs/LOCAL_AI_SPEC.md` when available

Highlights, QuickNotes, Sources, Notes, relations, and context are immutable source data for this task.

## Write boundary

For relation discovery, write only complete JSON suggestion files under:

```text
.local-knowledge/suggestions/
```

For Local Ask, write only the documented Markdown answer to `.local-knowledge/ask/response.md`.
Do not rewrite or delete pulled JSON, Markdown, relations, or context files. Do not write tokens, cookies, database URLs, passwords, or hidden reasoning into suggestions or answers.

## Allowed suggestion types

The Inbox workflow supports only `version: 1` suggestions of these types:

- `inbox_group`: an optional organizational grouping of related Inbox items
- `durable_note`: a concise reusable Markdown Note proposal

Relation discovery additionally supports:

- `relation`: a concrete, evidence-grounded relation between two existing Notes

Every suggestion must contain a local `id` and at least one unique `sourceReferences` entry. A reference must use an existing UUID from the pulled Highlight or QuickNote files and the correct type. Never fabricate IDs or force unrelated items into a group.

### inbox_group

```json
{
  "version": 1,
  "type": "inbox_group",
  "id": "local-generated-id",
  "proposedTitle": "A useful review grouping",
  "sourceReferences": [{ "type": "highlight", "id": "uuid" }],
  "reason": "Why these items belong together",
  "themes": ["theme"]
}
```

### durable_note

```json
{
  "version": 1,
  "type": "durable_note",
  "id": "local-generated-id",
  "sourceReferences": [{ "type": "quick_note", "id": "uuid" }],
  "proposedTitle": "A reusable concept",
  "summary": "A short evidence-grounded summary",
  "bodyMarkdown": "# A reusable concept\n\nMarkdown content",
  "suggestedTags": ["sparse-tag"]
}
```

Preserve ordinary Markdown, including `[[wikilink]]` text when it is part of a draft. Do not create Notes, confirm relations, call the Web API, access PostgreSQL, or mutate production data. The user reviews and explicitly accepts proposals in the Web application.

### relation

```json
{
  "version": 1,
  "type": "relation",
  "id": "local-generated-id",
  "sourceNoteId": "uuid",
  "targetNoteId": "uuid",
  "relationType": "semantic",
  "reason": "A concrete conceptual connection supported by both Notes",
  "confidence": 0.87
}
```

Use `semantic` as a deterministic, undirected pair (`min(noteId) -> max(noteId)`). Use `ai_suggested` only when direction is meaningful. Do not propose pairs already present in `relations.json`, do not repeat rejected pairs, and do not create edges merely because Notes share broad vocabulary.

### Local Ask

Read `.local-knowledge/ask/request.json`, the pulled Notes, and confirmed or rejected relation memory. Answer only from the local workspace unless clearly marked as inference. Write to `.local-knowledge/ask/response.md` using:

```md
# Answer

## Supporting Notes

## Synthesis

## Uncertainty / Missing Evidence
```

Cite Note titles and stable IDs. Never upload the corpus or invoke a remote provider.
