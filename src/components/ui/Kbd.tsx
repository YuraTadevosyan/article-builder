import type { ReactNode } from 'react'

interface KbdProps {
  children: ReactNode
}

export function Kbd({ children }: KbdProps) {
  return (
    <span className="inline-flex items-center rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] leading-none text-muted-foreground shadow-[0_1px_0_0_var(--rule-soft)]">
      {children}
    </span>
  )
}
