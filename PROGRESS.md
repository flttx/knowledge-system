# UI 重构进度记录 (Progress)

## 状态总览
- 任务启动：2026-08-21
- 当前阶段：Phase 1 执行中

## 详细进展

- [x] **规划阶段 (Planning)**: 完成全站 10 个核心视图的浏览器走查与视觉缺陷诊断，输出诊断报告。
- [ ] **Phase 1: 严重排版与渲染 Bug 修复**
  - [ ] Markdown 编辑器工具栏修复
  - [ ] 笔记摘要纯文本清洗过滤
  - [ ] 图谱节点排版与文字重构
  - [ ] 来源占位破折号逻辑优化
- [ ] **Phase 2: 视觉层级与容器卡片化**
  - [ ] 侧边栏及 AppShell 层次重构
  - [ ] 全局 Surface 卡片化与圆角阴影
  - [ ] 首页 Dashboard 卡片重构
  - [ ] 归档与危险色语义修复
- [ ] **Phase 3: 控件规范化与交互打磨**
  - [ ] 捕获页 Segmented Control
  - [ ] Header 对齐基准线与标签输入框内边距
  - [ ] 设置页与 LocaleSwitcher 规范化
  - [ ] 自动化测试与端到端验收

## 2026-08-24 公共品牌页版式整理

### 本次调整范围

- 仅调整公共 `/` 品牌页的内容容器、Section 边界、标题宽度和垂直节奏。
- 保留暗色巨构建筑背景、金色点缀、卡片风格、交互 Demo 和现有文案方向。
- 未修改认证逻辑、私有路由、数据结构或业务交互。

### 已完成内容

- Header、Hero、Footer 统一使用公共品牌页 Container。
- Feature 卡片区域收窄，Demo 与 Bento 使用同一宽度层级。
- Section 标题区统一为窄内容布局，避免标题随下方模块变宽。
- Hero 内部改为 12 栏等效布局，文案宽度控制在约 620px。
- 删除当前品牌页中重复的局部 `max-w-*` 作为主要版式基准。

### 布局规则与 Token

- 默认 Container：`max-width: 1280px`，桌面内边距 `32px`。
- 宽内容 Container：`max-width: 1264px`，内容宽约 `1200px`，用于 Demo 与 Bento。
- Feature Container：`max-width: 1224px`，内容宽约 `1160px`。
- Section Heading：最大宽度 `760px`，居中对齐。
- Section 垂直间距：`clamp(96px, 10vw, 144px)`。
- Tablet 内边距：`24px`；窄屏内边距：`16px`。

### 响应式处理

- Feature 在桌面保持四列，Tablet 自动变为两列，移动端单列。
- Demo 与 Bento 在窄屏自然收缩为容器宽度，保留内部单列布局。
- 所有公共品牌页容器共享相同左右内边距，避免横向边界跳动。

### 实际验证结果

- `npm run typecheck`：通过。
- `npm run lint`：通过。
- `npm test`：19 通过，30 个数据库依赖测试跳过，0 失败。
- `npm run build`：通过。
- `npm run db:generate`：通过，无 Schema 变更。
- `git diff --check`：通过。
- Impeccable layout detector：无布局告警。

### 尚存问题

- 当前环境没有可用的浏览器会话，尚未完成 1440px、1920px、Tablet 和 Mobile 的真实截图验收。
- 需要在真实浏览器中进一步确认背景图焦点、Hero 空间比例和长文案换行。

### 下一步建议

- 使用真实浏览器完成 1440px、1920px、1024px、768px、430px 截图对照。
- 若截图仍有视觉跳动，只对具体 Section 做光学微调，不再新增独立宽度体系。

## 2026-08-24 Screenshot Capture 截图摘录

### 已完成

- Screenshot Capture 数据模型：新增 `screenshots`，支持 `attachmentId`、Source、Note、page、location、annotation、Inbox status、归档与恢复，并预留 `extractedText`。
- API：新增截图创建、查询、更新、归档、恢复接口；所有 Screenshot、Source、Note、Attachment 关联均按当前 `userId` 校验。
- Attachment 复用方式：使用现有 `attachments` 表，图片存储改为 Vercel Blob Private Storage，`storageKey` 保存 Blob pathname；通过鉴权 API 读取原图，不暴露公开 URL。
- UI：Quick Capture 新增“截图摘录”，支持图片选择、拖入、桌面 Ctrl+V 粘贴、预览、Source、页码、位置和注释。
- Inbox：截图以独立 Capture 类型展示，使用比例缩略图，可打开原图、编辑元数据、选择 Source/Note、归档。
- 搜索：支持按 Source、annotation、page、location 搜索截图。
- 测试：补充截图创建、Source/Attachment/Note 跨用户隔离、非图片附件拒绝、Inbox、更新、归档与恢复行为测试。

### 未实现与后续建议

- OCR、图片文字搜索、AI 图片理解、图片编辑和自动生成 Note 尚未实现；原始截图仍是 canonical evidence。
- 目前 Inbox 编辑界面加载前 100 个 Source/Note 供选择，后续可复用现有搜索能力改善大规模知识库的整理体验。
- 部署前需在 Vercel 创建 Private Blob Store，并配置 `BLOB_READ_WRITE_TOKEN`；同时执行 `npm run db:migrate`。
