import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Icon } from '../Icon'
import { stripTags } from '../../lib/utils'
import type { Article } from '../../types'

interface ExportModalProps {
  open: boolean
  article: Article | null
  onClose: () => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

type FormatId = 'md' | 'html' | 'pdf'

const formats: { id: FormatId; label: string; ext: string; desc: string }[] = [
  { id: 'md', label: 'Markdown', ext: '.md', desc: 'Plain text with formatting markers. Universal.' },
  { id: 'html', label: 'HTML', ext: '.html', desc: 'Self-contained document with the article styles inlined.' },
  { id: 'pdf', label: 'PDF', ext: '.pdf', desc: 'Print-ready, with cover and pagination.' },
]

export function ExportModal({ open, article, onClose, push }: ExportModalProps) {
  const [format, setFormat] = useState<FormatId>('md')
  if (!open || !article) return null

  const renderPreview = () => {
    if (format === 'md') {
      return article.blocks.map(b => {
        if (b.type === 'h1') return `# ${stripTags(b.text || '')}`
        if (b.type === 'h2') return `## ${stripTags(b.text || '')}`
        if (b.type === 'h3') return `### ${stripTags(b.text || '')}`
        if (b.type === 'ul') return (b.items || []).map(i => `- ${i}`).join('\n')
        if (b.type === 'ol') return (b.items || []).map((i, idx) => `${idx + 1}. ${i}`).join('\n')
        if (b.type === 'blockquote') return `> ${stripTags(b.text || '')}`
        if (b.type === 'code') return '```\n' + stripTags(b.text || '') + '\n```'
        if (b.type === 'img') return '![cover](./img.png)'
        return stripTags(b.text || '')
      }).join('\n\n')
    }
    if (format === 'html') {
      return `<!doctype html>\n<html>\n<head><title>${article.title}</title></head>\n<body>\n  <article>\n    <h1>${article.title}</h1>\n    <p><em>${article.description}</em></p>\n    ${article.blocks.slice(0, 5).map(b => `<${b.type}>${stripTags(b.text || (b.items || []).join(' · '))}</${b.type}>`).join('\n    ')}\n  </article>\n</body>\n</html>`
    }
    return `[ PDF preview · ${article.title} ]\n\nPages: 4\nPaper: A4\nFont: Source Serif 4 14pt\nMargins: 22mm\n\nIncludes cover page and footer with page numbers.`
  }

  const preview = renderPreview()
  const currentFormat = formats.find(f => f.id === format)

  return (
    <Modal open={open} onClose={onClose} title="Export article" width={680}>
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', minHeight: 400 }}>
        <div style={{ borderRight: '1px solid var(--rule-soft)', padding: 12 }}>
          <div className="label" style={{ marginBottom: 8 }}>Format</div>
          {formats.map(f => (
            <button key={f.id} onClick={() => setFormat(f.id)} data-testid={`export-format-${f.id}`} style={{
              width: '100%', textAlign: 'left', padding: '10px 12px',
              border: 0, borderLeft: `2px solid ${format === f.id ? 'var(--accent)' : 'transparent'}`,
              background: format === f.id ? 'var(--paper-2)' : 'transparent',
              cursor: 'pointer', marginBottom: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{f.label}</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>{f.ext}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4 }}>{f.desc}</div>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--rule-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="label">Preview · {format.toUpperCase()}</span>
            <span style={{ flex: 1 }} />
            <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>
              {article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}{currentFormat?.ext}
            </span>
          </div>
          <pre style={{ margin: 0, padding: 16, fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 1.6, color: 'var(--ink-2)', flex: 1, overflow: 'auto', background: 'var(--paper)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {preview}
          </pre>
        </div>
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--rule-soft)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--paper-2)' }}>
        <button className="btn" onClick={() => { navigator.clipboard?.writeText(preview); push('Copied to clipboard', 'success') }}>
          <Icon name="copy" size={11} /> Copy
        </button>
        <button className="btn btn-primary" data-testid="export-download-btn" onClick={() => { push(`Downloaded ${article.title}${currentFormat?.ext}`, 'success'); onClose() }}>
          <Icon name="download" size={11} /> Download
        </button>
      </div>
    </Modal>
  )
}
