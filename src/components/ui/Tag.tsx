import { Icon } from '../Icon'

interface TagProps {
  label: string
  active?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function Tag({ label, active, onClick, removable, onRemove, size = 'sm' }: TagProps) {
  const padX = size === 'sm' ? 6 : 8
  const padY = size === 'sm' ? 2 : 3

  return (
    <span
      onClick={onClick}
      data-testid={`tag-${label}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: `${padY}px ${padX}px`,
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        border: `1px solid ${active ? 'var(--ink)' : 'var(--rule-soft)'}`,
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink-2)',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        transition: 'all 120ms',
      }}
    >
      <span style={{ color: active ? 'var(--accent)' : 'var(--ink-4)' }}>#</span>
      {label}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          style={{ background: 'none', border: 0, padding: 0, marginLeft: 2, color: 'inherit', cursor: 'pointer', display: 'flex' }}
        >
          <Icon name="close" size={9} />
        </button>
      )}
    </span>
  )
}
