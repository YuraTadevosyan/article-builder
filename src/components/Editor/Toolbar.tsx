import { useRef } from 'react'
import {
  Strikethrough,
  Code as InlineCode,
  Highlighter,
  Minus as Divider,
  Undo,
  Redo,
  Eraser,
} from 'lucide-react'
import { Icon } from '../Icon'
import type { Block, BlockType } from '@/types'

interface ToolbarProps {
  exec: (cmd: string, val?: string) => void
  setBlockType: (idx: number, type: BlockType) => void
  selBlock: number | null
  insertBlock: (idx: number, block: Block) => void
  blocks: Block[]
}

function Sep() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-border" />
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  // Visible cluster label — hidden below md to save horizontal space.
  return (
    <span className="label hidden shrink-0 px-1 text-[9px] text-muted-foreground/80 md:inline">
      {children}
    </span>
  )
}

interface ToolBtnProps {
  onClick: () => void
  title: string
  children: React.ReactNode
}

/*
 * Editor toolbar buttons MUST NOT steal focus from the contenteditable.
 *
 * If they do, the user's selection collapses on `mousedown` (before the
 * `click` fires), and `document.execCommand` / selection-based wrappers
 * (inline code, highlight) silently no-op. The fix is preventDefault on
 * mousedown — the button still receives the click event, but the active
 * element / selection in the editor is preserved.
 */
function ToolBtn({ onClick, title, children }: ToolBtnProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-8 w-9 shrink-0 cursor-pointer items-center justify-center rounded-md border border-transparent bg-transparent text-foreground/85 transition-colors hover:bg-card hover:text-foreground"
    >
      {children}
    </button>
  )
}

export function Toolbar({ exec, setBlockType, selBlock, insertBlock, blocks }: ToolbarProps) {
  const idx = selBlock ?? Math.max(0, blocks.length - 1)
  const fileRef = useRef<HTMLInputElement>(null)

  // Inline code wraps the current selection in <code>…</code>. execCommand has
  // no native "inlineCode" so we go through insertHTML on the selection.
  const wrapInlineCode = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) {
      // Nothing selected — leave a hint for the user.
      exec('insertHTML', '<code></code>')
      return
    }
    const text = sel.toString()
    exec('insertHTML', `<code>${text.replace(/[<>&]/g, c => c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;')}</code>`)
  }

  // Highlight wraps the selection in <mark>…</mark>.
  const wrapHighlight = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString()
    exec('insertHTML', `<mark>${text.replace(/[<>&]/g, c => c === '<' ? '&lt;' : c === '>' ? '&gt;' : '&amp;')}</mark>`)
  }

  // Image upload from the toolbar — reads the file as a data URL and inserts
  // a new img block. Mirrors the behavior of the in-block uploader so users
  // who already know what image they want can skip the empty-state.
  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f || !f.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result)
      const alt = f.name.replace(/\.[^.]+$/, '')
      insertBlock(idx, { type: 'img', src, alt })
    }
    reader.readAsDataURL(f)
  }

  return (
    <div
      data-testid="editor-toolbar"
      role="toolbar"
      aria-label="Formatting toolbar"
      className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-border bg-secondary px-3 py-1.5 md:px-4"
      style={{ minHeight: 44 }}
    >
      <GroupTitle>Text</GroupTitle>
      <ToolBtn onClick={() => setBlockType(idx, 'h1')} title="Heading 1"><Icon name="h1" size={14} /></ToolBtn>
      <ToolBtn onClick={() => setBlockType(idx, 'h2')} title="Heading 2"><Icon name="h2" size={14} /></ToolBtn>
      <ToolBtn onClick={() => setBlockType(idx, 'h3')} title="Heading 3"><Icon name="h3" size={14} /></ToolBtn>

      <Sep />

      <GroupTitle>Inline</GroupTitle>
      <ToolBtn onClick={() => exec('bold')} title="Bold (⌘B)"><Icon name="bold" size={14} /></ToolBtn>
      <ToolBtn onClick={() => exec('italic')} title="Italic (⌘I)"><Icon name="italic" size={14} /></ToolBtn>
      <ToolBtn onClick={() => exec('underline')} title="Underline (⌘U)"><Icon name="underline" size={14} /></ToolBtn>
      <ToolBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough size={14} /></ToolBtn>
      <ToolBtn onClick={wrapInlineCode} title="Inline code"><InlineCode size={14} /></ToolBtn>
      <ToolBtn onClick={wrapHighlight} title="Highlight"><Highlighter size={14} /></ToolBtn>

      <Sep />

      <GroupTitle>Block</GroupTitle>
      <ToolBtn onClick={() => setBlockType(idx, 'ul')} title="Bullet list"><Icon name="ul" size={14} /></ToolBtn>
      <ToolBtn onClick={() => setBlockType(idx, 'ol')} title="Numbered list"><Icon name="ol" size={14} /></ToolBtn>
      <ToolBtn onClick={() => setBlockType(idx, 'blockquote')} title="Blockquote"><Icon name="quote" size={14} /></ToolBtn>
      <ToolBtn onClick={() => setBlockType(idx, 'code')} title="Code block"><Icon name="code" size={14} /></ToolBtn>
      <ToolBtn onClick={() => insertBlock(idx, { type: 'hr' })} title="Horizontal rule"><Divider size={14} /></ToolBtn>

      <Sep />

      <GroupTitle>Insert</GroupTitle>
      <ToolBtn
        onClick={() => { const url = prompt('Link URL'); if (url) exec('createLink', url) }}
        title="Link (⌘K)"
      >
        <Icon name="link" size={14} />
      </ToolBtn>
      <ToolBtn
        onClick={() => fileRef.current?.click()}
        title="Upload image"
      >
        <Icon name="image" size={14} />
      </ToolBtn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />

      <Sep />

      <GroupTitle>History</GroupTitle>
      <ToolBtn onClick={() => exec('undo')} title="Undo (⌘Z)"><Undo size={14} /></ToolBtn>
      <ToolBtn onClick={() => exec('redo')} title="Redo (⌘⇧Z)"><Redo size={14} /></ToolBtn>
      <ToolBtn onClick={() => exec('removeFormat')} title="Clear formatting"><Eraser size={14} /></ToolBtn>

      <span className="flex-1 min-w-2" />

      <span className="mono hidden whitespace-nowrap text-[10px] text-muted-foreground md:inline">⌘B · ⌘I · ⌘K</span>
    </div>
  )
}
