import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Icon } from '../Icon'
import { Kbd } from '../ui/Kbd'
import { Status } from '../ui/Status'
import { Toolbar } from './Toolbar'
import { EditPane } from './EditPane'
import { PreviewPane } from './PreviewPane'
import { cn } from '@/lib/utils'
import type { Article, AppSettings, Block, BlockType, EditorSelection, Version } from '@/types'

interface EditorProps {
  article: Article
  onUpdate: (patch: Partial<Article>) => void
  onOpenMeta: () => void
  onOpenExport: () => void
  onOpenAI: () => void
  aiOpen: boolean
  versions: Version[]
  settings: AppSettings
  onTogglePublish: () => void
  onSelectionChange: (sel: EditorSelection) => void
}

type ViewMode = 'edit' | 'split' | 'preview'

const READING_WIDTHS = { narrow: 580, comfortable: 680, wide: 820 } as const

export function Editor({ article, onUpdate, onOpenMeta, onOpenExport, onOpenAI, aiOpen, versions, settings, onTogglePublish, onSelectionChange }: EditorProps) {
  const [view, setView] = useState<ViewMode>('split')
  const [savedAt, setSavedAt] = useState('just now')
  const [savingState, setSavingState] = useState<'saving' | 'saved'>('saved')
  const [selBlock, setSelBlock] = useState<number | null>(null)
  const [editorWidth, setEditorWidth] = useState(window.innerWidth)
  const dirtyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const onResize = () => setEditorWidth(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    // Track selections inside the editor region. We snapshot a clone of the
    // Range so AI replacement can restore it later.
    const capture = () => {
      const sel = window.getSelection()
      if (!sel || sel.rangeCount === 0) {
        onSelectionChange({ text: '', range: null })
        return
      }
      const range = sel.getRangeAt(0)
      const container = range.commonAncestorContainer
      const el = container.nodeType === 1 ? (container as Element) : container.parentElement
      const inEditor = el?.closest('[data-editor-region]')
      if (!inEditor || sel.isCollapsed) {
        onSelectionChange({ text: '', range: null })
        return
      }
      onSelectionChange({ text: sel.toString(), range: range.cloneRange() })
    }
    document.addEventListener('selectionchange', capture)
    return () => document.removeEventListener('selectionchange', capture)
  }, [onSelectionChange])

  const availWidth = editorWidth - 232 - (aiOpen ? 340 : 0)
  const splitDisabled = availWidth < 760
  const effectiveView = view === 'split' && splitDisabled ? 'edit' : view

  const markDirty = useCallback(() => {
    setSavingState('saving')
    if (dirtyTimer.current) clearTimeout(dirtyTimer.current)
    dirtyTimer.current = setTimeout(() => {
      setSavingState('saved')
      setSavedAt('just now')
      onUpdate({ updatedAt: new Date().toISOString() })
    }, settings.autoSaveDelayMs)
  }, [onUpdate, settings.autoSaveDelayMs])

  const updateBlock = (idx: number, patch: Partial<Block>) => {
    const blocks = [...article.blocks]
    blocks[idx] = { ...blocks[idx], ...patch }
    onUpdate({ blocks })
    markDirty()
  }

  const insertBlock = (idx: number, block: Block) => {
    const blocks = [...article.blocks]
    blocks.splice(idx + 1, 0, block)
    onUpdate({ blocks })
    markDirty()
  }

  const deleteBlock = (idx: number) => {
    if (article.blocks.length <= 1) return
    const blocks = article.blocks.filter((_, i) => i !== idx)
    onUpdate({ blocks })
    markDirty()
  }

  const setBlockType = (idx: number, type: BlockType) => {
    const b = article.blocks[idx]
    let next: Block = { ...b, type }
    if (type === 'ul' || type === 'ol') {
      const items = b.items || (b.text ? [b.text] : ['New item'])
      next = { ...next, items }
      delete next.text
    } else if (b.type === 'ul' || b.type === 'ol') {
      next = { ...next, text: (b.items || []).join(' · ') }
      delete next.items
    }
    // hr and img don't carry text/items — strip them so stale content
    // doesn't render once the block changes shape.
    if (type === 'hr') {
      delete next.text; delete next.items; delete next.src; delete next.alt
    }
    if (type === 'img' && b.type !== 'img') {
      delete next.text; delete next.items
    }
    updateBlock(idx, next)
  }

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    markDirty()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (!meta) return
      const t = e.target as HTMLElement
      const isInEditor = t?.closest?.('[data-editor-region]')
      if (!isInEditor) return
      if (e.key.toLowerCase() === 'b') { e.preventDefault(); exec('bold') }
      else if (e.key.toLowerCase() === 'i') { e.preventDefault(); exec('italic') }
      else if (e.key.toLowerCase() === 'u') { e.preventDefault(); exec('underline') }
      else if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const url = prompt('Link URL')
        if (url) exec('createLink', url)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // exec uses document.execCommand which doesn't depend on state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const wordCount = useMemo(() => {
    const text = article.blocks.map(b => {
      if (b.items) return b.items.join(' ')
      return (b.text || '').replace(/<[^>]+>/g, ' ')
    }).join(' ')
    return text.trim().split(/\s+/).filter(Boolean).length
  }, [article.blocks])

  const readMin = Math.max(1, Math.round(wordCount / 220))

  return (
    <div data-editor-region className="flex h-full min-w-0 flex-1 flex-col">
      {/* Top bar — wraps to two rows on narrow screens. Identifying info on the
          left, status/view/actions on the right. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border px-3 py-2 md:px-4 md:py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="label hidden md:inline">DOC</span>
          <span className="mono hidden max-w-[100px] truncate text-[11px] text-muted-foreground md:inline">/ {article.id}</span>
          <span className="hidden h-3.5 w-px bg-border md:block" />
          <button
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-transparent bg-transparent px-2 text-xs text-foreground/85 transition-colors hover:bg-secondary hover:text-foreground"
            onClick={onOpenMeta}
            data-testid="metadata-btn"
          >
            <Icon name="tag" size={12} aria-hidden="true" />
            Metadata
          </button>
          <Status value={article.status} />
        </div>

        {/* Save indicator — hidden on mobile to save space */}
        <div className="mono hidden items-center gap-1.5 text-[10px] text-muted-foreground md:flex" aria-live="polite">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              savingState === 'saving' ? 'bg-accent' : 'bg-[var(--green)]'
            )}
            aria-hidden="true"
          />
          {savingState === 'saving' ? 'saving…' : `saved · ${savedAt}`}
        </div>

        {/* View toggle — Split is hidden on small screens (it needs the room) */}
        <div className="flex shrink-0 overflow-hidden rounded-md border border-border" role="group" aria-label="View mode">
          {([
            { id: 'edit' as ViewMode, icon: 'edit', label: 'Edit', mobile: true },
            { id: 'split' as ViewMode, icon: 'split', label: 'Split', mobile: false, disabled: splitDisabled },
            { id: 'preview' as ViewMode, icon: 'eye', label: 'Preview', mobile: true },
          ]).map((v, i, arr) => (
            <button
              key={v.id}
              onClick={() => !v.disabled && setView(v.id)}
              disabled={v.disabled}
              data-testid={`view-${v.id}`}
              aria-label={`${v.label} view`}
              aria-pressed={effectiveView === v.id}
              title={v.disabled ? 'Split view needs more room' : v.label}
              className={cn(
                'inline-flex h-8 items-center gap-1.5 px-2.5 font-mono text-[11px] transition-colors',
                i < arr.length - 1 && 'border-r border-r-border',
                effectiveView === v.id ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85 hover:bg-secondary',
                v.disabled && 'cursor-not-allowed opacity-40',
                !v.mobile && 'hidden md:inline-flex'
              )}
            >
              <Icon name={v.icon} size={12} aria-hidden="true" />
              <span className="hidden md:inline">{v.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onOpenAI}
          data-active={aiOpen}
          data-testid="ai-toggle-btn"
          aria-label="Toggle AI assistant"
          aria-pressed={aiOpen}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border px-2.5 font-mono text-[11px] transition-all',
            aiOpen ? 'bg-primary text-primary-foreground shadow-[var(--shadow-sm)]' : 'bg-card text-foreground/85 hover:border-foreground hover:bg-secondary hover:text-foreground'
          )}
        >
          <Icon name="ai" size={12} aria-hidden="true" />
          <span className="hidden md:inline">AI</span>
        </button>
        <button
          onClick={onOpenExport}
          data-testid="export-btn"
          aria-label="Export article"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 font-mono text-[11px] text-foreground/85 transition-all hover:border-foreground hover:bg-secondary hover:text-foreground"
        >
          <Icon name="download" size={12} aria-hidden="true" />
          <span className="hidden md:inline">Export</span>
        </button>
        <button
          onClick={onTogglePublish}
          data-testid="publish-btn"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-primary bg-primary px-3 font-mono text-[11px] text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:bg-accent hover:text-accent-foreground"
        >
          {article.status === 'Published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <Toolbar exec={exec} setBlockType={setBlockType} selBlock={selBlock} insertBlock={insertBlock} blocks={article.blocks} />

      {/* Content area */}
      <div
        className={cn(
          'grid min-h-0 flex-1 overflow-hidden',
          effectiveView === 'split' ? 'grid-cols-2' : 'grid-cols-1'
        )}
      >
        {(effectiveView === 'edit' || effectiveView === 'split') && (
          <EditPane
            article={article}
            onUpdate={onUpdate}
            onUpdateBlock={updateBlock}
            onInsertBlock={insertBlock}
            onDeleteBlock={deleteBlock}
            onSetBlockType={setBlockType}
            markDirty={markDirty}
            setSelBlock={setSelBlock}
            wordCount={wordCount}
            readMin={readMin}
            versions={versions}
            maxWidth={READING_WIDTHS[settings.readingWidth]}
            spellCheck={settings.spellCheck}
          />
        )}
        {(effectiveView === 'split' || effectiveView === 'preview') && (
          <PreviewPane article={article} wordCount={wordCount} readMin={readMin} bordered={effectiveView === 'split'} maxWidth={READING_WIDTHS[settings.readingWidth]} />
        )}
      </div>

      {/* Keyboard hint — desktop only, doesn't crowd mobile UI */}
      <div className="pointer-events-none absolute bottom-2 left-[270px] hidden gap-2 md:flex">
        <Kbd>⌘K</Kbd>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>palette</span>
      </div>
    </div>
  )
}
