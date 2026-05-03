# CLAUDE.md

Codex will review your output once you are done.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on port 5173
- `npm run build` — TypeScript project build (`tsc -b`) followed by Vite production build
- `npm run lint` — ESLint flat config across the repo
- `npm run cy:open` — Open Cypress runner (dev server must be running)
- `npm run cy:run` — Headless Cypress run
- Run a single E2E spec: `npx cypress run --spec cypress/e2e/editor.cy.ts`

## Stack notes that affect how you write code

- **Tailwind v4 is config-free.** There is no `tailwind.config.js`. Tailwind is wired through `@tailwindcss/vite` in `vite.config.ts`. Theme tokens live in `@theme inline { ... }` in `src/index.css`.
- **Two valid styling paths coexist.** New surfaces (Sidebar, Settings, modals, command palette, all of `src/components/ui/`) use Tailwind utility classes + Shadcn components. Older surfaces (Editor internals, Dashboard cards, History timeline) still use inline `style={{ … }}` reading `var(--paper)` / `var(--ink)` / `var(--accent)` etc. Both reach the same palette via the `@theme inline` mapping in `index.css`. Match the surrounding file's style when editing — don't rewrite working inline-style code into Tailwind unless asked.
- **Shadcn UI is wired up.** `components.json` exists with `style: "new-york"` and the `@/*` alias. The CLI still can't run cleanly into this repo, so the components in `src/components/ui/` (button, input, textarea, dialog, dropdown-menu, tabs, switch, slider, select, label, card, badge, separator) were copied in by hand. Lowercase filenames (Shadcn convention). The legacy custom-styled components (`Modal.tsx`, `Menu.tsx`, `Tag.tsx`, `Status.tsx`, `Kbd.tsx`, `ToastHost.tsx`, `CoverPh.tsx`) live alongside and are still in use.
- **`@/*` path alias** points at `src/*`. Configured in `tsconfig.app.json` (`paths`, no explicit `baseUrl` — TS 5.5+ supports implicit) and `vite.config.ts` (`resolve.alias`). Both styles work; the codebase is mid-migration to `@/`.
- **React Router 7** — see [Routing](#routing) below.
- **Plain `npm install` works** — no `--legacy-peer-deps` flag needed. ESLint is pinned to ^9.18 (not 10) because `eslint-plugin-react@7.x` and `eslint-plugin-react-hooks@7.x` cap their `eslint` peer at `^9.7`. If you bump ESLint, check those plugins' peer ranges first.
- **`cypress/` is in the ESLint `globalIgnores`** list — Cypress specs don't get linted by `npm run lint`.
- **Shadcn UI files are exempt from `react-refresh/only-export-components`.** That rule fires on the standard Shadcn pattern of re-exporting Radix primitives next to React components (e.g. `export const Dialog = DialogPrimitive.Root`). The override is scoped to `src/components/ui/**` in `eslint.config.js`.

## Routing

Routes are owned by `react-router-dom`'s **`HashRouter`** (set up in `src/main.tsx`). HashRouter is deliberate — the app is deployed to GitHub Pages under the `/article-builder/` subpath (Vite's `base`), and gh-pages has no SPA fallback. Hash-based routes (`/#/editor/foo`) live in the URL fragment so the static server only needs to serve `index.html` once.

| URL              | Component         |
| ---------------- | ----------------- |
| `#/`             | redirect → `#/dashboard` |
| `#/dashboard`    | `Dashboard`       |
| `#/editor/:id`   | `EditorRoute` (App.tsx) — resolves `:id` and renders `Editor` + optional `AIPanel`. Unknown id redirects to `#/dashboard`. |
| `#/history`      | `History`         |
| `#/settings`     | `Settings`        |
| `*`              | redirect → `#/dashboard` |

Navigation pattern:
- Sidebar uses `<NavLink>` for nav items and article rows; `useMatch('/editor/:id')` to highlight the current article (the matcher operates on the parsed pathname inside the hash, so `/editor/...` is correct, not `#/editor/...`).
- Everywhere else uses `useNavigate()` (CommandPalette, `App.newArticle`, `App.pickArticle`, `App.restoreVersion`) with plain `/path` strings — the router prepends the `#`.
- Cypress tests assert on `cy.location('hash')` (e.g. `should('eq', '#/dashboard')`), not `cy.location('pathname')`.
- If you ever swap to `BrowserRouter` for a different host, also configure that host to serve `index.html` for unknown paths and set `basename={import.meta.env.BASE_URL.replace(/\/$/, '')}` on the router.

## Architecture

Single-page app. `src/App.tsx` owns top-level state and renders the sidebar + a `<Routes>` block.

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
