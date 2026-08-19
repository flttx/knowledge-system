# Export format

`POST /api/export` generates a standard ZIP download rooted at `knowledge-export/`.

- Active Notes are written to `Notes/<safe-title>.md`.
- Archived Notes are written to `Archive/<safe-title>.md`.
- Note `contentMarkdown` is copied as the Markdown body without rendering or normalization. `[[wikilinks]]`, tables, code blocks, task lists, and Chinese text remain in the body.
- User-visible tag names are written to YAML frontmatter; normalized tag values are not exported.
- `Sources/sources.json`, `Highlights/highlights.json`, and `QuickNotes/quick-notes.json` contain all current-user records, including archived records.
- `relations.json` keeps relation type and status explicit, so suggested or rejected relations are never represented as confirmed knowledge.
- `manifest.json` records counts for Notes, Sources, Highlights, QuickNotes, relations, and attachments.

The current application has an attachments table but no upload or storage read service. `Assets/attachments.json` therefore exports safe attachment metadata with `exportStatus: "metadata-only"`; it does not expose `storageKey` or private URLs and does not pretend that file bytes were exported. When attachment storage exists, the archive service is the integration point for adding owned bytes under `Assets/`.

The archive contains no users, passwords, session data, authentication hashes, or database connection information.
