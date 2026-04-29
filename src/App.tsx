import { useState, useEffect, useCallback, useRef } from 'react'
import { Sidebar } from './components/Sidebar'
import { Editor } from './components/Editor/Editor'
import { Dashboard } from './components/Dashboard/Dashboard'
import { History } from './components/History'
import { Settings } from './components/Settings'
import { AIPanel } from './components/AIPanel'
import { MetadataModal } from './components/modals/MetadataModal'
import { ExportModal } from './components/modals/ExportModal'
import { CommandPalette } from './components/CommandPalette'
import { ToastHost } from './components/ui/ToastHost'
import { useToasts } from './hooks/useToasts'
import { uid } from './lib/utils'
import { ARTICLES_SEED, VERSIONS_SEED } from './data/seed'
import type { Article, Block, EditorSelection, Route, Version, AppSettings } from './types'
import { mdToBlocks } from './lib/markdown'

const DEFAULT_SETTINGS: AppSettings = {
  readingWidth: 'comfortable',
  autoSaveDelayMs: 1500,
  spellCheck: true,
  colorScheme: 'warm',
  aiProvider: 'mock',
  aiApiUrl: '',
  aiApiKey: '',
  aiModel: '',
}

function countWords(blocks: Block[]): number {
  const text = blocks.map(b => b.items ? b.items.join(' ') : (b.text || '').replace(/<[^>]+>/g, ' ')).join(' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function App() {
  const [theme, setThemeState] = useState('light')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [articles, setArticles] = useState<Article[]>(ARTICLES_SEED)
  const [versions, setVersions] = useState<Version[]>(VERSIONS_SEED)
  const [route, setRoute] = useState<Route>('dashboard')
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { toasts, push, dismiss } = useToasts()

  const setTheme = useCallback((t: string) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.colorScheme)
  }, [settings.colorScheme])

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings(s => ({ ...s, ...patch }))
  }, [])

  // Editor selection — captured from contenteditable blocks. The Range
  // reference goes stale if the surrounding DOM rerenders, so callers must
  // wrap restoration in try/catch.
  const selectionRef = useRef<EditorSelection>({ text: '', range: null })
  const [selectionText, setSelectionText] = useState('')

  const onEditorSelection = useCallback((sel: EditorSelection) => {
    selectionRef.current = sel
    setSelectionText(sel.text)
  }, [])

  const replaceEditorSelection = useCallback((text: string): boolean => {
    const sel = window.getSelection()
    const r = selectionRef.current.range
    if (!sel || !r) return false
    try {
      sel.removeAllRanges()
      sel.addRange(r)
      const ok = document.execCommand('insertText', false, text)
      // Range is consumed after insert; clear so a stale ref isn't reused.
      selectionRef.current = { text: '', range: null }
      setSelectionText('')
      return ok
    } catch {
      return false
    }
  }, [])

  const currentArticle = articles.find(a => a.id === currentId) || null
  const articleVersions = currentArticle ? versions.filter(v => v.articleId === currentArticle.id) : []

  const snapshotArticle = useCallback((article: Article, note: string, label?: string) => {
    setVersions(prev => {
      // Demote any existing 'current' label on this article
      const cleaned = prev.map(v => v.articleId === article.id && v.label === 'current' ? { ...v, label: undefined } : v)
      const newVersion: Version = {
        id: uid('v'),
        articleId: article.id,
        at: new Date().toISOString(),
        words: countWords(article.blocks),
        label,
        note,
        blocks: article.blocks.map(b => ({ ...b, items: b.items ? [...b.items] : undefined })),
      }
      return [newVersion, ...cleaned]
    })
  }, [])

  const updateArticle = useCallback((patch: Partial<Article>) => {
    setArticles(arr => arr.map(a => a.id === currentId ? { ...a, ...patch } : a))
  }, [currentId])

  const updateArticleById = useCallback((id: string, patch: Partial<Article>) => {
    setArticles(arr => arr.map(a => a.id === id ? { ...a, ...patch } : a))
  }, [])

  const newArticle = useCallback(() => {
    const id = uid('art')
    const now = new Date().toISOString()
    const a: Article = {
      id, title: 'Untitled draft', description: '', tags: [],
      cover: 'ph-paper', status: 'Draft',
      updatedAt: now, createdAt: now,
      words: 0,
      blocks: [{ type: 'h1', text: 'Untitled draft' }, { type: 'p', text: 'Start writing…' }],
    }
    setArticles(arr => [a, ...arr])
    snapshotArticle(a, 'Initial draft', 'current')
    setCurrentId(id)
    setRoute('editor')
    push('New article created', 'success')
  }, [push, snapshotArticle])

  const deleteArticle = useCallback((id: string) => {
    setArticles(arr => arr.filter(a => a.id !== id))
    setVersions(arr => arr.filter(v => v.articleId !== id))
    setCurrentId(prev => prev === id ? null : prev)
    push('Article deleted', 'default')
  }, [push])

  const pickArticle = useCallback((id: string) => { setCurrentId(id); setRoute('editor') }, [])

  const togglePublish = useCallback(() => {
    if (!currentArticle) return
    const nextStatus = currentArticle.status === 'Published' ? 'Draft' : 'Published'
    const updated: Article = { ...currentArticle, status: nextStatus, updatedAt: new Date().toISOString() }
    setArticles(arr => arr.map(a => a.id === updated.id ? updated : a))
    snapshotArticle(updated, nextStatus === 'Published' ? 'Published' : 'Reverted to draft', 'current')
    push(nextStatus === 'Published' ? 'Published live' : 'Reverted to draft', 'success')
  }, [currentArticle, push, snapshotArticle])

  const restoreVersion = useCallback((v: Version) => {
    const target = articles.find(a => a.id === v.articleId)
    if (!target) return
    const restored: Article = {
      ...target,
      blocks: v.blocks.map(b => ({ ...b, items: b.items ? [...b.items] : undefined })),
      updatedAt: new Date().toISOString(),
    }
    setArticles(arr => arr.map(a => a.id === restored.id ? restored : a))
    snapshotArticle(restored, `Restored ${v.id.toUpperCase()}`, 'current')
    setCurrentId(target.id)
    setRoute('editor')
    push(`Restored ${v.id.toUpperCase()}`, 'success')
  }, [articles, push, snapshotArticle])

  const insertAIText = useCallback((text: string) => {
    if (!currentArticle) return
    const blocks = [...currentArticle.blocks, { type: 'p' as const, text }]
    setArticles(arr => arr.map(a => a.id === currentArticle.id ? { ...a, blocks } : a))
  }, [currentArticle])

  const replaceArticleFromMarkdown = useCallback((markdown: string) => {
    if (!currentArticle) return
    const blocks = mdToBlocks(markdown)
    if (blocks.length === 0) return
    setArticles(arr => arr.map(a => a.id === currentArticle.id ? { ...a, blocks, updatedAt: new Date().toISOString() } : a))
  }, [currentArticle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault(); setPaletteOpen(p => !p)
      } else if (meta && e.key.toLowerCase() === 'n') {
        e.preventDefault(); newArticle()
      } else if (meta && e.key === '/') {
        e.preventDefault(); setAiOpen(o => !o)
      } else if (e.key === 'Escape') {
        setPaletteOpen(false); setMetaOpen(false); setExportOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [newArticle])

  // If the route is editor but there is no current article, fall back to dashboard.
  const effectiveRoute: Route = route === 'editor' && !currentArticle ? 'dashboard' : route

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--paper)', position: 'relative' }}>
      <Sidebar
        route={effectiveRoute}
        onRoute={setRoute}
        articles={articles}
        currentId={currentId}
        onPickArticle={pickArticle}
        onNewArticle={newArticle}
      />

      <main style={{ flex: 1, display: 'flex', minWidth: 0, height: '100%' }}>
        {effectiveRoute === 'editor' && currentArticle && (
          <Editor
            article={currentArticle}
            onUpdate={updateArticle}
            onOpenMeta={() => setMetaOpen(true)}
            onOpenExport={() => setExportOpen(true)}
            onOpenAI={() => setAiOpen(o => !o)}
            aiOpen={aiOpen}
            versions={articleVersions}
            settings={settings}
            onTogglePublish={togglePublish}
            onSelectionChange={onEditorSelection}
          />
        )}
        {effectiveRoute === 'dashboard' && (
          <Dashboard
            articles={articles}
            onPick={pickArticle}
            onNew={newArticle}
            onUpdate={updateArticleById}
            onDelete={deleteArticle}
          />
        )}
        {effectiveRoute === 'history' && (
          <History
            versions={versions}
            articles={articles}
            onRestore={restoreVersion}
          />
        )}
        {effectiveRoute === 'settings' && (
          <Settings
            theme={theme}
            setTheme={setTheme}
            settings={settings}
            onUpdateSettings={updateSettings}
            push={push}
          />
        )}

        {effectiveRoute === 'editor' && currentArticle && aiOpen && (
          <AIPanel
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            onApply={insertAIText}
            onReplaceArticle={replaceArticleFromMarkdown}
            onReplaceSelection={replaceEditorSelection}
            selectionText={selectionText}
            article={currentArticle}
            settings={settings}
            push={push}
          />
        )}
      </main>

      <MetadataModal
        open={metaOpen && !!currentArticle}
        article={currentArticle}
        onClose={() => setMetaOpen(false)}
        onSave={(d) => updateArticle(d)}
        push={push}
      />
      <ExportModal
        open={exportOpen && !!currentArticle}
        article={currentArticle}
        onClose={() => setExportOpen(false)}
        push={push}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        articles={articles}
        onPickArticle={(id) => { pickArticle(id); setPaletteOpen(false) }}
        onRoute={(r) => { setRoute(r); setPaletteOpen(false) }}
        onNew={() => { newArticle(); setPaletteOpen(false) }}
        onAI={() => { if (currentArticle) setAiOpen(true); setPaletteOpen(false) }}
        onExport={() => { if (currentArticle) setExportOpen(true); setPaletteOpen(false) }}
        onMeta={() => { if (currentArticle) setMetaOpen(true); setPaletteOpen(false) }}
        setTheme={setTheme}
      />

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
