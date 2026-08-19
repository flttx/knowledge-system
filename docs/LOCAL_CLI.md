# Local Knowledge CLI

T25–T30 provide a repository-local `knowledge` CLI for pulling canonical user data and importing validated local suggestions. It does not connect to PostgreSQL or invoke Codex.

## Server configuration

Local Agent credentials are created per user from the authenticated Web
settings page at `/settings/local-agent`. The server stores only a hash of each
token in `local_agent_tokens`; it does not use global environment variables for
CLI authentication. The raw token is shown once, so copy it immediately into
the local CLI environment.

## CLI configuration

Configure the local shell, IDE task, or a gitignored user-level environment file:

```env
KNOWLEDGE_BASE_URL=https://your-app.example.com
KNOWLEDGE_TOKEN=the-raw-token-used-to-create-the-server-hash
```

Never commit `KNOWLEDGE_TOKEN`, `.env.local`, or `.local-knowledge/`. The CLI never writes the token to the workspace or displays it in `status` output. `KNOWLEDGE_WORKSPACE` can optionally select another local workspace directory; it defaults to `.local-knowledge`.

## Commands

The repository-local command is invoked through npm:

```bash
npm run knowledge -- status
npm run knowledge -- pull --inbox
npm run knowledge -- pull --notes
npm run knowledge -- pull --all
npm run knowledge -- push
```

`pull` defaults to `--all`. `--inbox` updates only Inbox JSON and referenced Sources. `--notes` updates only active Notes, their index, and confirmed relations. `--all` updates both sets and includes all owned Highlight, QuickNote, and Source records; active Notes and confirmed relations are included. Failed requests return a non-zero exit code and do not modify the workspace.

## Workspace

The CLI creates:

```text
.local-knowledge/
├── context.json
├── inbox/
│   ├── highlights.json
│   ├── quick-notes.json
│   └── sources.json
├── notes/
│   ├── index.json
│   └── <note-id>.md
├── relations.json
└── suggestions/
```

Note files contain the server's `contentMarkdown` bytes as Markdown; metadata and tag names are kept in `notes/index.json`. This keeps Markdown, including `[[wikilink]]` text, untouched. Stable IDs are authoritative. Each selected server-derived file is replaced atomically, and stale selected Note Markdown files are removed. The `suggestions/` directory is created but never deleted or imported by this batch.

`context.json` contains only workspace metadata, the configured base URL, pull scope, timestamp, and counts. It contains no token, password, database URL, or account secret.

## Suggestion push

`knowledge push` discovers top-level `.json` files under `suggestions/`. It validates every file against the shared `inbox_group`/`durable_note` schema and checks every Highlight/QuickNote reference against the pulled Inbox before making any network request. If any file is invalid, the whole push fails before server mutation.

The server validates ownership and object availability again. A successful push stores pending rows in `ai_suggestions`; it never creates a Note or changes Inbox status. Repeating an unchanged push reports `Already present` because the server uses a deterministic content hash. A modified suggestion has a new hash and is treated as a new proposal. Accepted, rejected, and ignored proposals are not recreated by the same unchanged file.

The Web Inbox is the review surface. `durable_note` proposals may be edited and explicitly accepted; acceptance creates a Note, attaches approved tags, marks referenced Inbox items processed, and preserves their content. `inbox_group` proposals are organizational evidence and can only be ignored or rejected in this batch.

## T31 relation discovery

After `knowledge pull --notes`, Codex may read local Notes, `notes/index.json`, and `relations.json`, then write only relation JSON files under `suggestions/`. Relation proposals are validated locally and on the server. They remain pending until Web confirmation. Rejected relation pairs are preserved in `relations.json` so unchanged pairs are not suggested repeatedly.

## T32 Local Ask Knowledge

```bash
npm run knowledge -- ask "your question"
```

The command requires an existing Notes workspace, atomically writes `.local-knowledge/ask/request.json`, and leaves any existing `ask/response.md` untouched. The request contains only the question, local input paths, instruction file, and fixed response path. It contains no credentials and never invokes Codex or uploads the corpus. Run Codex manually to write `.local-knowledge/ask/response.md`.
