import { useEffect, type ReactNode } from 'react'
import { Icon } from '../Icon'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  width?: number
}

export function Modal({ open, onClose, title, children, width = 520 }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fade-in"
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(13,13,12,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        className="fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--paper)', border: '1px solid var(--ink)', width, maxWidth: '92vw', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
        data-testid="modal"
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--rule-soft)' }}>
          <div className="label">{title}</div>
          <button className="btn btn-ghost" onClick={onClose} style={{ height: 22, padding: '0 6px' }}>
            <Icon name="close" size={12} />
          </button>
        </div>
        <div style={{ overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  )
}
