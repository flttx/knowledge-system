<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Knowledge processing architecture

- The deployed Web application is the canonical knowledge system. It owns authentication, authorization, validation, persistence, review, and confirmed knowledge mutations.
- The deployed Web application must not directly call the OpenAI API for knowledge processing unless a future explicit requirement changes this decision.
- Do not invoke Codex CLI from Vercel, server request handlers, route handlers, or server actions. Codex runs locally through the future `knowledge` CLI workflow.
- Local knowledge processing must use authenticated pull/push APIs and structured suggestion files. Local suggestions are untrusted input and must be validated again by the server.
- Codex may create proposals only. It must not directly modify production knowledge, create confirmed relations, delete pulled source data, or silently merge Notes.
- Keep `.local-knowledge/` gitignored when the local CLI is implemented; it may contain private user knowledge.
- Browser authentication is database-backed: users have normalized usernames and scrypt password hashes, while opaque session tokens are stored hashed in PostgreSQL. Multiple valid sessions may exist for one user and logout revokes only the current session. Local Agent credentials are per-user hashed tokens managed in the authenticated settings UI.
