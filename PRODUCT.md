# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

个人知识系统的主要用户是在桌面、平板和手机浏览器之间切换的个人阅读者。

## Product Purpose

Knowledge 是一个阅读优先的个人知识空间，用于保存 Sources、Highlights、QuickNotes 和 Markdown Notes，并在 Inbox 中继续整理。成功标准是用户能快速捕捉、安静地阅读和编辑自己的知识，而不会丢失原始内容。

## Positioning

Web 应用是知识数据的唯一 canonical writer；本地 CLI 只能通过 authenticated pull/push API 提交经过验证的建议，不能直接修改生产知识。

## Operating Context

用户可能在桌面阅读器、浏览器、平板分屏或手机浏览器中使用应用。Capture、Inbox、Markdown 编辑器、Search、Graph、Export 和 Local Agent 是现有工作流的一部分。

## Capabilities and Constraints

- 现有应用使用 Next.js、React、TypeScript、Tailwind 和 PostgreSQL。
- 浏览器认证使用数据库用户、scrypt 密码哈希和服务端 opaque sessions。
- 多设备 session、用户归属、Markdown canonical content、autosave 和 Local Agent 必须保持不变。
- 支持 `zh-CN` 与 `en`，不添加 URL locale 前缀。
- 只翻译应用拥有的 UI 文案，不翻译用户知识、Markdown、标签、来源标题或建议正文。
- 本批次不新增产品业务功能或数据库迁移。

## Brand Commitments

- 产品名称：Knowledge。
- 用户指定 Quiet Editorial 作为本批次视觉方向：minimal、spacious、calm、editorial、premium、readable、restrained motion、content-first。
- 避免蓝紫渐变、玻璃拟态、霓虹 AI 风格、过度阴影、巨型圆角卡片和装饰性 dashboard。

## Evidence on Hand

- 现有路线和组件位于 `app/` 与 `components/`。
- 现有领域服务、API、测试和 PostgreSQL 数据库已完成 MVP 功能。
- 本批次需要真实浏览器 viewport 验收；此前 T35 浏览器视觉验收尚未通过。

## Editorial Workspace reference principles

This section records design principles extracted from public reference
projects, not copied implementation or branding:

- Memoa / Uotion: use a clear workspace hierarchy and let the content page be
  the primary surface; avoid stacking a page inside multiple card shells.
- Novel: make the editor recede behind writing, with quiet typography and
  restrained editing chrome.
- Omnivore: treat Inbox as reading material; let excerpt and annotation lead,
  while metadata and actions remain secondary.
- Lokus: keep navigation, Markdown editing, and knowledge browsing inside one
  coherent workspace language.

The Editorial Workspace upgrade applies these principles through purpose-built
page widths, compact rows, inline read-only properties, light separators, and
one restrained accent while preserving the existing Quiet Editorial product
truth, domain behavior, and locale architecture.

## UI Layout Architecture Reset

The application now converges on four conceptual layout types: a shared
workspace list layout for Home, Inbox, Library, Notes, and Search; a structured
content-detail layout for Source and Settings detail; a writing layout for Note
editing; and a full canvas layout for Graph. All four share the same shell
left edge, header hierarchy, spacing rhythm, action placement, and responsive
principles. Dedicated Capture remains a focused task surface inside the
workspace geometry rather than becoming a fifth general page architecture.

## Product Principles

- Capture quickly, organize later.
- Markdown content remains exact and portable.
- The Web application owns confirmed knowledge mutations.
- UI should recede behind reading and writing.

## Accessibility & Inclusion

- 支持键盘导航、focus-visible、表单 label、ARIA 状态和无 hover 依赖的关键操作。
- 支持 `prefers-reduced-motion`。
- UI 需在 1440、1280、1024、768 和 430px 宽度下无水平溢出。
