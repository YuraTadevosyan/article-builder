interface IconProps {
  name: string
  size?: number
  className?: string
  strokeWidth?: number
}

export function Icon({ name, size = 14, className = '', strokeWidth = 1.5 }: IconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'square' as const,
    strokeLinejoin: 'miter' as const,
    className,
  }

  switch (name) {
    case 'edit': return <svg {...props}><path d="M4 20h4l10-10-4-4L4 16v4z"/></svg>
    case 'doc': return <svg {...props}><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4"/></svg>
    case 'history': return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 8v5l3 2"/></svg>
    case 'settings': return <svg {...props}><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.6 4.6l2.1 2.1M17.3 17.3l2.1 2.1M4.6 19.4l2.1-2.1M17.3 6.7l2.1-2.1"/></svg>
    case 'search': return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    case 'plus': return <svg {...props}><path d="M12 5v14M5 12h14"/></svg>
    case 'bold': return <svg {...props} strokeWidth={2}><path d="M7 4h6a4 4 0 0 1 0 8H7zM7 12h7a4 4 0 0 1 0 8H7z"/></svg>
    case 'italic': return <svg {...props}><path d="M19 4h-9M14 20H5M15 4l-6 16"/></svg>
    case 'underline': return <svg {...props}><path d="M6 4v8a6 6 0 0 0 12 0V4M5 21h14"/></svg>
    case 'h1': return <svg {...props}><text x="2" y="17" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H1</text></svg>
    case 'h2': return <svg {...props}><text x="2" y="17" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H2</text></svg>
    case 'h3': return <svg {...props}><text x="2" y="17" fontFamily="JetBrains Mono" fontSize="11" fontWeight="600" fill="currentColor" stroke="none">H3</text></svg>
    case 'ul': return <svg {...props}><circle cx="5" cy="6" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="18" r="1" fill="currentColor"/><path d="M9 6h11M9 12h11M9 18h11"/></svg>
    case 'ol': return <svg {...props}><path d="M9 6h11M9 12h11M9 18h11"/><text x="2" y="8" fontFamily="JetBrains Mono" fontSize="6" fill="currentColor" stroke="none">1</text><text x="2" y="14" fontFamily="JetBrains Mono" fontSize="6" fill="currentColor" stroke="none">2</text><text x="2" y="20" fontFamily="JetBrains Mono" fontSize="6" fill="currentColor" stroke="none">3</text></svg>
    case 'code': return <svg {...props}><path d="m8 7-5 5 5 5M16 7l5 5-5 5M14 5l-4 14"/></svg>
    case 'link': return <svg {...props}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/></svg>
    case 'image': return <svg {...props}><rect x="3" y="4" width="18" height="16"/><circle cx="9" cy="10" r="1.5"/><path d="m3 16 5-4 5 4 3-3 5 4"/></svg>
    case 'quote': return <svg {...props}><path d="M6 9h4v6H6zM14 9h4v6h-4z"/><path d="M6 15c0 2-1 3-3 3M14 15c0 2-1 3-3 3"/></svg>
    case 'ai': return <svg {...props}><path d="M12 3l2 4 4 2-4 2-2 4-2-4-4-2 4-2zM18 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/></svg>
    case 'send': return <svg {...props}><path d="M4 12h16M14 6l6 6-6 6"/></svg>
    case 'close': return <svg {...props}><path d="M6 6l12 12M6 18 18 6"/></svg>
    case 'chevron-down': return <svg {...props}><path d="m6 9 6 6 6-6"/></svg>
    case 'chevron-right': return <svg {...props}><path d="m9 6 6 6-6 6"/></svg>
    case 'chevron-left': return <svg {...props}><path d="m15 6-6 6 6 6"/></svg>
    case 'check': return <svg {...props}><path d="m4 12 5 5L20 6"/></svg>
    case 'copy': return <svg {...props}><rect x="8" y="8" width="12" height="12"/><path d="M4 16V4h12"/></svg>
    case 'download': return <svg {...props}><path d="M12 4v12M6 12l6 6 6-6M4 20h16"/></svg>
    case 'trash': return <svg {...props}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>
    case 'tag': return <svg {...props}><path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="8" cy="8" r="1.5" fill="currentColor"/></svg>
    case 'filter': return <svg {...props}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></svg>
    case 'sort': return <svg {...props}><path d="M7 4v16M4 17l3 3 3-3M17 20V4M14 7l3-3 3 3"/></svg>
    case 'more': return <svg {...props}><circle cx="5" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="19" cy="12" r="1.2" fill="currentColor"/></svg>
    case 'eye': return <svg {...props}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
    case 'split': return <svg {...props}><rect x="3" y="4" width="18" height="16"/><path d="M12 4v16"/></svg>
    case 'moon': return <svg {...props}><path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11z"/></svg>
    case 'sun': return <svg {...props}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    case 'command': return <svg {...props}><path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z"/></svg>
    case 'circle-dot': return <svg {...props}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg>
    case 'globe': return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>
    case 'user': return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>
    case 'wand': return <svg {...props}><path d="M4 20 18 6M14 4l2 2M20 10l-2-2M19 14l-1-1M14 8l-1-1"/></svg>
    case 'summary': return <svg {...props}><path d="M5 6h14M5 12h10M5 18h14"/></svg>
    case 'expand': return <svg {...props}><path d="M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7"/></svg>
    case 'rewrite': return <svg {...props}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/></svg>
    case 'restore': return <svg {...props}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5"/></svg>
    default: return null
  }
}
