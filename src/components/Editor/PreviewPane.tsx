import { Tag } from '../ui/Tag'
import { CoverPh } from '../ui/CoverPh'
import { RenderBlock } from './RenderBlock'
import type { Article } from '../../types'

interface PreviewPaneProps {
  article: Article
  wordCount: number
  readMin: number
  bordered?: boolean
  maxWidth?: number
}

export function PreviewPane({ article, wordCount, readMin, bordered, maxWidth = 680 }: PreviewPaneProps) {
  return (
    <div
      data-testid="preview-pane"
      style={{
        overflowY: 'auto',
        padding: '32px 32px 80px',
        background: 'var(--paper-2)',
        borderLeft: bordered ? '1px solid var(--rule-soft)' : 'none',
        minWidth: 0,
      }}
    >
      <div style={{ maxWidth, margin: '0 auto', minWidth: 0, wordBreak: 'normal', overflowWrap: 'break-word' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
          <span className="label">Live preview</span>
          <span style={{ width: 1, height: 12, background: 'var(--rule-soft)' }} />
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>RENDERED · {wordCount}W · {readMin}MIN</span>
        </div>
        <CoverPh kind={article.cover} height={180} />
        <div style={{ padding: '20px 0 0' }}>
          {(article.tags || []).slice(0, 3).map(t => (
            <span key={t} style={{ marginRight: 6 }}><Tag label={t} /></span>
          ))}
        </div>
        <div className="doc" style={{ marginTop: 14 }}>
          <h1>{article.title}</h1>
          {article.description && (
            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'var(--ink-2)', fontStyle: 'italic', marginBottom: 24, paddingBottom: 14, borderBottom: '1px solid var(--rule-soft)' }}>
              {article.description}
            </p>
          )}
          {article.blocks.map((b, i) => <RenderBlock key={i} block={b} />)}
        </div>
      </div>
    </div>
  )
}
