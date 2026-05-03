import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Vite serves under the `/article-builder/` base path (see vite.config.ts).
    baseUrl: 'http://localhost:5173/article-builder',
    viewportWidth: 1440,
    viewportHeight: 900,
    setupNodeEvents(_on, _config) {},
  },
})
