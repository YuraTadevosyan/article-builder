import type { Block } from '@/types'

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
    case 'hr': return <hr className="my-6 border-0 border-t border-border" />
    case 'img':
      if (block.src) {
        return (
          <figure className="my-4 flex flex-col gap-1.5">
            <img src={block.src} alt={block.alt || ''} className="block w-full rounded-lg border border-border" />
            {block.alt && (
              <figcaption className="text-center font-sans text-[12px] italic text-muted-foreground">
                {block.alt}
              </figcaption>
            )}
          </figure>
        )
      }
      return (
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
