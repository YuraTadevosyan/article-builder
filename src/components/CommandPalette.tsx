import { useState, useEffect, useRef } from 'react'
import { Icon } from './Icon'
import { Kbd } from './ui/Kbd'
import type { Article, Route } from '../types'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  articles: Article[]
  onPickArticle: (id: string) => void
  onRoute: (r: Route) => void
  onNew: () => void
  onAI: () => void
  onExport: () => void
  onMeta: () => void
  setTheme: (t: string) => void
}

interface Command {
  id: string
  label: string
  group: string
  icon: string
  sublabel?: string
  shortcut?: string
  run: () => void
}

export function CommandPalette({ open, onClose, articles, onPickArticle, onRoute, onNew, onAI, onExport, onMeta, setTheme }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const cmds: Command[] = [
    { id: 'new', label: 'Create new article', group: 'Action', icon: 'plus', shortcut: '⌘N', run: onNew },
    { id: 'ai', label: 'Open AI assistant', group: 'Action', icon: 'ai', shortcut: '⌘/', run: onAI },
    { id: 'export', label: 'Export current article…', group: 'Action', icon: 'download', run: onExport },
    { id: 'meta', label: 'Edit metadata…', group: 'Action', icon: 'tag', run: onMeta },
    { id: 'go-dashboard', label: 'Go to dashboard', group: 'Navigate', icon: 'doc', run: () => onRoute('dashboard') },
    { id: 'go-editor', label: 'Go to editor', group: 'Navigate', icon: 'edit', run: () => onRoute('editor') },
    { id: 'go-history', label: 'Go to history', group: 'Navigate', icon: 'history', run: () => onRoute('history') },
    { id: 'go-settings', label: 'Go to settings', group: 'Navigate', icon: 'settings', run: () => onRoute('settings') },
    { id: 'th-light', label: 'Theme: Light', group: 'Theme', icon: 'sun', run: () => setTheme('light') },
    { id: 'th-dark', label: 'Theme: Dark', group: 'Theme', icon: 'moon', run: () => setTheme('dark') },
    ...articles.map(a => ({ id: a.id, label: a.title, group: 'Articles', icon: 'doc', sublabel: a.status, run: () => onPickArticle(a.id) })),
  ]

  const filtered = q ? cmds.filter(c => (c.label + (c.sublabel || '')).toLowerCase().includes(q.toLowerCase())) : cmds
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c)
    return acc
  }, {})

  return (
    <div
      className="fade-in"
      data-testid="command-palette"
      style={{ position: 'fixed', inset: 0, zIndex: 95, background: 'rgba(13,13,12,0.4)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 100 }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--paper)', border: '1px solid var(--ink)', width: 580, maxWidth: '92vw', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--rule-soft)', gap: 10 }}>
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search commands, articles, settings…"
            style={{ flex: 1, border: 0, padding: 0, fontSize: 14, fontFamily: 'var(--sans)', outline: 'none' }}
            data-testid="command-palette-input"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px' }}>
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="label" style={{ padding: '6px 10px' }}>{group}</div>
              {items.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  onClick={c.run}
                  data-testid={`palette-cmd-${c.id}`}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', border: 0, background: 'transparent',
                    cursor: 'pointer', textAlign: 'left', color: 'var(--ink-2)', fontSize: 13,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--paper-2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Icon name={c.icon} size={13} />
                  <span style={{ flex: 1 }}>{c.label}</span>
                  {c.sublabel && <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{c.sublabel}</span>}
                  {c.shortcut && <Kbd>{c.shortcut}</Kbd>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
