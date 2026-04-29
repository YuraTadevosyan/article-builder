# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173
- `npm run build` — TypeScript project build (`tsc -b`) followed by Vite production build
- `npm run lint` — ESLint flat config across the repo
- `npm run cy:open` — Open Cypress runner (dev server must be running)
- `npm run cy:run` — Headless Cypress run
- Run a single E2E spec: `npx cypress run --spec cypress/e2e/editor.cy.ts`

## Stack notes that affect how you write code

- **Tailwind v4 is config-free.** There is no `tailwind.config.js`. Tailwind is wired through `@tailwindcss/vite` in `vite.config.ts`. Don't add a config file — extend via CSS in `src/index.css`.
- **Design tokens live in `src/index.css`** as CSS custom properties on `:root` and `html.dark` (`--paper`, `--ink`, `--ink-2..4`, `--accent`, `--rule-soft`, `--mono`, `--serif`, etc.). Components reference these directly via inline `style={{ ... }}` and the `.btn`, `.label`, `.doc` utility classes defined in the same file. Most styling is inline-style + CSS-vars rather than Tailwind utility classes — match that pattern.
- **No Shadcn CLI was used.** The Shadcn CLI couldn't scaffold into the non-empty repo, so Radix primitives (`@radix-ui/react-dialog`, `-dropdown-menu`, `-toast`, `-slot`) are installed as deps but the UI shell in `src/components/ui/` (Modal, Menu, Tag, Status, Kbd, ToastHost, CoverPh) is custom and built on the design's CSS variables. When adding new UI, follow that local pattern rather than reaching for Shadcn-style imports.
- **TS 6 path aliases are not configured.** `baseUrl`/`paths` were removed from `tsconfig.app.json` because TS 6 deprecates `baseUrl`. Use relative imports.
- **Plain `npm install` works** — no `--legacy-peer-deps` flag needed. ESLint is pinned to ^9.18 (not 10) because `eslint-plugin-react@7.x` and `eslint-plugin-react-hooks@7.x` cap their `eslint` peer at `^9.7`. If you bump ESLint, check those plugins' peer ranges first.
- **`cypress/` is in the ESLint `globalIgnores`** list — Cypress specs don't get linted by `npm run lint`.

## Architecture

Single-page app, no router. `src/App.tsx` is the orchestrator: it owns all top-level state and selects which screen to render based on a `route` string (`dashboard | editor | history | settings`).

State ownership lives in `App.tsx`:
- `articles` — the article list (seeded from `src/data/seed.ts`); patched via `updateArticle` (current) and `updateArticleById` (any).
- `versions` — read-only seed; per-article versions are filtered when passed down.
- `route`, `currentId`, plus open/close flags for `aiOpen`, `metaOpen`, `exportOpen`, `paletteOpen`.
- Theme is applied by toggling `html.dark` directly on `document.documentElement`.

Global keyboard shortcuts (`⌘K` palette, `⌘N` new article, `⌘/` AI panel, `Esc` close-everything) are wired in a single `useEffect` in `App.tsx`. Editor-scoped shortcuts (`⌘B/I/U/K`) live in `Editor.tsx` and are gated by `data-editor-region` so they only fire when focus is inside the editor surface.

The editor (`src/components/Editor/`) is a block-based contenteditable, not a real rich-text framework:
- `Editor.tsx` — top bar, view toggle (edit/split/preview), save indicator, keyboard handling, derives `wordCount` and `readMin` from blocks.
- `Toolbar.tsx` — formatting commands; uses `document.execCommand` (legacy but intentional given the contenteditable approach).
- `EditPane.tsx` / `BlockRow.tsx` — render each block as an editable row with type/insert/delete menus.
- `PreviewPane.tsx` / `RenderBlock.tsx` — read-only render path used by split and preview views.
- `Block` shape is in `src/types/index.ts`; lists use `items: string[]`, everything else uses `text: string`. `setBlockType` in `Editor.tsx` handles the conversion both ways and is the canonical example of how to mutate a block's type.

Dirty/save state is local to `Editor.tsx` (`markDirty` debounced ~900ms updates `updatedAt` on the article and flips a "saving…/saved" indicator). There is no persistence layer — refreshing the page resets to seed.

Modals (`src/components/modals/`) keep their own draft state and only call back on save (`MetadataModal`, `ExportModal`). The `CommandPalette` is a flat-list filter over a hardcoded `Command[]` plus the article list.

Toast system: `useToasts` hook in `src/hooks/useToasts.ts` exposes `{ toasts, push, dismiss }`. `push(message, tone)` is threaded through most user-facing actions.

## Test conventions

- E2E specs in `cypress/e2e/` rely on `data-testid` selectors. When editing components, preserve existing test IDs (`metadata-btn`, `meta-title-input`, `meta-save-btn`, `export-format-md`, `ai-toggle-btn`, `command-palette-input`, `palette-cmd-*`, `view-edit|split|preview`, `nav-history`, `nav-settings`, `version-item-<id>`, `restore-btn`, `theme-light|dark`, etc.). Add new test IDs in the same `data-testid` style rather than inventing a different convention.
- `cypress.config.ts` sets `baseUrl: http://localhost:5173`, so `cy:open`/`cy:run` assume `npm run dev` is running.
