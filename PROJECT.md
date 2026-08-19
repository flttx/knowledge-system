# Knowledge 项目规范

本文件是项目级工程规范。它与 AGENTS.md、PRODUCT.md 和 DESIGN.md 共同构成开发约束：

- AGENTS.md：代理行为、边界和安全硬约束。
- PRODUCT.md：产品事实、用户、能力与不可改变的产品原则。
- DESIGN.md：UI token、布局、组件状态和视觉验收规则。
- PROJECT.md：代码组织、数据边界、验证流程和交付标准。

规范冲突时，优先级为用户最新明确要求、AGENTS.md 的硬约束、PRODUCT.md
的产品事实、PROJECT.md 的工程规则、DESIGN.md 的视觉规则，最后才是
docs/ 下的补充规格。docs/UI_SPEC.md 与 docs/Development_Spec.md 保留为
产品和页面的详细背景，不替代根目录规范。

## 1. 项目定位与架构边界

Knowledge 是阅读优先的个人知识系统。Web 应用是唯一的 canonical writer，
负责认证、授权、校验、持久化、审核和已确认知识变更。

### 必须保持

- Next.js App Router、React、TypeScript、Tailwind、Drizzle/PostgreSQL 的现有技术栈。
- zh-CN 与 en 两种 UI locale，不增加 URL locale 前缀。
- Markdown canonical content、autosave、wikilink、标签、关系状态和多设备 session 语义。
- 所有持久化操作都必须经过服务端认证、用户归属校验和输入验证。

### 明确禁止

- Web 请求处理器、Route Handler、Server Action 或 Vercel 运行时调用 OpenAI API。
- 在服务端或客户端调用 Codex CLI。
- 绕过 API/服务层直接写数据库或由客户端决定 owner/user ID。
- Local Agent 直接修改生产知识、创建 confirmed relation、删除 pulled source data 或静默合并 Notes。
- 将密钥、密码、session 原文 token 或 Local Agent token 写入代码、日志、cookie 或仓库。

## 2. 目录与职责

- app/：页面、布局、Route Handler；页面组合 UI，不承载领域规则。
- components/：可复用 UI 与页面交互；不直接拼 SQL。
- lib/services/：领域服务、权限边界、事务和业务校验。
- lib/db/、db/：数据库连接、schema 和 migration 相关代码。
- lib/i18n/：locale、字典和翻译函数；UI 文案只从这里读取。
- tests/：服务、API 契约和关键交互的自动化验证。
- public/：静态资源；不放私密数据。
- .local-knowledge/：本地私有工作区，必须保持 gitignored。
- docs/：部署、运行和长期维护文档。
- PROJECT.md、PRODUCT.md、DESIGN.md、PROGRESS.md：项目决策与状态记录。

## 3. TypeScript 与 React 规范

- 开启 strict；禁止 any，未知外部数据使用 unknown 加类型守卫或 schema。
- 类型导入使用 import type。
- 优先使用 interface；联合类型、映射类型等必要场景才使用 type。
- 组件 props 保持最小；重复出现且具有稳定语义的 UI 才抽成共享 primitive。
- Client Component 只在需要 state、effect、事件或浏览器 API 时使用。
- API/Promise 必须有 try/catch 或可观测的错误处理；catch 不能留空。
- 用户可见错误使用稳定、可理解的文案，不直接暴露原始异常、SQL 或 stack trace。
- 不使用 dangerouslySetInnerHTML，除非内容来源和安全策略已明确批准。

## 4. UI 实现规范

- 新页面先选择 DESIGN.md 中的四类布局之一，不自行创建第五类。
- 复用 components/ui/workspace.tsx 的共享原语和 app/globals.css token。
- 先处理信息层级、空状态、加载态、错误态和窄屏，再处理装饰。
- 交互控件必须有可见 focus-visible；表单控件必须有 label 或等效 aria-label。
- 异步动作提供 aria-busy、禁用重复提交和稳定错误提示。
- Modal/Dialog 打开时聚焦内部首个可交互元素，关闭后恢复触发元素焦点。
- 不以 hover 作为唯一操作入口；触屏和键盘必须可完成关键流程。
- 不把用户 Markdown、来源标题、标签、建议正文当作 UI 翻译文案。
- 新增 UI 同时补齐 zh-CN/en key，保持字典 key 集合一致。
- 页面级主操作放在 header 右侧；列表行操作放在行右侧；编辑默认按需进入。

## 5. 数据与安全规范

- API 输入必须在服务端重新验证，Local Agent 建议文件视为不可信输入。
- 所有查询和 mutation 都必须按当前认证用户做 ownership scope。
- SQL 使用参数化查询/Drizzle API，不拼接用户输入。
- Session、密码和 token 只保存哈希或不可逆派生值；cookie 使用 HttpOnly、SameSite 和合适的 Secure 设置。
- 错误响应稳定化；生产响应不得返回 SQL、堆栈或内部路径。
- 新依赖必须先检查许可证、维护状态和已知漏洞。
- 数据库 schema 变更必须通过 migration，禁止直接改生产库结构。
- 任何导出、pull、push、archive、relation 操作都必须明确状态语义并可测试。

## 6. 验证与质量门槛

### 日常修改

至少运行：

    npm run typecheck
    npm run lint

### 功能、路由或共享组件修改

运行：

    npm run typecheck
    npm run lint
    npm test
    npm run build
    git diff --check

如涉及 schema，再运行：

    npm run db:generate
    npm run db:migrate

### UI 修改额外门槛

- 运行 Impeccable detector，检查结果必须处理或明确记录。
- 有可用浏览器时，验证 1440、1280、1024、768、600、480、430px。
- 至少覆盖 zh-CN/en、加载/空/错误/成功、键盘焦点和无水平溢出。
- 浏览器不可用时必须在 PROGRESS.md 记录，不能把 HTTP smoke test 说成视觉验收。

### 完成定义

- 需求范围内的代码和文档完成。
- 没有未处理的 typecheck/lint/test/build 错误。
- 没有新增 schema 变更或安全回归未说明。
- PROGRESS.md 已记录实际验证结果、限制和后续门槛。
- 不声明未实际完成的浏览器或生产验收。

## 7. Git 与交付

- 分支：feat/<description>、fix/<description>、refactor/<description>。
- Commit：<type>(<scope>): <description>，type 使用 feat/fix/refactor/style/chore/docs/i18n。
- 提交前检查 working tree，保留用户已有改动，不使用 destructive reset/checkout。
- PR 必须说明变更范围、影响、验证命令和已知限制。
- 文档类变更优先使用 docs 类型 commit。

## 8. 变更流程

1. 先读 AGENTS.md、PRODUCT.md、DESIGN.md、PROJECT.md 和相关模块上下文。
2. 判断任务是 UI、领域逻辑、数据、安全、文档或组合任务。
3. 先记录假设、风险和验收标准，再修改最小范围。
4. 修改后运行对应验证；跨 3 个以上独立模块时补充多视角审查。
5. 更新 PROGRESS.md，报告事实、证据和未验证项。

## 9. 规范变更规则

- 修改架构、安全、数据语义或 UI token 前，必须同步更新对应规范文档。
- 规范与实现冲突时，以当前已验证代码和用户最新明确要求为准，并记录迁移说明。
- 新增规则必须说明适用范围、违反风险和验证方式。
- 不为尚未出现的重复或未来需求增加抽象规则。
