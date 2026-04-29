import type { ReactNode } from 'react'

interface KbdProps {
  children: ReactNode
}

export function Kbd({ children }: KbdProps) {
  return (
    <span
      style={{
        fontFamily: 'var(--mono)',
        fontSize: 10,
        padding: '1px 5px',
        border: '1px solid var(--rule-soft)',
        color: 'var(--ink-3)',
        background: 'var(--paper-2)',
        lineHeight: 1.2,
      }}
    >
      {children}
    </span>
  )
}
