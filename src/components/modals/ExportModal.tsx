import { useState } from 'react'
import { Copy, Download } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { stripTags, cn } from '@/lib/utils'
import type { Article } from '@/types'

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
  if (!article) return null

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
        if (b.type === 'hr') return '---'
        if (b.type === 'img') return b.src ? `![${b.alt || ''}](${b.src})` : ''
        return stripTags(b.text || '')
      }).filter(Boolean).join('\n\n')
    }
    if (format === 'html') {
      const body = article.blocks.map(b => {
        if (b.type === 'hr') return '<hr />'
        if (b.type === 'img') {
          if (!b.src) return ''
          const alt = b.alt ? ` alt="${b.alt.replace(/"/g, '&quot;')}"` : ''
          return `<img src="${b.src}"${alt} />`
        }
        if (b.type === 'ul') return `<ul>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</ul>`
        if (b.type === 'ol') return `<ol>${(b.items || []).map(i => `<li>${i}</li>`).join('')}</ol>`
        if (b.type === 'code') return `<pre><code>${stripTags(b.text || '')}</code></pre>`
        return `<${b.type}>${b.text || ''}</${b.type}>`
      }).filter(Boolean).join('\n    ')
      return `<!doctype html>\n<html>\n<head><title>${article.title}</title></head>\n<body>\n  <article>\n    <h1>${article.title}</h1>\n    <p><em>${article.description}</em></p>\n    ${body}\n  </article>\n</body>\n</html>`
    }
    return `[ PDF preview · ${article.title} ]\n\nPages: 4\nPaper: A4\nFont: Source Serif 4 14pt\nMargins: 22mm\n\nIncludes cover page and footer with page numbers.`
  }

  const preview = renderPreview()
  const currentFormat = formats.find(f => f.id === format)

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[680px] p-0">
        <DialogHeader>
          <div>
            <DialogTitle>Export article</DialogTitle>
            <DialogDescription>Markdown, HTML, or print-ready PDF.</DialogDescription>
          </div>
        </DialogHeader>

        <div className="grid min-h-[400px] grid-cols-[200px_1fr]">
          <div className="border-r border-border p-3">
            <div className="label mb-2">Format</div>
            {formats.map(f => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id)}
                data-testid={`export-format-${f.id}`}
                className={cn(
                  'mb-0.5 flex w-full cursor-pointer flex-col items-start border-0 px-3 py-2.5 text-left transition-colors border-l-2',
                  format === f.id ? 'bg-secondary border-l-accent' : 'border-l-transparent hover:bg-secondary/60'
                )}
              >
                <div className="mb-0.5 flex items-center gap-2">
                  <span className="text-[13px] font-medium text-foreground">{f.label}</span>
                  <span className="mono text-[10px] text-muted-foreground">{f.ext}</span>
                </div>
                <div className="text-[11px] leading-snug text-muted-foreground">{f.desc}</div>
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2.5">
              <span className="label">Preview · {format.toUpperCase()}</span>
              <span className="flex-1" />
              <span className="mono text-[10px] text-muted-foreground">
                {article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}{currentFormat?.ext}
              </span>
            </div>
            <pre className="m-0 flex-1 overflow-auto whitespace-pre-wrap break-words bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground/85">
              {preview}
            </pre>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => { navigator.clipboard?.writeText(preview); push('Copied to clipboard', 'success') }}
          >
            <Copy size={11} /> Copy
          </Button>
          <Button
            data-testid="export-download-btn"
            onClick={() => { push(`Downloaded ${article.title}${currentFormat?.ext}`, 'success'); onClose() }}
          >
            <Download size={11} /> Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
