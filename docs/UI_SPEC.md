# UI_SPEC.md

## Purpose

This document defines the interaction and interface requirements for the AI-native personal reading and knowledge system.

Primary references:

```text
AGENTS.md
docs/DEVELOPMENT_SPEC.md
IMPLEMENTATION_PLAN.md
DATA_MODEL.md
```

This document is authoritative for:

- page structure
- navigation
- responsive behavior
- desktop vs tablet differences
- interaction flows
- component states
- graph behavior
- editor behavior
- Inbox review UI
- AI suggestion presentation

---

# 1. UX Principle

The product has two distinct modes.

## Tablet

```text
capture-oriented
reading-adjacent
minimal interruption
```

## Desktop

```text
processing-oriented
editing
search
graph exploration
review
```

Do not force identical layouts across both modes.

---

# 2. Visual Direction

Use a quiet, content-first visual language.

Prefer:

- strong typography
- generous whitespace
- subtle borders
- restrained shadows
- neutral surfaces
- compact controls
- consistent rhythm

Avoid:

- dashboard card walls
- excessive gradients
- gamification
- bright decorative charts
- enterprise admin UI
- social-media-style feeds

---

# 3. Primary Navigation

Desktop:

```text
Home
Inbox
Library
Notes
Graph
Search
```

Tablet bottom navigation:

```text
Home
Inbox
Search
Graph
```

Notes and Library may be accessed through Home or a compact menu on tablet.

---

# 4. Desktop App Shell

```text
┌──────────────┬─────────────────────────────┬─────────────────────┐
│ Sidebar      │ Main                        │ Context Panel       │
│              │                             │                     │
│ Home         │                             │ Backlinks           │
│ Inbox        │                             │ Related Notes       │
│ Library      │                             │ Local Graph         │
│ Notes        │                             │ AI Suggestions      │
│ Graph        │                             │                     │
│ Search       │                             │                     │
└──────────────┴─────────────────────────────┴─────────────────────┘
```

Rules:

- context panel is contextual
- user can collapse side panels
- main content has visual priority
- editor page maximizes writing area

---

# 5. Tablet App Shell

```text
┌───────────────────────────────┐
│ Header                        │
├───────────────────────────────┤
│                               │
│ Main content                  │
│                               │
├───────────────────────────────┤
│ Home  Inbox  Search  Graph    │
└───────────────────────────────┘
```

At narrow split-screen width:

- hide secondary metadata
- avoid dense tables
- use sheets/drawers for context
- keep primary save action visible

---

# 6. Home Page

## Desktop

Purpose:

- resume recent activity
- recent Sources
- recent Notes
- small number of meaningful Inbox/AI items

Suggested sections:

```text
Recent Reading
Recent Notes
Inbox Summary
Recent Connections
```

Do not show excessive analytics.

## Tablet

```text
+ Quick Capture

Today
- Highlights
- Quick notes
- Pending Inbox

Recent Reading
Recent Notes
```

Primary CTA:

```text
Quick Capture
```

---

# 7. Inbox Page

Combines:

- unprocessed Highlights
- unprocessed QuickNotes
- pending AI suggestions

## Desktop

```text
┌───────────────┬──────────────────────────────┐
│ Inbox list    │ Review detail               │
│               │                              │
│ Highlight     │ source/content/actions      │
│ QuickNote     │                              │
│ AI Proposal   │                              │
└───────────────┴──────────────────────────────┘
```

Filters:

```text
All
Highlights
Quick Notes
AI Suggestions
```

## Highlight Card

Show:

```text
Source title
excerpt
personal comment
created time
status
```

Actions:

```text
Open
Create Note
Archive
```

## AI Durable Note Proposal

Show:

```text
Proposed title
Source evidence count
Draft Markdown preview
Suggested tags
Suggested related Notes
```

Actions:

```text
Accept
Edit
Ignore
Merge into existing Note
```

Source items remain intact.

---

# 8. Quick Capture

Critical tablet feature.

## Fields

Required:

```text
Content
```

Optional:

```text
Source
Personal thought
```

Do not require:

```text
folder
tag
relation
durable Note title
```

## Narrow Layout

```text
┌─────────────────────────┐
│ Quick Capture           │
├─────────────────────────┤
│ Source (optional)       │
│ [select]                │
│                         │
│ Highlight / note        │
│ [textarea]              │
│                         │
│ Personal thought        │
│ [textarea]              │
│                         │
│          [Save]         │
└─────────────────────────┘
```

## Save Behavior

After save:

- concise success feedback
- clear/reset form appropriately
- return focus to content
- avoid unnecessary navigation

Goal:

```text
capture
→ save
→ continue reading
```

---

# 9. Library Page

Browse Sources.

Desktop fields:

```text
title
publication
source type
published date
highlight count
```

Filters:

```text
source type
publication
date
```

Tablet:

single-column list.

Avoid cover-heavy layouts.

---

# 10. Source Detail Page

Show:

```text
title
publication / author / issue
URL/file metadata
highlights
personal comments
derived Notes
```

Actions:

```text
Add Highlight
Edit Source
Archive Source
```

Integrated PDF Reader is later phase.

---

# 11. Notes List

Desktop:

- title
- tags
- updated time
- short excerpt

Support:

```text
sort by updated
filter by tag
search title
```

Tablet:

simple vertical list.

---

# 12. Note Detail / Editor

Core durable-knowledge screen.

## Desktop

```text
┌──────────────┬─────────────────────────────┬──────────────────────┐
│ Note list    │ Editor / Preview            │ Context              │
│              │                             │ Backlinks            │
│              │                             │ Related Notes        │
│              │                             │ Local Graph          │
└──────────────┴─────────────────────────────┴──────────────────────┘
```

Panels may collapse.

## Header

Show:

```text
title
save state
tags
more menu
```

## Save State

```text
Saved
Saving...
Offline changes
Save failed
```

## Editor

Required:

- Markdown
- keyboard navigation
- `[[wikilink]]` autocomplete
- tag autocomplete
- paste image
- undo/redo
- autosave
- touch support

Optional mode:

```text
Edit
Preview
```

Mode switching must preserve Markdown.

---

# 13. Wikilink Autocomplete UI

Typing `[[` opens:

```text
消费趋势
消费降级
消费者信心
```

Interaction:

- arrows move
- Enter selects
- Escape closes
- touch selects
- "Create new note" when needed

Never auto-create missing Notes without explicit action.

---

# 14. Backlinks Panel

Confirmed incoming relations:

```text
Backlinks

年轻人消费结构变化
日本低欲望社会
房地产与消费
```

Each item:

- title
- optional context excerpt
- navigation

Separate:

```text
Suggested Related Notes
```

AI suggestions never appear as confirmed Backlinks.

---

# 15. Local Graph

Default:

```text
depth = 1
```

Optional:

```text
depth = 2
```

Controls:

```text
Depth
Confirmed only
Include suggestions
```

Interaction:

- current Note identifiable
- pan
- zoom
- select node
- click → open Note
- hover/tap preview

---

# 16. Global Graph

Dedicated page.

```text
┌─────────────────────────────────────────────┐
│ Filters                                     │
├─────────────────────────────────────────────┤
│                                             │
│                 Graph                       │
│                                             │
└─────────────────────────────────────────────┘
```

Filters:

```text
tag
relation type
confirmed/suggested
```

Suggested:

```text
dashed
```

Confirmed:

```text
solid
```

Rejected hidden.

Do not send full Note bodies to graph UI.

---

# 17. Search UI

## Command Search

Desktop:

```text
Ctrl/Cmd + K
```

Use for title/navigation search.

## Search Page

Input:

```text
Search your knowledge
```

Types:

```text
Notes
Sources
Highlights
```

Phase 2 modes:

```text
Keyword
Semantic
Hybrid
```

Do not show technical vector scores by default.

---

# 18. AI Suggested Relations UI

Example:

```text
Possible relation

日本低欲望社会
87% confidence

Why:
- income expectations
- savings preference
- housing burden
- consumption structure

[Confirm] [Ignore] [Reject]
```

Rules:

- confidence secondary
- reason primary
- confirmation explicit
- rejection persists

---

# 19. Ask Knowledge UI (Future / Local Codex Workflow)

Phase 2+.

Input:

```text
最近我关于房地产和消费之间记录了哪些观点？
```

Answer:

```text
Summary
Key points
Sources
```

Material claims link to internal corpus items.

If evidence weak:

```text
目前你的知识库里没有足够资料支持明确结论。
```

---

# 20. Empty States

## Home

```text
还没有阅读记录。
从快速记录一条想法开始。
```

## Inbox

```text
今天没有待整理内容。
继续阅读或快速记录一条想法。
```

## Notes

```text
还没有知识笔记。
你可以新建一篇，或从 Inbox 中整理生成。
```

## Graph

```text
创建至少两篇相互关联的笔记后，这里会显示知识关系。
```

## Search

```text
输入关键词搜索你的知识库。
```

---

# 21. Error States

Prefer human-readable messages.

For save failure:

```text
保存失败。你的内容仍保留在本地草稿中，请重试。
```

For AI:

```text
AI 整理暂时失败，原始笔记没有受到影响。
```

---

# 22. Loading States

- use skeletons for lists/details
- avoid full-screen spinners for small loads
- editor typing must not wait for context panel
- graph may use dedicated loading state

---

# 23. Destructive Actions

Archive:

- reversible
- easy

Permanent Delete:

- separate
- confirmation required
- not prominent

Do not overuse destructive styling.

---

# 24. Keyboard Shortcuts

Recommended:

```text
Ctrl/Cmd + K   Search
Ctrl/Cmd + N   New Note
Ctrl/Cmd + S   Force save
Esc            Close modal/popover
```

Optional later:

```text
Ctrl/Cmd + Shift + N Quick Capture
```

---

# 25. Responsive Behavior

Behavior matters more than exact breakpoints.

## Wide Desktop

Three-column capable.

## Medium

Context panel collapses by default.

## Tablet

Single-column + bottom nav.

## Narrow Tablet Split-Screen

Must preserve:

```text
Quick Capture
Inbox list
Search
basic Note reading/editing
```

No hover dependency.

---

# 26. PWA UX

When installed:

- app icon
- standalone display
- stable navigation
- no browser chrome dependency
- safe session behavior

Do not aggressively cache private dynamic content.

Full offline editing is not MVP.

---

# 27. Accessibility

Minimum:

- semantic headings
- keyboard navigation
- visible focus
- sufficient contrast
- adequate touch targets
- form labels
- non-graph navigation alternatives

Backlinks list is required even if Graph exists.

---

# 28. Component Inventory

Recommended:

```text
AppShell
DesktopSidebar
TabletBottomNav
ContextPanel
QuickCaptureForm
SourcePicker
HighlightCard
QuickNoteCard
NoteListItem
MarkdownEditor
MarkdownPreview
WikilinkAutocomplete
TagInput
BacklinksList
RelatedNotesList
LocalGraph
GlobalGraph
SearchInput
SearchResultItem
AISuggestionCard
RelationSuggestionCard
SaveStateIndicator
EmptyState
ErrorState
ConfirmDialog
```

Do not over-abstract before patterns repeat.

---

# 29. Page Map

```text
/home
/inbox
/library
/library/[sourceId]
/notes
/notes/[noteId]
/graph
/search
/settings/export
```

Potential later:

```text
/ask
```

---

# 30. Core Interaction Acceptance

## Quick Capture

- touch-friendly
- minimal fields
- clear success
- no forced organization

## Note Editing

- Markdown preserved
- autosave visible
- wikilinks usable
- context panels non-blocking

## Graph

- navigation useful
- suggested vs confirmed clear

## Inbox

- raw evidence preserved
- AI review explicit
- user controls promotion to durable knowledge

## Search

- fast
- typed results
- navigable

---

# 31. UI Decisions Already Made

1. Desktop and tablet are intentionally different.
2. Tablet capture > tablet administration.
3. Graph has local and global modes.
4. Backlinks remain a list UI.
5. AI suggestions are visually separate.
6. Quick Capture does not require taxonomy.
7. Markdown editor is central.
8. Source and Note are separate in UI.
9. The app should feel calm, not enterprise SaaS.
10. PWA is a shell improvement, not an excuse to overbuild offline behavior.

---

End of UI_SPEC.md
