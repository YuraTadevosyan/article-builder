import { Icon } from '../Icon'
import type { Toast } from '../../types'

interface ToastHostProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export function ToastHost({ toasts, onDismiss }: ToastHostProps) {
  return (
    <div
      style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 80, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}
      data-testid="toast-host"
    >
      {toasts.map(t => (
        <div
          key={t.id}
          className="toast"
          style={{
            pointerEvents: 'auto',
            background: 'var(--ink)',
            color: 'var(--paper)',
            padding: '10px 14px',
            fontSize: 12,
            fontFamily: 'var(--mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 240,
            borderLeft: `2px solid ${t.tone === 'success' ? 'var(--accent)' : t.tone === 'error' ? 'var(--red)' : 'var(--ink-3)'}`,
          }}
          data-testid="toast"
        >
          <Icon name={t.tone === 'success' ? 'check' : 'circle-dot'} size={12} />
          <span style={{ flex: 1 }}>{t.text}</span>
          <button
            onClick={() => onDismiss(t.id)}
            style={{ background: 'none', border: 0, color: 'var(--ink-4)', cursor: 'pointer', padding: 0 }}
          >
            <Icon name="close" size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
