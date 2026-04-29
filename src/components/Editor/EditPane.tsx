import { Tag } from '../ui/Tag'
import { BlockRow } from './BlockRow'
import { fmtDate } from '../../lib/utils'
import type { Article, Block, BlockType, Version } from '../../types'

interface EditPaneProps {
  article: Article
  onUpdate: (patch: Partial<Article>) => void
  onUpdateBlock: (idx: number, patch: Partial<Block>) => void
  onInsertBlock: (idx: number, block: Block) => void
  onDeleteBlock: (idx: number) => void
  onSetBlockType: (idx: number, type: BlockType) => void
  markDirty: () => void
  setSelBlock: (idx: number) => void
  wordCount: number
  readMin: number
  versions: Version[]
  maxWidth: number
  spellCheck: boolean
}

export function EditPane({
  article, onUpdate, onUpdateBlock, onInsertBlock, onDeleteBlock, onSetBlockType,
  markDirty, setSelBlock, wordCount, readMin, versions, maxWidth, spellCheck
}: EditPaneProps) {
  return (
    <div
      data-testid="edit-pane"
      style={{ overflowY: 'auto', padding: '32px 32px 80px', background: 'var(--paper)', minWidth: 0 }}
    >
      <div style={{ maxWidth, margin: '0 auto', minWidth: 0, wordBreak: 'normal', overflowWrap: 'break-word' }}>
        {/* Title */}
        <div style={{ marginBottom: 8 }}>
          <input
            data-testid="article-title-input"
            value={article.title}
            onChange={(e) => { onUpdate({ title: e.target.value }); markDirty() }}
            style={{
              border: 0, padding: 0, width: '100%',
              fontFamily: 'var(--serif)', fontSize: 36, fontWeight: 700,
              letterSpacing: '-0.02em', lineHeight: 1.15,
              background: 'transparent', color: 'var(--ink)',
            }}
          />
        </div>

        {/* Meta strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: '1px dashed var(--rule-soft)' }}>
          <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{wordCount} WORDS · {readMin} MIN READ</span>
          <span style={{ flex: 1 }} />
          {(article.tags || []).slice(0, 3).map(t => <Tag key={t} label={t} />)}
        </div>

        {/* Description */}
        <textarea
          data-testid="article-description-input"
          value={article.description}
          onChange={(e) => { onUpdate({ description: e.target.value }); markDirty() }}
          rows={2}
          placeholder="One-line description…"
          style={{
            width: '100%', border: 0, borderLeft: '2px solid var(--accent)',
            padding: '4px 0 4px 12px', marginBottom: 28,
            fontFamily: 'var(--sans)', fontSize: 15, lineHeight: 1.5,
            color: 'var(--ink-2)', resize: 'none', background: 'transparent',
          }}
        />

        {/* Blocks */}
        <div className="doc">
          {article.blocks.map((block, i) => (
            <BlockRow
              key={i}
              block={block}
              spellCheck={spellCheck}
              onChange={(patch) => onUpdateBlock(i, patch)}
              onDelete={() => onDeleteBlock(i)}
              onInsert={(b) => onInsertBlock(i, b)}
              onSetType={(t) => onSetBlockType(i, t)}
              onFocus={() => setSelBlock(i)}
            />
          ))}
        </div>

        {/* Add block */}
        <button
          data-testid="add-block-btn"
          onClick={() => onInsertBlock(article.blocks.length - 1, { type: 'p', text: '' })}
          style={{
            marginTop: 16, width: '100%', padding: '10px',
            border: '1px dashed var(--rule-soft)', background: 'transparent',
            fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-4)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.color = 'var(--ink-2)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--rule-soft)'; e.currentTarget.style.color = 'var(--ink-4)' }}
        >
          + Add block
        </button>

        {/* Recent revisions */}
        {versions.length > 0 && (
          <div style={{ marginTop: 48, paddingTop: 20, borderTop: '1px solid var(--rule-soft)' }}>
            <div className="label" style={{ marginBottom: 10 }}>Recent revisions</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {versions.slice(0, 4).map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--ink-3)', padding: '6px 0' }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', width: 50 }}>{v.id}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)', width: 100 }}>{fmtDate(v.at)}</span>
                  <span style={{ flex: 1 }}>{v.note}</span>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{v.words}w</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
