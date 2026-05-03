import { cn } from '@/lib/utils'

interface StatusProps {
  value: string
}

export function Status({ value }: StatusProps) {
  const isPub = value === 'Published'
  return (
    <span
      data-testid="status-pill"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
        isPub ? 'border-[var(--green)]/30 text-[var(--green)]' : 'border-border text-muted-foreground'
      )}
    >
      <span
        className={cn(
          'inline-block h-1.5 w-1.5 rounded-full',
          isPub ? 'bg-[var(--green)]' : 'bg-muted-foreground'
        )}
      />
      {value}
    </span>
  )
}
