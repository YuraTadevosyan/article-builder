import { Icon } from '../Icon'
import { cn } from '@/lib/utils'
import type { Toast } from '@/types'

interface ToastHostProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[80] flex flex-col gap-2"
      data-testid="toast-host"
      aria-live="polite"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          data-testid="toast"
          className={cn(
            'toast pointer-events-auto flex min-w-[240px] items-center gap-2.5 rounded-lg border-l-[3px] bg-foreground px-3.5 py-3 font-mono text-xs text-background shadow-[var(--shadow-md)]',
            t.tone === 'success' && 'border-l-[var(--accent)]',
            t.tone === 'error' && 'border-l-[var(--red)]',
            t.tone === 'default' && 'border-l-[var(--ink-3)]'
          )}
        >
          <Icon name={t.tone === 'success' ? 'check' : 'circle-dot'} size={13} aria-hidden="true" />
          <span className="flex-1">{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss notification"
            className="flex h-6 w-6 items-center justify-center rounded-md text-background/60 transition-colors hover:bg-background/10 hover:text-background"
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
