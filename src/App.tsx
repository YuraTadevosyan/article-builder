import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { Editor } from '@/components/Editor/Editor'
import { Dashboard } from '@/components/Dashboard/Dashboard'
import { History } from '@/components/History'
import { Settings } from '@/components/Settings'
import { AIPanel } from '@/components/AIPanel'
import { MetadataModal } from '@/components/modals/MetadataModal'
import { ExportModal } from '@/components/modals/ExportModal'
import { CommandPalette } from '@/components/CommandPalette'
import { MobileTopBar } from '@/components/MobileTopBar'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { ToastHost } from '@/components/ui/ToastHost'
import { useToasts } from '@/hooks/useToasts'
import { uid } from '@/lib/utils'
import { mdToBlocks } from '@/lib/markdown'
import { ARTICLES_SEED, VERSIONS_SEED } from '@/data/seed'
import type { Article, Block, EditorSelection, Version, AppSettings } from '@/types'

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
  const navigate = useNavigate()
  const [theme, setThemeState] = useState('light')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [articles, setArticles] = useState<Article[]>(ARTICLES_SEED)
  const [versions, setVersions] = useState<Version[]>(VERSIONS_SEED)
  const [aiOpen, setAiOpen] = useState(false)
  const [metaOpen, setMetaOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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
      selectionRef.current = { text: '', range: null }
      setSelectionText('')
      return ok
    } catch {
      return false
    }
  }, [])

  const snapshotArticle = useCallback((article: Article, note: string, label?: string) => {
    setVersions(prev => {
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
    navigate(`/editor/${id}`)
    push('New article created', 'success')
  }, [navigate, push, snapshotArticle])

  const deleteArticle = useCallback((id: string) => {
    setArticles(arr => arr.filter(a => a.id !== id))
    setVersions(arr => arr.filter(v => v.articleId !== id))
    push('Article deleted', 'default')
  }, [push])

  const pickArticle = useCallback((id: string) => { navigate(`/editor/${id}`) }, [navigate])

  const togglePublishById = useCallback((id: string) => {
    const a = articles.find(x => x.id === id)
    if (!a) return
    const nextStatus = a.status === 'Published' ? 'Draft' : 'Published'
    const updated: Article = { ...a, status: nextStatus, updatedAt: new Date().toISOString() }
    setArticles(arr => arr.map(x => x.id === updated.id ? updated : x))
    snapshotArticle(updated, nextStatus === 'Published' ? 'Published' : 'Reverted to draft', 'current')
    push(nextStatus === 'Published' ? 'Published live' : 'Reverted to draft', 'success')
  }, [articles, push, snapshotArticle])

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
    navigate(`/editor/${target.id}`)
    push(`Restored ${v.id.toUpperCase()}`, 'success')
  }, [articles, navigate, push, snapshotArticle])

  const insertAIText = useCallback((text: string, articleId: string) => {
    setArticles(arr => arr.map(a => a.id === articleId ? { ...a, blocks: [...a.blocks, { type: 'p' as const, text }] } : a))
  }, [])

  const replaceArticleFromMarkdown = useCallback((markdown: string, articleId: string) => {
    const blocks = mdToBlocks(markdown)
    if (blocks.length === 0) return
    setArticles(arr => arr.map(a => a.id === articleId ? { ...a, blocks, updatedAt: new Date().toISOString() } : a))
  }, [])

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
        setPaletteOpen(false); setMetaOpen(false); setExportOpen(false); setAiOpen(false); setMobileNavOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [newArticle])

  return (
    <div className="relative flex h-[100dvh] overflow-hidden bg-background">
      {/* Desktop sidebar (>= md). Always rendered as a flex child. */}
      <div className="hidden md:flex">
        <Sidebar articles={articles} onNewArticle={newArticle} />
      </div>

      {/* Mobile sidebar (< md). Rendered inside a Sheet, slides in from the
          left when the user taps the hamburger in MobileTopBar. */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-[280px] p-0 md:hidden" aria-label="Navigation">
          <Sidebar
            articles={articles}
            onNewArticle={() => { newArticle(); setMobileNavOpen(false) }}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex h-full min-w-0 flex-1 flex-col">
        <MobileTopBar articles={articles} onOpenNav={() => setMobileNavOpen(true)} />

        <main aria-label="Main content" className="flex h-full min-w-0 flex-1">
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route
            path="/dashboard"
            element={
              <Dashboard
                articles={articles}
                onPick={pickArticle}
                onNew={newArticle}
                onUpdate={updateArticleById}
                onDelete={deleteArticle}
              />
            }
          />

          <Route
            path="/editor/:id"
            element={
              <EditorRoute
                articles={articles}
                versions={versions}
                settings={settings}
                aiOpen={aiOpen}
                setAiOpen={setAiOpen}
                onUpdate={(patch) => {
                  // Resolved by EditorRoute itself via params; this fallback
                  // is wired as updateArticleById bound to the current id.
                  void patch
                }}
                updateArticleById={updateArticleById}
                togglePublishById={togglePublishById}
                onOpenMeta={() => setMetaOpen(true)}
                onOpenExport={() => setExportOpen(true)}
                onSelectionChange={onEditorSelection}
                onReplaceArticle={replaceArticleFromMarkdown}
                onReplaceSelection={replaceEditorSelection}
                onApplyAI={insertAIText}
                selectionText={selectionText}
                push={push}
              />
            }
          />

          <Route
            path="/history"
            element={
              <History
                versions={versions}
                articles={articles}
                onRestore={restoreVersion}
              />
            }
          />

          <Route
            path="/settings"
            element={
              <Settings
                theme={theme}
                setTheme={setTheme}
                settings={settings}
                onUpdateSettings={updateSettings}
                push={push}
              />
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      <MetadataModal
        open={metaOpen}
        article={articles.find(a => metaOpen && location.pathname.startsWith('/editor/') && a.id === location.pathname.split('/editor/')[1]) || null}
        onClose={() => setMetaOpen(false)}
        onSave={(id, patch) => updateArticleById(id, patch)}
        push={push}
      />

      <ExportModalRoute
        open={exportOpen}
        articles={articles}
        onClose={() => setExportOpen(false)}
        push={push}
      />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        articles={articles}
        onPickArticle={(id) => { pickArticle(id); setPaletteOpen(false) }}
        onNew={() => { newArticle(); setPaletteOpen(false) }}
        onAI={() => { setAiOpen(true); setPaletteOpen(false) }}
        onExport={() => { setExportOpen(true); setPaletteOpen(false) }}
        onMeta={() => { setMetaOpen(true); setPaletteOpen(false) }}
        setTheme={setTheme}
      />

      <ToastHost toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}

// EditorRoute resolves :id from the URL and either renders the Editor or
// kicks back to the dashboard when the id is unknown.
interface EditorRouteProps {
  articles: Article[]
  versions: Version[]
  settings: AppSettings
  aiOpen: boolean
  setAiOpen: (b: boolean | ((p: boolean) => boolean)) => void
  onUpdate: (patch: Partial<Article>) => void
  updateArticleById: (id: string, patch: Partial<Article>) => void
  togglePublishById: (id: string) => void
  onOpenMeta: () => void
  onOpenExport: () => void
  onSelectionChange: (sel: EditorSelection) => void
  onReplaceArticle: (markdown: string, articleId: string) => void
  onReplaceSelection: (text: string) => boolean
  onApplyAI: (text: string, articleId: string) => void
  selectionText: string
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

function EditorRoute({
  articles, versions, settings, aiOpen, setAiOpen,
  updateArticleById, togglePublishById, onOpenMeta, onOpenExport,
  onSelectionChange, onReplaceArticle, onReplaceSelection, onApplyAI,
  selectionText, push,
}: EditorRouteProps) {
  const { id } = useParams<{ id: string }>()
  const article = articles.find(a => a.id === id)
  if (!article) return <Navigate to="/dashboard" replace />

  const articleVersions = versions.filter(v => v.articleId === article.id)

  return (
    <>
      <Editor
        article={article}
        onUpdate={(patch) => updateArticleById(article.id, patch)}
        onOpenMeta={onOpenMeta}
        onOpenExport={onOpenExport}
        onOpenAI={() => setAiOpen(o => !o)}
        aiOpen={aiOpen}
        versions={articleVersions}
        settings={settings}
        onTogglePublish={() => togglePublishById(article.id)}
        onSelectionChange={onSelectionChange}
      />
      {aiOpen && (
        <AIPanel
          open={aiOpen}
          onClose={() => setAiOpen(false)}
          onApply={(text) => onApplyAI(text, article.id)}
          onReplaceArticle={(md) => onReplaceArticle(md, article.id)}
          onReplaceSelection={onReplaceSelection}
          selectionText={selectionText}
          article={article}
          settings={settings}
          push={push}
        />
      )}
    </>
  )
}

interface ExportModalRouteProps {
  open: boolean
  articles: Article[]
  onClose: () => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

// ExportModal needs the *currently routed* article when opened from the
// editor top bar. The pathname check keeps us from showing it on routes
// where it doesn't make sense.
function ExportModalRoute({ open, articles, onClose, push }: ExportModalRouteProps) {
  const match = window.location.pathname.match(/\/editor\/([^/]+)/)
  const article = match ? articles.find(a => a.id === match[1]) || null : null
  return (
    <ExportModal
      open={open && !!article}
      article={article}
      onClose={onClose}
      push={push}
    />
  )
}
