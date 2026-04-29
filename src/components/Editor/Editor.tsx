import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Icon } from '../Icon'
import { Kbd } from '../ui/Kbd'
import { Status } from '../ui/Status'
import { Toolbar } from './Toolbar'
import { EditPane } from './EditPane'
import { PreviewPane } from './PreviewPane'
import type { Article, AppSettings, Block, BlockType, EditorSelection, Version } from '../../types'

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
    <div data-editor-region style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '8px 14px', borderBottom: '1px solid var(--rule-soft)', gap: 8, minHeight: 48, flexShrink: 0, rowGap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flexShrink: 1 }}>
          <span className="label">DOC</span>
          <span className="mono" style={{ fontSize: 11, color: 'var(--ink-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 90 }}>/ {article.id}</span>
          <span style={{ width: 1, height: 14, background: 'var(--rule-soft)' }} />
          <button className="btn btn-ghost" onClick={onOpenMeta} style={{ height: 24, padding: '0 8px', fontSize: 11 }} data-testid="metadata-btn">
            <Icon name="tag" size={11} />
            Metadata
          </button>
          <Status value={article.status} />
        </div>

        <span style={{ flex: 1, minWidth: 8 }} />

        {/* Save indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)', flexShrink: 0 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: savingState === 'saving' ? 'var(--accent)' : 'var(--green)' }} />
          {savingState === 'saving' ? 'saving…' : `saved · ${savedAt}`}
        </div>
        <span style={{ width: 1, height: 14, background: 'var(--rule-soft)' }} />

        {/* View toggle */}
        <div style={{ display: 'flex', border: '1px solid var(--rule-soft)', flexShrink: 0 }}>
          {([
            { id: 'edit' as ViewMode, icon: 'edit', label: 'Edit' },
            { id: 'split' as ViewMode, icon: 'split', label: 'Split', disabled: splitDisabled },
            { id: 'preview' as ViewMode, icon: 'eye', label: 'Preview' },
          ]).map(v => (
            <button
              key={v.id}
              onClick={() => !v.disabled && setView(v.id)}
              title={v.disabled ? 'Split view needs more room' : v.label}
              disabled={v.disabled}
              data-testid={`view-${v.id}`}
              style={{
                padding: '5px 8px', border: 0,
                borderRight: v.id !== 'preview' ? '1px solid var(--rule-soft)' : 0,
                background: effectiveView === v.id ? 'var(--ink)' : 'transparent',
                color: v.disabled ? 'var(--ink-4)' : effectiveView === v.id ? 'var(--paper)' : 'var(--ink-2)',
                cursor: v.disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                fontFamily: 'var(--mono)', fontSize: 10, height: 24,
                opacity: v.disabled ? 0.5 : 1,
              }}
            >
              <Icon name={v.icon} size={11} />
              {v.label}
            </button>
          ))}
        </div>

        <button className="btn" onClick={onOpenAI} data-active={aiOpen} style={{ flexShrink: 0 }} data-testid="ai-toggle-btn">
          <Icon name="ai" size={12} />
          AI
        </button>
        <button className="btn" onClick={onOpenExport} style={{ flexShrink: 0 }} data-testid="export-btn">
          <Icon name="download" size={12} />
          Export
        </button>
        <button
          className="btn btn-primary"
          style={{ flexShrink: 0 }}
          data-testid="publish-btn"
          onClick={onTogglePublish}
        >
          {article.status === 'Published' ? 'Unpublish' : 'Publish'}
        </button>
      </div>

      <Toolbar exec={exec} setBlockType={setBlockType} selBlock={selBlock} insertBlock={insertBlock} blocks={article.blocks} />

      {/* Content area */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: effectiveView === 'split' ? '1fr 1fr' : '1fr', minHeight: 0, overflow: 'hidden' }}>
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

      {/* Keyboard hint */}
      <div style={{ position: 'absolute', bottom: 8, left: 240, display: 'flex', gap: 8, pointerEvents: 'none' }}>
        <Kbd>⌘K</Kbd>
        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>palette</span>
      </div>
    </div>
  )
}
