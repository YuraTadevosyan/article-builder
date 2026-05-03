import type { Block } from '../types'

// Tiny line-oriented markdown parser. Handles enough syntax to round-trip
// the article shapes we render: h1/h2/h3, paragraphs, ul/ol, blockquote,
// fenced code blocks. Anything fancier is intentionally left to a real
// parser when/if we adopt one.
export function mdToBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0

  const flushParagraph = (buf: string[]) => {
    const text = buf.join(' ').trim()
    if (text) blocks.push({ type: 'p', text: inline(text) })
  }

  let para: string[] = []

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // fenced code
    if (trimmed.startsWith('```')) {
      flushParagraph(para); para = []
      const lang = trimmed.slice(3).trim() || undefined
      const code: string[] = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]); i++
      }
      blocks.push({ type: 'code', text: code.join('\n'), lang })
      i++ // consume closing fence
      continue
    }

    // horizontal rule — "---" / "***" / "___" on a line of its own
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      flushParagraph(para); para = []
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // image — only when the whole line is an image markdown link
    const img = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(trimmed)
    if (img) {
      flushParagraph(para); para = []
      blocks.push({ type: 'img', src: img[2], alt: img[1] || undefined })
      i++
      continue
    }

    // headings
    const h = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (h) {
      flushParagraph(para); para = []
      const level = h[1].length as 1 | 2 | 3
      const t = (level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3') as Block['type']
      blocks.push({ type: t, text: inline(h[2]) })
      i++
      continue
    }

    // blockquote
    if (trimmed.startsWith('>')) {
      flushParagraph(para); para = []
      const quote: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''))
        i++
      }
      blocks.push({ type: 'blockquote', text: inline(quote.join(' ')) })
      continue
    }

    // bullet list
    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph(para); para = []
      const items: string[] = []
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(inline(lines[i].trim().replace(/^[-*]\s+/, '')))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    // numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph(para); para = []
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(inline(lines[i].trim().replace(/^\d+\.\s+/, '')))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    // blank line ends a paragraph
    if (trimmed === '') {
      flushParagraph(para); para = []
      i++
      continue
    }

    para.push(trimmed)
    i++
  }
  flushParagraph(para)
  return blocks
}

// Inline pass: **bold**, *italic*, `code`, [text](url). Naive but adequate.
function inline(s: string): string {
  return s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+?)\*/g, '$1<em>$2</em>')
    .replace(/`([^`]+?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+?)\]\(([^)]+?)\)/g, '<a href="$2">$1</a>')
}
