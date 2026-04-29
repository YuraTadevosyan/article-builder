import type { Block } from '../../types'

interface RenderBlockProps {
  block: Block
}

export function RenderBlock({ block }: RenderBlockProps) {
  switch (block.type) {
    case 'h1': return <h1 dangerouslySetInnerHTML={{ __html: block.text || '' }} />
    case 'h2': return <h2 dangerouslySetInnerHTML={{ __html: block.text || '' }} />
    case 'h3': return <h3 dangerouslySetInnerHTML={{ __html: block.text || '' }} />
    case 'blockquote': return <blockquote dangerouslySetInnerHTML={{ __html: block.text || '' }} />
    case 'code': return <pre dangerouslySetInnerHTML={{ __html: block.text || '' }} />
    case 'img': return (
      <div className="imgph" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="mono" style={{ fontSize: 10, color: 'var(--ink-4)' }}>IMG</span>
      </div>
    )
    case 'ul': return (
      <ul>{(block.items || []).map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ul>
    )
    case 'ol': return (
      <ol>{(block.items || []).map((it, i) => <li key={i} dangerouslySetInnerHTML={{ __html: it }} />)}</ol>
    )
    default: return <p dangerouslySetInnerHTML={{ __html: block.text || '' }} />
  }
}
