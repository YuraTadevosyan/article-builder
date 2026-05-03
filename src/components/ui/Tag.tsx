import { Icon } from '../Icon'
import { cn } from '@/lib/utils'

interface TagProps {
  label: string
  active?: boolean
  onClick?: () => void
  removable?: boolean
  onRemove?: () => void
  size?: 'sm' | 'md'
}

export function Tag({ label, active, onClick, removable, onRemove, size = 'sm' }: TagProps) {
  return (
    <span
      onClick={onClick}
      data-testid={`tag-${label}`}
      className={cn(
        'inline-flex select-none items-center gap-1 rounded-full border font-mono uppercase tracking-wider transition-all',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]',
        active
          ? 'border-accent bg-accent text-accent-foreground shadow-[var(--shadow-sm)]'
          : 'border-border bg-card text-foreground/85 hover:border-foreground hover:bg-secondary',
        onClick && 'cursor-pointer'
      )}
    >
      <span className={active ? 'text-accent-foreground/80' : 'text-muted-foreground'}>#</span>
      {label}
      {removable && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.() }}
          aria-label={`Remove ${label} tag`}
          className="ml-0.5 flex border-0 bg-transparent p-0 text-inherit"
        >
          <Icon name="close" size={9} />
        </button>
      )}
    </span>
  )
}
