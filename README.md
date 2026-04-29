# Article Builder

A focused, opinionated writing tool for long-form articles. Block-based editor, live preview, version history, AI-assisted drafting, and one-click export to Markdown / HTML / PDF — all in a single-page React app with zero backend.

The aesthetic is "warm paper, monospaced rectangles": Source Serif 4 for body copy, Inter Tight for UI, JetBrains Mono for metadata, and a single warm orange accent (`#d4733a`) on a `#f6f4ee` paper background. A full dark theme is included.

> Status: **demo / showcase** — state lives in memory and is reset on refresh. There is no backend, no auth, and no persistent storage. See [Roadmap](#roadmap) for what's intentionally out of scope.

---

## Contents

- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Feature tour](#feature-tour)
- [Keyboard shortcuts](#keyboard-shortcuts)
- [Tech stack](#tech-stack)
- [Project layout](#project-layout)
- [Architecture](#architecture)
- [Design system](#design-system)
- [Testing](#testing)
- [Conventions](#conventions)
- [Roadmap](#roadmap)

---

## Quick start

Requires Node 20+ and npm.

```bash
npm install --legacy-peer-deps   # Radix peer ranges; --legacy-peer-deps is required
npm run dev                      # http://localhost:5173
```

The first thing you see is an empty dashboard. Click **New article** (`⌘N`) to start one.

## Scripts

| Command            | What it does                                                |
| ------------------ | ----------------------------------------------------------- |
| `npm run dev`      | Vite dev server with HMR on port 5173                       |
| `npm run build`    | Type-check (`tsc -b`) and bundle for production with Vite   |
| `npm run preview`  | Serve the production bundle locally                         |
| `npm run lint`     | ESLint flat-config across the whole repo                    |
| `npm run cy:open`  | Open the Cypress GUI runner (dev server must be running)    |
| `npm run cy:run`   | Run all E2E specs headlessly                                |

Run a single E2E spec:

```bash
npx cypress run --spec cypress/e2e/editor.cy.ts
```

---

## Feature tour

### Dashboard

- Stats strip — total articles, drafts, published, lifetime word count
- Search by title/description
- Filter by status (`all` / `draft` / `published`)
- Filter by tag
- Sort by **Last updated**, **Date created**, **Title (A–Z)**, or **Word count**
- Grid and list views
- Per-article context menu: **Publish/Unpublish**, **Delete**

### Editor

A three-pane layout:

- **Edit pane** — block-based contenteditable surface
- **Preview pane** — live, read-only render of the same blocks
- **AI panel** — optional right rail (toggle with `⌘/`)

View modes: **Edit only**, **Split**, **Preview only**. The split view auto-collapses to edit-only when the window is too narrow.

Supported block types: `h1`, `h2`, `h3`, paragraph, bullet list, numbered list, blockquote, code, image. Inline formatting via `⌘B / ⌘I / ⌘U` and `⌘K` for links. Each block has a hover-revealed left rail for inserting/deleting/changing type.

The save indicator (top right) reflects the auto-save state (`saving…` → `saved · just now`). The auto-save delay is configurable in **Settings → Editor**.

### History

Every article has a versioned timeline. Snapshots are captured automatically when:

- The article is **created** (initial draft)
- It is **published** or **unpublished**
- An older revision is **restored**

Each entry records the article's full block content, word count, and a short note. Filter by **all / today / week**. Click a revision to preview it; click **Restore** to replace the current article's blocks with the snapshot (which itself creates a new "Restored" revision so nothing is destroyed).

### AI panel

Pick a **scope**, an **intent** (Expand / Rewrite / Summarize / Generate), a **tone** (Professional / Casual / Technical / Punchy), type a prompt, and hit Generate.

**Scope** controls what the AI operates on and what the result does:

- **Whole article** — the entire article is sent as context. The result is appended as a new paragraph, *except* when intent = Generate, where it replaces the article entirely (the response is parsed as markdown into blocks).
- **Selection** — only enabled when there is a non-collapsed selection in the editor. The selected text is sent as context, and the response replaces the selection in place. If the underlying DOM has changed since selection capture, it falls back to appending.

**Provider** is configurable in **Settings → AI**:

- **mock** (default) — canned responses, no network call. Good for demos and offline.
- **openai** — POST to `https://api.openai.com/v1/chat/completions` with a Bearer key. Default model: `gpt-4o-mini`.
- **anthropic** — POST to `https://api.anthropic.com/v1/messages` with `x-api-key`, `anthropic-version: 2023-06-01`, and `anthropic-dangerous-direct-browser-access: true`. Default model: `claude-haiku-4-5-20251001`.

> **Browser-direct calls and CORS.** OpenAI generally allows direct browser calls from arbitrary origins; Anthropic requires the `anthropic-dangerous-direct-browser-access` header (which the panel sends) but will still preflight and may be blocked depending on your account configuration. For production, proxy through your own backend — set the API URL in Settings to your proxy. The API key is held only in memory; it does not persist across reloads.

### Export

Markdown, HTML, and a PDF preview. Markdown and HTML show a live preview pane; the **Download** button triggers a toast (no actual file write — see [Roadmap](#roadmap)). **Copy** sends the rendered output to the clipboard.

### Metadata modal

Title, description, tags (toggle from a fixed library), cover variant, status, and a Google-style SEO preview that updates as you type.

### Command palette (`⌘K`)

Searchable launcher with three groups:

- **Actions** — New article, Open AI, Export, Edit metadata
- **Navigate** — Dashboard / Editor / History / Settings
- **Theme** — Light / Dark
- **Articles** — every article in the workspace, jumpable by title

### Settings

- **Appearance** — mode (light/dark), color scheme (Warm / Slate / Sage / Rose / Mono), and reading column width (narrow / comfortable / wide). Mode and scheme are independent: each scheme has a matched light and dark palette, so you can pick e.g. **Slate dark** or **Sage light**. Changes apply immediately.
- **Editor** — auto-save delay (500ms – 5s) and spell check toggle (controls the browser's native spell checker on every contenteditable block).
- **AI** — provider (mock / openai / anthropic), API URL (defaults match official endpoints; override for proxies), API key, model name. Keys are held in memory only.
- **Shortcuts** — reference table.

#### Color schemes

Schemes are pure data: each is a CSS-variable palette under `html[data-theme="<id>"]` and `html.dark[data-theme="<id>"]` in `src/index.css`. To add one, copy a `:root, html[data-theme="warm"]` block, change the values, and add the new id to the `ColorScheme` union in `src/types/index.ts` plus the `SCHEMES` array in `src/components/Settings.tsx`.

---

## Keyboard shortcuts

| Shortcut    | Action                                  |
| ----------- | --------------------------------------- |
| `⌘K`        | Open / close the command palette        |
| `⌘N`        | New article                             |
| `⌘/`        | Toggle the AI panel (when in editor)    |
| `⌘B`        | **Bold** (when editor is focused)       |
| `⌘I`        | *Italic* (when editor is focused)       |
| `⌘U`        | Underline (when editor is focused)      |
| `⌘K`        | Insert link (when editor is focused)    |
| `Esc`       | Close any open modal or panel           |

Editor-scoped shortcuts only fire when focus is inside the editor surface (anything with `data-editor-region`).

---

## Tech stack

- **React 19** + **TypeScript 6**
- **Vite 8** for dev server and bundling
- **Tailwind CSS v4** via `@tailwindcss/vite` (config-free — no `tailwind.config.js`)
- **Radix UI** primitives (Dialog, Dropdown Menu, Toast, Slot) — installed but used only as headless deps; the visible UI shell is custom
- **Cypress 15** for end-to-end tests
- **ESLint 10** with flat config
- Hand-rolled SVG icon set (~40 icons) — no external icon library

There is no router, no state library, no CSS-in-JS runtime, and no backend. Styling is a mix of utility classes defined in `src/index.css` and inline `style={{ ... }}` props that read CSS custom properties.

---

## Project layout

```
src/
├── App.tsx                      # State orchestrator, route switch, global shortcuts
├── main.tsx                     # React entry point
├── index.css                    # Design tokens, .btn / .label / .doc utilities, animations
├── types/index.ts               # Article, Block, Version, AppSettings, Toast, Route
├── data/seed.ts                 # ARTICLES_SEED, VERSIONS_SEED (both empty), TAG_LIBRARY
├── lib/utils.ts                 # cn, uid, fmtDate, fmtDateLong, stripTags
├── hooks/useToasts.ts           # Toast queue with auto-dismiss
├── components/
│   ├── Sidebar.tsx              # Brand, nav, drafts/published lists
│   ├── Icon.tsx                 # SVG icon set
│   ├── CommandPalette.tsx       # ⌘K palette
│   ├── AIPanel.tsx              # Right-rail AI assistant (mock)
│   ├── History.tsx              # Version timeline + snapshot preview + restore
│   ├── Settings.tsx             # Appearance / Editor / Shortcuts
│   ├── Dashboard/Dashboard.tsx  # Stats, filters, grid/list views, card menus
│   ├── Editor/                  # Editor.tsx, Toolbar.tsx, EditPane.tsx, PreviewPane.tsx,
│   │                            # BlockRow.tsx, RenderBlock.tsx
│   ├── modals/                  # MetadataModal.tsx, ExportModal.tsx
│   └── ui/                      # Modal, Menu, Tag, Status, Kbd, ToastHost, CoverPh
└── ...
cypress/e2e/                     # navigation / dashboard / editor / modals specs
```

## Architecture

Single-page app with no router. `src/App.tsx` is the orchestrator: it owns all top-level state and selects which screen to render based on a `route` string (`dashboard | editor | history | settings`).

**State owned by `App.tsx`:**

- `articles: Article[]` — the workspace; mutated through `updateArticle`, `updateArticleById`, and `deleteArticle`
- `versions: Version[]` — full block snapshots of articles. Created by `snapshotArticle(article, note, label?)`, called on `newArticle`, `togglePublish`, and `restoreVersion`
- `settings: AppSettings` — reading width, auto-save delay, spell check, color scheme, AI provider config
- `theme` — applied by toggling the `.dark` class on `document.documentElement`. The `colorScheme` setting is applied separately as `data-theme="<id>"` on the same element, so the two compose
- `selectionRef` + `selectionText` — the latest non-collapsed selection inside the editor region. Captured via a `selectionchange` listener in `Editor.tsx`. Used by the AI panel to scope generation to a selection and to replace it via `document.execCommand('insertText', …)`
- `route`, `currentId`, plus open/close flags for `aiOpen`, `metaOpen`, `exportOpen`, `paletteOpen`

**Versioning model.** Each `Version` carries its own `blocks: Block[]` snapshot, so **Restore** is a real operation: it replaces the article's blocks with the version's blocks (and captures a new `Restored vXX` snapshot, so nothing is destroyed). Every article's most recent snapshot is tagged `label: 'current'`.

**Editor surface.** The block editor is a vanilla contenteditable system, not a real rich-text framework:

- `Editor.tsx` — top bar, view toggle, save indicator, derives `wordCount` and `readMin`
- `Toolbar.tsx` — uses `document.execCommand` for inline formatting (legacy but intentional)
- `EditPane.tsx` / `BlockRow.tsx` — render each block as an editable row with a hover rail for type/insert/delete
- `PreviewPane.tsx` / `RenderBlock.tsx` — read-only render path used by the split and preview views

`Block` lives in `src/types/index.ts`. Lists use `items: string[]`; everything else uses `text: string`. `setBlockType` in `Editor.tsx` is the canonical example of how to convert between the two shapes.

**Auto-save** is local to `Editor.tsx`: `markDirty` debounces by `settings.autoSaveDelayMs` and updates the article's `updatedAt`. There is no persistence — refreshing the page resets to the empty workspace.

**Global keyboard shortcuts** (`⌘K`, `⌘N`, `⌘/`, `Esc`) live in a single `useEffect` in `App.tsx`. Editor-scoped shortcuts (`⌘B / ⌘I / ⌘U / ⌘K`) live in `Editor.tsx` and only fire when focus is inside an element with `data-editor-region`.

**Modals and the AI panel** keep their own draft state and only call back on save (`MetadataModal`, `ExportModal`, `AIPanel`).

**Toasts.** `useToasts()` exposes `{ toasts, push, dismiss }`. `push(message, tone)` is threaded through user-facing actions in `App.tsx` (publish, restore, new article, delete) and the modals.

## Design system

Tokens are CSS custom properties on `:root` and `html.dark` in `src/index.css`. The light palette:

```css
--paper:       #f6f4ee   /* main background           */
--paper-2:     #efece2   /* surface / hover           */
--ink:         #0d0d0c   /* primary text              */
--ink-2:       #2a2a27   /* secondary text            */
--ink-3:       #5a5a55   /* tertiary text             */
--ink-4:       #8a8a82   /* tertiary / hint           */
--rule-soft:   #d8d4c6   /* dividers                  */
--rule-softer: #e6e2d4   /* subtle dividers           */
--accent:      #d4733a   /* warm orange — sole accent */
--accent-soft: #f4d9c2
--accent-ink:  #7a3d18
--green:       #2f6b3a   /* status: positive          */
--red:         #b04632   /* status: destructive       */
```

Most components style with inline `style={{ ... }}` reading these variables, plus `.btn`, `.btn-primary`, `.btn-ghost`, `.label`, and `.doc` utility classes defined in `src/index.css`. **Tailwind v4 is wired through `@tailwindcss/vite` but is rarely used directly** — there is no `tailwind.config.js` (Tailwind v4 is config-free).

## Testing

Cypress 15. Specs live in `cypress/e2e/` and select via `data-testid` attributes:

- `cypress/e2e/navigation.cy.ts` — sidebar, route switching, sidebar article list
- `cypress/e2e/dashboard.cy.ts` — empty state, search, filters, list view, card menu
- `cypress/e2e/editor.cy.ts` — title, view toggle, toolbar, modals, AI toggle, publish
- `cypress/e2e/modals.cy.ts` — metadata, export, AI panel, history (snapshot + restore), settings

The initial workspace is **empty**, so most specs create an article via the UI in `beforeEach`. `cy:open` and `cy:run` assume the dev server is running on `http://localhost:5173` (set in `cypress.config.ts`).

`cypress/` is in the ESLint `globalIgnores` list, so spec files do not get linted by `npm run lint`.

## Conventions

- **No path aliases.** TS 6 deprecates `baseUrl`, so imports are relative.
- **No `tailwind.config.js`.** Tailwind v4 is config-free; extend via CSS in `src/index.css`.
- **`--legacy-peer-deps` is required for `npm install`** because of Radix peer ranges.
- **Inline styles + CSS variables** is the dominant styling pattern. Keep new UI in this style rather than mixing in arbitrary Tailwind utility chains.
- **Test IDs** use the `data-testid` attribute. Preserve existing IDs (`metadata-btn`, `meta-title-input`, `view-edit|split|preview`, `nav-history`, `theme-light|dark`, `version-item-*`, etc.) when refactoring.

## Roadmap

Things that are intentionally **not** in scope for the demo, but are obvious extensions:

- **Persistence.** State is in memory. The simplest first step is `localStorage` (mirror `articles` / `versions` / `settings`). The next is a real backend.
- **Real LLM in the AI panel.** `AIPanel.submit` currently returns a hardcoded `sampleResponses[intent][tone]`. Swap the `setTimeout` for a `fetch` to your provider of choice.
- **Real Markdown / HTML / PDF download.** The Export modal renders correct previews but the **Download** button only fires a toast. PDF needs a server (or a client-side renderer like `jspdf`).
- **Diff view in History.** Today the history page shows the snapshot preview but no inline diff. A real implementation needs a block-level diff (`fast-myers-diff` or similar).
- **Auth & multi-user.** Out of scope for a local demo.
