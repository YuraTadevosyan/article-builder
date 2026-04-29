import { useState, useEffect } from 'react'
import { Modal } from '../ui/Modal'
import { Tag } from '../ui/Tag'
import { CoverPh } from '../ui/CoverPh'
import { TAG_LIBRARY } from '../../data/seed'
import type { Article, CoverKind } from '../../types'

interface MetadataModalProps {
  open: boolean
  article: Article | null
  onClose: () => void
  onSave: (patch: Partial<Article>) => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="label">{label}</span>
        {hint && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export function MetadataModal({ open, article, onClose, onSave, push }: MetadataModalProps) {
  const [draft, setDraft] = useState<Partial<Article>>(article || {})

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(article || {})
  }, [article])

  if (!open || !article) return null

  const toggleTag = (t: string) => {
    const has = (draft.tags || []).includes(t)
    setDraft(d => ({ ...d, tags: has ? (d.tags || []).filter(x => x !== t) : [...(d.tags || []), t] }))
  }

  return (
    <Modal open={open} onClose={onClose} title="Article metadata" width={620}>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <Field label="Title">
          <input type="text" value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value })} data-testid="meta-title-input" />
        </Field>
        <Field label="Description" hint="Shown on the dashboard and in social previews.">
          <textarea rows={2} value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </Field>
        <Field label="Status">
          <div style={{ display: 'flex', border: '1px solid var(--rule-soft)', width: 'fit-content' }}>
            {['Draft', 'Published'].map((s, i) => (
              <button key={s} onClick={() => setDraft({ ...draft, status: s as 'Draft' | 'Published' })} style={{
                padding: '8px 18px', border: 0, borderRight: i === 0 ? '1px solid var(--rule-soft)' : 0,
                background: draft.status === s ? 'var(--ink)' : 'transparent',
                color: draft.status === s ? 'var(--paper)' : 'var(--ink-2)',
                fontFamily: 'var(--mono)', fontSize: 11, cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>
        </Field>
        <Field label="Tags" hint="Click to toggle.">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {TAG_LIBRARY.map(t => (
              <Tag key={t} label={t} active={(draft.tags || []).includes(t)} onClick={() => toggleTag(t)} />
            ))}
          </div>
        </Field>
        <Field label="Cover image">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {(['ph-warm', 'ph-cool', 'ph-paper', 'ph-grid'] as CoverKind[]).map(k => (
              <button key={k} onClick={() => setDraft({ ...draft, cover: k })} style={{
                padding: 0, border: draft.cover === k ? '2px solid var(--ink)' : '1px solid var(--rule-soft)',
                background: 'transparent', cursor: 'pointer',
              }}>
                <CoverPh kind={k} height={56} />
              </button>
            ))}
          </div>
        </Field>
        <Field label="SEO preview">
          <div style={{ border: '1px solid var(--rule-soft)', padding: 12, background: 'var(--paper-2)' }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--green)', marginBottom: 4 }}>field.notes › articles</div>
            <div style={{ fontFamily: 'var(--serif)', fontSize: 16, color: '#1a4ed8', marginBottom: 4, fontWeight: 500 }}>{draft.title}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>{draft.description}</div>
          </div>
        </Field>
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--paper-2)' }}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" data-testid="meta-save-btn" onClick={() => { onSave(draft); push('Metadata saved', 'success'); onClose() }}>Save</button>
      </div>
    </Modal>
  )
}
