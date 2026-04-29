import { useState, useRef, useEffect, type ReactNode } from 'react'
import { Icon } from '../Icon'

interface MenuItem {
  label?: string
  icon?: string
  onClick?: () => void
  shortcut?: string
  danger?: boolean
  divider?: boolean
}

interface MenuProps {
  trigger: ReactNode
  items: MenuItem[]
  align?: 'left' | 'right'
}

export function Menu({ trigger, items, align = 'right' }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <span onClick={() => setOpen(o => !o)}>{trigger}</span>
      {open && (
        <div
          className="fade-up"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            [align]: 0,
            zIndex: 30,
            background: 'var(--paper)',
            border: '1px solid var(--ink)',
            minWidth: 160,
            padding: 4,
            boxShadow: '0 4px 0 rgba(13,13,12,0.06)',
          }}
        >
          {items.map((it, i) =>
            it.divider ? (
              <div key={i} style={{ height: 1, background: 'var(--rule-soft)', margin: '4px 0' }} />
            ) : (
              <button
                key={i}
                onClick={() => { it.onClick?.(); setOpen(false) }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 8px',
                  background: 'transparent',
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  color: it.danger ? 'var(--red)' : 'var(--ink-2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {it.icon && <Icon name={it.icon} size={12} />}
                <span style={{ flex: 1 }}>{it.label}</span>
                {it.shortcut && <span className="mono" style={{ color: 'var(--ink-4)', fontSize: 10 }}>{it.shortcut}</span>}
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
