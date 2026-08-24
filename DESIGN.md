---
name: Knowledge Design System
description: A three-tier architectural design system bridging monumental brand aesthetics, tranquil portal transition, and a quiet, content-first editorial workspace.
colors:
  background: "#f7f4ed"
  surface: "#fdfcf9"
  surface-muted: "#eeebe3"
  ink: "#1c1b18"
  ink-soft: "#3e3d39"
  ink-muted: "#78756d"
  ink-faint: "#a8a59d"
  line: "#e2ded5"
  line-strong: "#cdc8bd"
  accent: "#b88e3e"
  accent-strong: "#94712e"
  accent-soft: "#f4eedf"
  focus-ring: "#c9a85d"
  danger: "#b33939"
  danger-soft: "#fbf0f0"
  success: "#356b4f"
  success-soft: "#eaf3ee"
  warning: "#a36816"
  warning-soft: "#fcf4e8"
typography:
  display:
    fontFamily: "Avenir Next, PingFang SC, Microsoft YaHei, system sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.375rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.045em"
  serif-headline:
    fontFamily: "Georgia, Cambria, 'Times New Roman', Times, serif"
    fontSize: "clamp(1.75rem, 3vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Avenir Next, PingFang SC, Microsoft YaHei, system sans-serif"
    fontSize: "clamp(1.75rem, 3vw, 2rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Avenir Next, PingFang SC, Microsoft YaHei, system sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Avenir Next, PingFang SC, Microsoft YaHei, system sans-serif"
    fontSize: "12px"
    fontWeight: 550
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "20px"
  dialog: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "36px"
---

# Knowledge Design System: Three-Tier Architecture

## 1. 核心架构：三层渐进空间关系 (Three-Tier Progressive Hierarchy)

Knowledge 严禁出现“全站同一张大图”或“登录后突兀断层”的设计。整站遵循严密的**三层渐进空间定位**：

```
┌─────────────────────────────────────────────────────────────┐
│  Tier 1: 品牌首页 (Brand / Landing - `/`)                   │
│  · 角色：表达崇高气质、品牌精神与心智护城河                   │
│  · 视觉：深墨玄武岩底色、野兽派知识巨构背景、白金/琥珀微光       │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Tier 2: 登录门户 (Gateway / Login - `/login`)               │
│  · 角色：品牌与产品之间的收敛与物理过渡桥梁                   │
│  · 视觉：左侧深墨品牌叙事，右侧暖纸色实体面板，平滑进入书房    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Tier 3: 工作台内页 (Workspace - `/home`, `/notes`, ...)     │
│  · 角色：安静、清晰、高效的个人书斋与网状思考写字台           │
│  · 视觉：纯净暖纸色（Paper & Ink）、极细墨线、工具彻底透明化   │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 品牌标记与色彩系统 (Brand Mark & Color Tokens)

### 2.1 统一的 Brand Mark (K 徽标)
全站统一采用**深黑墨底、白金/琥珀细边框、经典衬线字母 `K`**，禁止使用任何杂乱的红色方块或不一致的 Logo：
```tsx
<span className="flex size-7 items-center justify-center rounded-md border border-[#c9a85d]/50 bg-[#1c1b18] text-xs font-serif font-bold text-[#f3e3be] shadow-xs select-none">
  K
</span>
```

### 2.2 暖金沙与石墨色系 (Warm Antique Gold Palette)
* **主点缀色 (`--accent`)**: `#b88e3e`（暖金琥珀）
* **次级强调色 (`--accent-strong`)**: `#94712e`
* **柔和底色 (`--accent-soft`)**: `#f4eedf`（暖纸金沙色，替代任何粉红/杂色）
* **焦点环 (`--focus-ring`)**: `#c9a85d`
* **纸张主底色 (`--background`)**: `#f7f4ed`（浅纸白，舒适护眼，长文优先）
* **纸张卡片表面 (`--surface`)**: `#fdfcf9`

---

## 3. 全局动效系统 (Motion & Micro-interactions)

### 3.1 页面级圆形日食涟漪主题切换 (Celestial Circular Ripple Transition)
* **单一入口原则**：桌面端仅在右上角 Topbar 保留唯一的切换入口；
* **天体星轨翻转**：太阳（晨曦暖金日光）与月牙（夜幕星芒）在点击时进行 180° 旋转弹性缩放；
* **750ms 慢节奏全屏波纹**：基于 View Transitions API，以点击坐标为圆心向全屏扩散圆形遮罩，配合缓动曲线 `cubic-bezier(0.22, 1, 0.36, 1)`。

### 3.2 侧边栏 3D 几何拓扑微视窗 (Sidebar Monolith Widget)
* 位于侧边栏导航下方空白区域，Canvas 实时渲染金色八面体线框在零重力下优雅旋转；
* 伴随呼吸光晕、微星尘与交互式点击脉动共振反馈（`✦ 脉动 ×N`），为桌面端侧边栏注入科技生命力。

---

## 4. 内页组件设计规范 (Workspace Component Specifications)

### 4.1 列表页体系 (List Pages: `/notes`, `/library`, `/inbox`)
* **集成式操作控制栏 (Integrated Action Strip)**：
  - 整合搜索框（带微图标与清除）、标签联想过滤框、归档状态切换与主要新建 CTA，形成单行沉浸式控制面板。
* **纸张微浮雕卡片流 (Paper Index Cards)**：
  - 放弃扁平生硬的细线表格，升级为 `rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]` 实体纸张卡片；
  - 标题采用优雅字体排版，悬停呈现暖金高光与左侧微光游标；
  - 摘要自动过滤换行噪点，展现 2 行舒缓排版；
  - 底部提供紧凑的标签胶囊与时间戳。

### 4.2 来源详情页 (Source Detail: `/sources/[id]`)
* **文献档案矩阵 (Metadata Dossier Card)**：
  - 采用多列网格卡片排列出版机构、著者、期号、出版时间与带箭头的外链跳转；
* **文献摘录卡片流 (Excerpt Cascade Flow)**：
  - 每条关联高亮升级为纸张摘录卡片，带左侧暖金垂直引言色带、`font-serif` 经典正文排版与独立批注徽框。

### 4.3 笔记详情与编辑器 (Note Detail: `/notes/[id]`)
* **古典编辑大标题 (Classical Editorial Headline)**：
  - 标题采用无框沉浸式的 `font-serif text-3xl sm:text-4xl`，自然融入纸张表面；
  - 顶部状态栏配备微光脉冲胶囊（`● 已保存` / `● 同步中`）；
* **极简行内标签栏 (Inline Metas Strip)**：
  - 单行胶囊标签输入 + 创建与更新时间戳；
* **精装纸张 Markdown 编辑器**：
  - 外壳采用圆角纸张实体卡片，顶部配备极细微米分割线与紧凑悬浮式排版控制栏；
  - 底部无缝集成双向链接拓扑图谱与反向链接面板（Backlinks）。

---

## 5. 准则底线：Do's & Don'ts

### Do:
- **坚守三层空间定位**：品牌页讲故事，登录页做收敛，内页做专注高效；
- **全站统一黑金 `K` Logo 徽标与暖金 Accent 配色**；
- **长文阅读与编辑第一**：内页保持白纸黑墨的高对比度与舒适排版；
- **遵循 View Transitions 与 Reduced Motion 标准**。

### Don't:
- **绝对禁止将品牌页的重型建筑背景、大图、粒子光效搬入内页工作台**；
- **禁止在同一视野出现重复的主题切换按钮**；
- **禁止使用未经规范定义的红色/粉色等破坏纸张调性的杂色**；
- **禁止在编辑器内使用粗暴的生硬表格或割裂的双层框体**。
