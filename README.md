# Knowledge

私有、阅读优先的个人知识系统。当前仓库包含 Batch A–C，以及数据库用户、会话和 Local Agent 凭据改造；T35 的浏览器验收仍待完成。

## 本地启动

```bash
cp .env.example .env.local
npm install
```

在 `.env.local` 中配置 `DATABASE_URL`，然后迁移数据库并创建第一个用户：

```bash
npm run dev
```

如果要使用数据库：

```bash
# 首次启动本地 PostgreSQL 16 容器
docker run --detach --name knowledge-system-postgres \
  --env POSTGRES_PASSWORD=postgres \
  --env POSTGRES_DB=knowledge_system \
  --publish 55432:5432 \
  postgres:16-alpine

# 后续启动已存在的容器使用：docker start knowledge-system-postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run user:create -- --username xuqing
```

## 创建用户

完成数据库迁移后，使用用户管理命令创建第一个登录用户。命令会交互式提示输入密码，密码不会出现在命令行参数中：

```bash
npm run user:create -- --username xuqing
```

该命令会在同一次执行中交互式提示输入密码，输入完成后即可创建用户，不需要再单独设置密码。密码不会出现在命令行参数、Shell 历史或进程列表中。

可选地同时设置邮箱和显示名称：

```bash
npm run user:create -- --username xuqing --email you@example.com --display-name "Your Name"
```

用户名必须为 3 至 80 个字符，并会按系统规则规范化。若需要修改已有用户的密码，可运行：

```bash
npm run user:set-password -- --username xuqing
```

`user:set-password` 仅用于修改已有用户的密码，不是创建用户流程的第二步。

执行前请确认 `.env.local` 中的 `DATABASE_URL` 指向已完成迁移的 PostgreSQL 数据库。

只有修改 `db/schema.ts` 后才运行 `npm run db:generate`。要运行真实 PostgreSQL 集成测试，请在当前 shell 设置 `DATABASE_URL` 后执行 `npm test`。

默认数据库地址是 `127.0.0.1:55432`，与上面的 Docker 映射一致。`db:seed` 只检查数据库连接和活动用户数量，不会覆盖用户数据。登录应用后，`GET /api/db/health` 会执行一次真实数据库连接检查。

停止数据库：

```bash
docker stop knowledge-system-postgres
```

`DATABASE_URL` 只在服务端使用，不要添加 `NEXT_PUBLIC_` 前缀，也不要提交 `.env.local`。密码以 scrypt hash 保存于数据库，浏览器使用 30 天 HttpOnly opaque session；同一用户可在多个设备同时登录，退出只撤销当前设备的 session。Local Agent token 在 `/settings/local-agent` 创建并按用户单独撤销。

## 验证

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 当前路由

认证后可以访问 `/home`、`/inbox`、`/library`、`/notes`、`/graph` 和 `/search`。Batch C 已加入耐久 Markdown 笔记、标签、CodeMirror 编辑器和本地草稿保护；`/home`、`/graph`、`/search` 仍是占位入口，后续批次才会加入 wikilinks、图谱、搜索及其余产品功能。
