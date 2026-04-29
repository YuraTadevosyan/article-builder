import { Icon } from '../Icon'
import type { Block, BlockType } from '../../types'

interface ToolbarProps {
  exec: (cmd: string, val?: string) => void
  setBlockType: (idx: number, type: BlockType) => void
  selBlock: number | null
  insertBlock: (idx: number, block: Block) => void
  blocks: Block[]
}

function Sep() {
  return <span style={{ width: 1, height: 16, background: 'var(--rule-soft)', margin: '0 4px' }} />
}

function ToolBtn({ icon, onClick, title }: { icon: string; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 26, padding: 0,
        border: '1px solid transparent', background: 'transparent', color: 'var(--ink-2)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <Icon name={icon} size={13} />
    </button>
  )
}

export function Toolbar({ exec, setBlockType, selBlock, insertBlock, blocks }: ToolbarProps) {
  const idx = selBlock ?? Math.max(0, blocks.length - 1)

  return (
    <div
      data-testid="editor-toolbar"
      style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', padding: '6px 14px', borderBottom: '1px solid var(--rule-soft)', gap: 2, rowGap: 4, minHeight: 38, flexShrink: 0, background: 'var(--paper-2)' }}
    >
      <span className="label" style={{ marginRight: 6 }}>Format</span>
      <ToolBtn icon="h1" onClick={() => setBlockType(idx, 'h1')} title="Heading 1" />
      <ToolBtn icon="h2" onClick={() => setBlockType(idx, 'h2')} title="Heading 2" />
      <ToolBtn icon="h3" onClick={() => setBlockType(idx, 'h3')} title="Heading 3" />
      <Sep />
      <ToolBtn icon="bold" onClick={() => exec('bold')} title="Bold (⌘B)" />
      <ToolBtn icon="italic" onClick={() => exec('italic')} title="Italic (⌘I)" />
      <ToolBtn icon="underline" onClick={() => exec('underline')} title="Underline (⌘U)" />
      <Sep />
      <ToolBtn icon="ul" onClick={() => setBlockType(idx, 'ul')} title="Bullet list" />
      <ToolBtn icon="ol" onClick={() => setBlockType(idx, 'ol')} title="Numbered list" />
      <ToolBtn icon="quote" onClick={() => setBlockType(idx, 'blockquote')} title="Blockquote" />
      <ToolBtn icon="code" onClick={() => setBlockType(idx, 'code')} title="Code block" />
      <Sep />
      <ToolBtn icon="link" onClick={() => { const url = prompt('Link URL'); if (url) exec('createLink', url) }} title="Link (⌘K)" />
      <ToolBtn icon="image" onClick={() => insertBlock(idx, { type: 'img' })} title="Insert image" />
      <span style={{ flex: 1, minWidth: 8 }} />
      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', whiteSpace: 'nowrap' }}>⌘B · ⌘I · ⌘K</span>
    </div>
  )
}
