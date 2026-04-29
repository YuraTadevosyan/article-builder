import { useState, useRef } from 'react'
import { Icon } from '../Icon'
import { Menu } from '../ui/Menu'
import type { Block, BlockType } from '../../types'

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
  width: 16, height: 16, border: 0, background: 'transparent',
  color: 'var(--ink-4)', cursor: 'pointer', display: 'flex',
  alignItems: 'center', justifyContent: 'center', padding: 0,
}

export function BlockRow({ block, spellCheck, onChange, onDelete, onInsert, onSetType, onFocus }: BlockRowProps) {
  const [hover, setHover] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    onChange({ text: (e.currentTarget as HTMLElement).innerHTML })
  }

  const editableProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    spellCheck,
    onInput: handleInput,
    onFocus,
    dangerouslySetInnerHTML: { __html: block.text || '' },
    ref: ref as React.RefObject<HTMLElement>,
  }

  const renderEditable = () => {
    switch (block.type) {
      case 'h1': return <h1 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'h2': return <h2 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'h3': return <h3 {...editableProps} ref={ref as React.RefObject<HTMLHeadingElement>} />
      case 'blockquote': return <blockquote {...editableProps} ref={ref as React.RefObject<HTMLQuoteElement>} />
      case 'code': return <pre {...editableProps} ref={ref as React.RefObject<HTMLPreElement>} />
      case 'img': return (
        <div className="imgph" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', letterSpacing: '0.08em' }}>IMG / UPLOAD OR PASTE URL</span>
        </div>
      )
      case 'ul':
      case 'ol': {
        const ListTag = block.type === 'ul' ? 'ul' : 'ol'
        const items = block.items || []
        return (
          <ListTag>
            {items.map((it, i) => (
              <li
                key={i}
                contentEditable
                suppressContentEditableWarning
                spellCheck={spellCheck}
                onInput={(e) => {
                  const next = [...items]
                  next[i] = (e.currentTarget as HTMLElement).innerText
                  onChange({ items: next })
                }}
                onFocus={onFocus}
                dangerouslySetInnerHTML={{ __html: it }}
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
        <button onClick={() => onInsert({ type: 'p', text: '' })} title="Add below" style={iconBtnStyle}>
          <Icon name="plus" size={11} />
        </button>
        <Menu
          align="left"
          trigger={<button title="More" style={iconBtnStyle}><Icon name="more" size={11} /></button>}
          items={[
            { label: 'Heading 1', icon: 'h1', onClick: () => onSetType('h1') },
            { label: 'Heading 2', icon: 'h2', onClick: () => onSetType('h2') },
            { label: 'Paragraph', icon: 'doc', onClick: () => onSetType('p') },
            { label: 'Bullet list', icon: 'ul', onClick: () => onSetType('ul') },
            { label: 'Code block', icon: 'code', onClick: () => onSetType('code') },
            { label: 'Quote', icon: 'quote', onClick: () => onSetType('blockquote') },
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
