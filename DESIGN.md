---
name: Knowledge Editorial Workspace
description: A quiet, content-first workspace for capturing, reading, and connecting personal knowledge.
colors:
  background: "#f4f4f1"
  surface: "#fbfbf9"
  surface-muted: "#ecece7"
  ink: "#20201e"
  ink-soft: "#454542"
  ink-muted: "#777771"
  ink-faint: "#9b9b94"
  line: "#deded8"
  line-strong: "#c9c9c1"
  accent: "#5c6d91"
  accent-strong: "#455877"
  accent-soft: "#e6e9ef"
  danger: "#a44a45"
  danger-soft: "#f8e8e6"
  success: "#3f765c"
  success-soft: "#e5f0e8"
typography:
  display:
    fontFamily: "Avenir Next, PingFang SC, Microsoft YaHei, system sans-serif"
    fontSize: "clamp(2rem, 5vw, 2.375rem)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.045em"
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
  sm: "6px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  section: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "8px 14px"
    height: "36px"
---

# Design System: Knowledge Editorial Workspace

## Overview

**Creative North Star: "The Editorial Desk"**

Knowledge should feel like a calm desk where reading material is collected,
sorted, annotated, and returned to later. The interface is deliberately quiet:
content and writing carry the visual weight, while navigation, metadata, and
actions remain precise and secondary.

The system is an Operate + Read surface. It favors a shared left edge, clear
page geometry, thin separators, warm neutral surfaces, and one restrained
slate-blue accent. It does not become a decorative dashboard.

**Key Characteristics:**

- Content-first, editorial, readable, and restrained.
- Flat by default; separators and tonal contrast create hierarchy.
- Four layout types only: list, detail, writing, and canvas.
- Actions are predictable: page primary action at top-right, row actions at far right.
- Chinese and English share the same information architecture.

## Colors

The palette is warm-neutral with dark ink and a single muted slate-blue accent.
The frontmatter is the source of truth for token values.

### Primary

- **Muted Slate Blue** (accent): selection, links, focus indication, and confirmed attention.
- **Deep Slate Blue** (accent-strong): high-contrast accent text and active emphasis.

### Neutral

- **Warm Paper** (background): application background.
- **Soft Off-White** (surface): focused surfaces, rows, dialogs, and editor-adjacent content.
- **Muted Surface** (surface-muted): hover and secondary tonal state.
- **Ink** (ink): primary text and primary button fill.
- **Soft Ink** (ink-soft): secondary text and ghost actions.
- **Muted Ink** (ink-muted): descriptions, labels, and metadata.
- **Faint Ink** (ink-faint): low-priority metadata.
- **Line** and **Strong Line** (line / line-strong): separators, field borders, and structural boundaries.

### Status

- **Muted Danger** (danger / danger-soft): destructive actions and user-facing errors.
- **Quiet Success** (success / success-soft): confirmed completion and positive status.

**The One Accent Rule.** Use the accent for state, links, focus, and confirmed
attention; do not decorate every heading or button.

## Typography

**Display Font:** Avenir Next, with PingFang SC, Microsoft YaHei, and system sans fallbacks.

**Body Font:** The same local/system sans stack.

**Label/Mono Font:** SFMono-Regular and Consolas for Markdown/code content.

**Character:** Typography is quiet and useful rather than promotional. Chinese and
English share the same hierarchy even when glyph metrics differ.

### Hierarchy

- **Display:** weight 600, clamp 32–38px, line-height 1.15; Note title and writing identity.
- **Headline:** weight 600, clamp 28–32px, line-height 1.15; list/workspace page title.
- **Detail title:** weight 600, clamp 32–36px, line-height 1.15; source and settings detail.
- **Section title:** weight 650, 17–20px; grouped content.
- **Body:** weight 400, 15px, line-height 1.6; normal UI copy.
- **Metadata:** 12–13px; labels, status, source, time, and counts.
- **Editor:** 15.2px, line-height 1.75; Markdown/code content.

**The No-Slogan Heading Rule.** Page headings name the task or place. Use Home,
Inbox, Library, Notes, Graph, and Search; do not use a marketing promise as the
primary page heading.

## Layout

The shell owns a roughly 224px desktop sidebar. Main content starts at the same
left edge on every non-canvas page with 40px desktop padding, 24px tablet padding,
and 16px narrow-screen padding. Do not center pages in a way that creates route-to-route
left-edge drift.

### Four layout types

- **List:** max-width 1160px. Home, Inbox, Library, Notes list, and Search.
- **Detail:** max-width 960px. Source detail and Settings.
- **Writing:** max-width 760px. Note detail and editor.
- **Canvas:** remaining width. Graph uses the full available work area.

Capture is a focused task surface inside shared workspace geometry, not a fifth type.

### Responsive rules

- Below 640px, page headers stack and action groups wrap below the title.
- Rows may stack metadata and actions; horizontal overflow is not acceptable.
- Graph remains full-width and its controls stay reachable.
- Test at 1440, 1280, 1024, 768, 600, 480, and 430px widths.
- Preserve split-screen usability between 480px and 600px.

### Spacing rhythm

Use the existing 4/8 rhythm: 8px control gaps, 12px field gaps, 16px row
padding, 24px page/tablet padding, and 36px section separation.

## Elevation & Depth

The default system is flat. Thin borders, surface tone, whitespace, and content
measure establish depth. Shadows are structural only for temporary dialogs and
command overlays.

### Shadow Vocabulary

- **Dialog lift:** 0 16px 48px color-mix(in srgb, var(--ink) 16%, transparent).
- **No resting card shadow:** list rows, sections, properties, and editor surfaces
  do not use decorative shadows.

**The Flat-at-Rest Rule.** Prefer spacing, a separator, or a tonal surface before
adding a shadow.

## Shapes

Forms and buttons use compact, gently rounded corners: 6px for small controls,
8px for standard buttons and inputs, and 12px only for larger task surfaces.
Prefer top/bottom separators over enclosing every section in a rounded card.
Dialogs are rectangular editorial surfaces with a thin border.

Focus uses the accent border plus a 3px accent-soft ring. Error states retain the
same geometry and use danger color for text and border.

## Components

### Buttons

- Shape: compact 8px radius, minimum 36px height.
- Primary: ink background, white text, 14px horizontal padding.
- Secondary: surface background, strong-line border, ink text.
- Ghost: transparent background, soft ink text; hover uses muted surface.
- Hover and focus: subtle color transition and visible focus-visible ring.
- Placement: page primary at top-right; detail actions at top-right; row actions at far right.

### Inputs / Fields

- Style: surface background, 1px strong-line border, 8px radius, compact padding.
- Focus: accent border plus accent-soft ring.
- Error / disabled: danger text/border for errors; disabled controls keep geometry
  and reduce opacity without hiding status.
- Dialog behavior: focus the first field on open and restore trigger focus on close.

### Cards / Containers

- Use Surface for focused tasks and list group boundaries.
- Use rows and separators for repeated content.
- Use PropertyList and PropertyRow for read-only detail data.
- Use dashed separators and a direct next action for empty states.
- Avoid nested card grids, permanent creation islands, and large decorative panels.

### Navigation

- Desktop: approximately 224px sidebar with a clear active state.
- Mobile: existing mobile navigation with safe-area padding.
- Selection: accent-soft tone and readable ink; usable without hover.

### Dialogs

- role dialog, aria-modal true, Escape close, backdrop close, initial focus, and
  trigger focus restoration.
- Use for Add Source and New Note creation; do not use for ordinary reading content.

### Writing Surface

- Outer measure: 760px writing layout.
- Preserve CodeMirror, autosave, Markdown, and wikilink behavior.
- Keep toolbar and save state quiet; writing content receives visual priority.

## Do's and Don'ts

### Do:

- Do preserve the shared left edge and one of the four layout types.
- Do place primary actions in the page header.
- Do keep task-oriented copy short.
- Do preserve exact user Markdown, labels, source titles, and suggestion content.
- Do provide labels, focus-visible states, keyboard support, and busy/error states.
- Do validate both zh-CN and en at narrow and wide widths.

### Don't:

- Don't add a fifth general layout or a drifting centered wrapper.
- Don't add permanent creation forms to Inbox, Library, or Notes lists.
- Don't translate or rewrite user-owned knowledge content.
- Don't use gradients, glassmorphism, neon AI styling, dashboard chrome, or resting shadows.
- Don't rely on hover alone for an important action.
- Don't bypass the Web application's canonical mutation and authorization boundaries.
