interface StatusProps {
  value: string
}

export function Status({ value }: StatusProps) {
  const isPub = value === 'Published'
  return (
    <span
      data-testid="status-pill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 7px',
        fontFamily: 'var(--mono)',
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        border: '1px solid var(--rule-soft)',
        color: isPub ? 'var(--green)' : 'var(--ink-3)',
        background: 'transparent',
      }}
    >
      <span style={{ width: 6, height: 6, background: isPub ? 'var(--green)' : 'var(--ink-4)', borderRadius: '50%', display: 'inline-block' }} />
      {value}
    </span>
  )
}
