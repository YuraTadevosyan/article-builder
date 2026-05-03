import { useState, useRef, useEffect } from 'react'
import { Image as ImageIcon, Upload, X } from 'lucide-react'
import { Icon } from '../Icon'
import { Menu } from '../ui/Menu'
import { cn } from '@/lib/utils'
import type { Block, BlockType } from '@/types'

interface BlockRowProps {
  block: Block
  spellCheck: boolean
  onChange: (patch: Partial<Block>) => void
  onDelete: () => void
  onInsert: (b: Block) => void
  onSetType: (t: BlockType) => void
  onFocus: () => void
}

const iconBtnStyle: React.CSSProperties = {
  width: 18, height: 18, border: 0, background: 'transparent',
  color: 'var(--ink-4)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0, borderRadius: 4,
}

export function BlockRow({ block, spellCheck, onChange, onDelete, onInsert, onSetType, onFocus }: BlockRowProps) {
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onChange({ text: (e.currentTarget as HTMLElement).innerHTML })
  }

  /*
   * Cursor-jump fix.
   *
   * If we let React drive the contenteditable's innerHTML via
   * `dangerouslySetInnerHTML`, every keystroke goes:
   *   onInput → onChange → parent setState → re-render → innerHTML reset
   * which collapses the user's caret to the start of the element.
   *
   * Instead we render the contenteditable empty, then sync `innerHTML`
   * imperatively in a useEffect whenever `block.text` changes from outside.
   * During normal typing the DOM already matches what we just wrote to
   * state, so the comparison short-circuits and the caret stays put.
   */
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const next = block.text || ''
    if (el.innerHTML !== next) el.innerHTML = next
  }, [block.text])

  const editableProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    spellCheck,
    onInput: handleInput,
    onFocus,
    ref: ref as React.RefObject<HTMLElement>,
  }

  const renderEditable = () => {
    switch (block.type) {
      case 'h1': return <h1 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'h2': return <h2 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'h3': return <h3 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'blockquote': return <blockquote {...editableProps} ref={ref as React.RefObject<HTMLQuoteElement>} />
      case 'code': return <pre {...editableProps} ref={ref as React.RefObject<HTMLPreElement>} />
      case 'hr': return <hr className="my-6 border-0 border-t border-border" />
      case 'img': return <ImageBlock block={block} onChange={onChange} />
      case 'ul':
      case 'ol': {
        const ListTag = block.type === 'ul' ? 'ul' : 'ol'
        const items = block.items || []
        return (
          <ListTag>
            {items.map((it, i) => (
              <ListItem
                key={i}
                html={it}
                spellCheck={spellCheck}
                onFocus={onFocus}
                onInput={(text) => {
                  const next = [...items]
                  next[i] = text
                  onChange({ items: next })
                }}
              />
            ))}
          </ListTag>
        )
      }
      default: return <p {...editableProps} ref={ref as React.RefObject<HTMLParagraphElement>} />
    }
  }

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', marginLeft: -36 }}
    >
      <div style={{
        position: 'absolute', left: 0, top: 6, width: 32,
        display: 'flex', alignItems: 'flex-start', gap: 2,
        opacity: hover ? 1 : 0, transition: 'opacity 120ms',
      }}>
        <button onClick={() => onInsert({ type: 'p', text: '' })} aria-label="Insert paragraph below" title="Add below" style={iconBtnStyle}>
          <Icon name="plus" size={11} />
        </button>
        <Menu
          align="left"
          trigger={<button aria-label="Block options" title="More" style={iconBtnStyle}><Icon name="more" size={11} /></button>}
          items={[
            { label: 'Heading 1', icon: 'h1', onClick: () => onSetType('h1') },
            { label: 'Heading 2', icon: 'h2', onClick: () => onSetType('h2') },
            { label: 'Paragraph', icon: 'doc', onClick: () => onSetType('p') },
            { label: 'Bullet list', icon: 'ul', onClick: () => onSetType('ul') },
            { label: 'Code block', icon: 'code', onClick: () => onSetType('code') },
            { label: 'Quote', icon: 'quote', onClick: () => onSetType('blockquote') },
            { label: 'Image', icon: 'image', onClick: () => onSetType('img') },
            { label: 'Divider', icon: 'minus', onClick: () => onSetType('hr') },
            { divider: true },
            { label: 'Delete block', icon: 'trash', danger: true, onClick: onDelete },
          ]}
        />
      </div>
      <div style={{ paddingLeft: 36 }}>
        {renderEditable()}
      </div>
    </div>
  )
}

/**
 * Single contenteditable <li>. Same imperative-sync pattern as the block-level
 * editable so user typing doesn't collapse the caret. `innerText` is used on
 * input to keep list items as plain text — they round-trip cleanly.
 */
function ListItem({ html, spellCheck, onInput, onFocus }: { html: string; spellCheck: boolean; onInput: (text: string) => void; onFocus: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.innerHTML !== html) el.innerHTML = html
  }, [html])
  return (
    <li
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={spellCheck}
      onInput={(e) => onInput((e.currentTarget as HTMLElement).innerText)}
      onFocus={onFocus}
    />
  )
}

interface ImageBlockProps {
  block: Block
  onChange: (patch: Partial<Block>) => void
}

/**
 * Image block with three states:
 *   - Empty: drag-and-drop zone with file picker + URL paste
 *   - Loading: brief shimmer while FileReader resolves the data URL
 *   - Populated: <img> with alt-text input + replace + remove
 *
 * Files are read into data URLs via FileReader so they round-trip without a
 * backend. When persistence lands, swap the file handler for an upload call
 * and store the returned URL in `src`.
 */
function ImageBlock({ block, onChange }: ImageBlockProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('That file is not an image.')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => onChange({ src: String(reader.result), alt: block.alt ?? file.name.replace(/\.[^.]+$/, '') })
    reader.onerror = () => setError('Could not read the file.')
    reader.readAsDataURL(file)
  }

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
    // reset so picking the same file twice still fires onChange
    e.target.value = ''
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  const commitUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    if (!/^https?:\/\//.test(url) && !url.startsWith('data:')) {
      setError('URL must start with http(s):// or data:')
      return
    }
    setError(null)
    onChange({ src: url })
    setUrlInput('')
  }

  // Populated state — show the image with edit affordances.
  if (block.src) {
    return (
      <figure className="my-4 flex flex-col gap-2">
        <div className="relative overflow-hidden rounded-lg border border-border bg-secondary">
          <img
            src={block.src}
            alt={block.alt || ''}
            className="block w-full"
            onError={() => setError('The image failed to load.')}
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label="Replace image"
              title="Replace image"
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background/90 px-2.5 font-mono text-[11px] text-foreground/85 backdrop-blur-sm transition-colors hover:bg-background hover:text-foreground"
            >
              <Upload size={12} />
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange({ src: undefined, alt: undefined })}
              aria-label="Remove image"
              title="Remove image"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background/90 text-muted-foreground backdrop-blur-sm transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <input
          type="text"
          value={block.alt || ''}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Alt text — describe the image for screen readers"
          aria-label="Image alt text"
          className="h-8 w-full rounded-md border border-input bg-transparent px-3 font-sans text-[12px] italic text-foreground/80 transition-colors focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
        {error && <div className="text-[12px] text-destructive">{error}</div>}
      </figure>
    )
  }

  // Empty state — drop zone + URL input.
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'my-4 flex flex-col items-stretch gap-3 rounded-lg border-2 border-dashed bg-secondary/40 p-5 transition-colors',
        dragOver ? 'border-accent bg-accent-soft/40' : 'border-border'
      )}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-card text-accent shadow-[var(--shadow-sm)]">
          <ImageIcon size={18} />
        </div>
        <div className="font-serif text-base font-semibold text-foreground">Add an image</div>
        <div className="text-[12px] text-muted-foreground">Drag and drop, paste a URL, or click to browse.</div>
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-9 items-center gap-2 rounded-md border border-primary bg-primary px-4 font-mono text-xs text-primary-foreground shadow-[var(--shadow-sm)] transition-all hover:bg-accent hover:text-accent-foreground"
        >
          <Upload size={13} />
          Upload from device
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickFile} />
      </div>

      <div className="flex items-center gap-2">
        <span className="h-px flex-1 bg-border" />
        <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground">or paste a url</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <div className="flex gap-2">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitUrl() } }}
          placeholder="https://example.com/image.jpg"
          aria-label="Image URL"
          className="h-9 flex-1 rounded-md border border-input bg-background px-3 font-mono text-[12px] text-foreground transition-colors focus-visible:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        />
        <button
          type="button"
          onClick={commitUrl}
          disabled={!urlInput.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border bg-card px-3 font-mono text-[11px] text-foreground/85 transition-colors hover:border-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          Use URL
        </button>
      </div>

      {error && <div className="text-center text-[12px] text-destructive">{error}</div>}
    </div>
  )
}
