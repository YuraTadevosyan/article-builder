import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from './Icon'
import { Kbd } from './ui/Kbd'
import type { Article } from '@/types'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  articles: Article[]
  onPickArticle: (id: string) => void
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

export function CommandPalette({ open, onClose, articles, onPickArticle, onNew, onAI, onExport, onMeta, setTheme }: CommandPaletteProps) {
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQ('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  const go = (path: string) => () => { navigate(path); onClose() }

  const cmds: Command[] = [
    { id: 'new', label: 'Create new article', group: 'Action', icon: 'plus', shortcut: '⌘N', run: onNew },
    { id: 'ai', label: 'Open AI assistant', group: 'Action', icon: 'ai', shortcut: '⌘/', run: onAI },
    { id: 'export', label: 'Export current article…', group: 'Action', icon: 'download', run: onExport },
    { id: 'meta', label: 'Edit metadata…', group: 'Action', icon: 'tag', run: onMeta },
    { id: 'go-dashboard', label: 'Go to dashboard', group: 'Navigate', icon: 'doc', run: go('/dashboard') },
    { id: 'go-history', label: 'Go to history', group: 'Navigate', icon: 'history', run: go('/history') },
    { id: 'go-settings', label: 'Go to settings', group: 'Navigate', icon: 'settings', run: go('/settings') },
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
      className="fade-in fixed inset-0 z-[95] flex items-start justify-center bg-black/40 pt-24"
      data-testid="command-palette"
      onClick={onClose}
    >
      <div
        className="fade-up flex max-h-[60vh] w-[580px] max-w-[92vw] flex-col overflow-hidden rounded-xl border border-border bg-background shadow-[var(--shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-border px-3.5 py-2.5">
          <Icon name="search" size={14} />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search commands, articles, settings…"
            className="flex-1 border-0 bg-transparent p-0 font-sans text-sm outline-none placeholder:text-muted-foreground"
            data-testid="command-palette-input"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div className="flex-1 overflow-y-auto px-1.5 py-2">
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="label px-2.5 py-1.5">{group}</div>
              {items.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  onClick={c.run}
                  data-testid={`palette-cmd-${c.id}`}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent px-3 py-2.5 text-left text-[13px] text-foreground/85 transition-colors hover:bg-secondary"
                >
                  <Icon name={c.icon} size={13} />
                  <span className="flex-1">{c.label}</span>
                  {c.sublabel && <span className="mono text-[10px] text-muted-foreground">{c.sublabel}</span>}
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
