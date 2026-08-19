# Search implementation notes

The lexical search implementation is PostgreSQL-native and user-scoped.

## Local database setup

```bash
docker start knowledge-system-postgres
```

With `.env.local` configured from `.env.example`, apply the schema and seed the
single-user profile:

```bash
npm run db:migrate
npm run db:seed
```

The search migration enables PostgreSQL's `pg_trgm` extension and creates
partial GIN trigram indexes for active Note, Source, and Highlight search
fields. PostgreSQL's `simple` text search configuration is used for lexical
ranking; trigram matching is also used because the built-in tokenizer treats a
Chinese phrase such as `消费趋势` as one token and does not match the shorter
query `消费`.

No external search service, search cache, semantic search, or embeddings are
required for T19-T20.
