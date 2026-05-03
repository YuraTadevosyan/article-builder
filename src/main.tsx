import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

/*
 * HashRouter, not BrowserRouter.
 *
 * The app is hosted on GitHub Pages under the /article-builder/ subpath
 * (see `base` in vite.config.ts). gh-pages is a static file host — it has
 * no SPA fallback, so a deep link like /article-builder/editor/foo would
 * 404 on refresh because no such file exists on disk.
 *
 * HashRouter keeps every route in the URL fragment (`/#/editor/foo`), which
 * the static server ignores. Every route resolves to the same index.html,
 * the router takes over on the client, and refresh / share / direct visit
 * all work without a 404 redirect dance.
 *
 * Vite's `base` still sets the asset prefix correctly; only the *route*
 * portion moves to the hash.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
