import type { CoverKind } from '../../types'

const palettes: Record<CoverKind, [string, string]> = {
  'ph-warm': ['#e8d4b8', '#d4733a'],
  'ph-cool': ['#c8d4d8', '#3a5a8c'],
  'ph-paper': ['#e8e4d6', '#8a8a82'],
  'ph-grid': ['#dcd8c8', '#1a1a18'],
}

interface CoverPhProps {
  kind?: CoverKind
  height?: number
}

export function CoverPh({ kind = 'ph-warm', height = 120 }: CoverPhProps) {
  const [bg, accent] = palettes[kind] || palettes['ph-warm']
  return (
    <div
      style={{
        width: '100%',
        height,
        background: bg,
        backgroundImage: `repeating-linear-gradient(45deg, transparent 0 12px, ${accent}22 12px 13px)`,
        position: 'relative',
        borderBottom: '1px solid var(--rule-soft)',
      }}
    >
      <div style={{ position: 'absolute', top: 8, left: 10, fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em', color: accent, opacity: 0.7 }}>
        IMG / COVER
      </div>
      <div style={{ position: 'absolute', bottom: 8, right: 10, width: 8, height: 8, background: accent }} />
    </div>
  )
}
