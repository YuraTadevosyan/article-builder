export type BlockType = 'h1' | 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'blockquote' | 'code' | 'img' | 'hr'

export interface Block {
  type: BlockType
  text?: string
  items?: string[]
  lang?: string
  /** Image source — data: URL after upload, or http(s) URL when pasted. */
  src?: string
  /** Image alt text. Defaults to the empty string in the DOM but stored as undefined when unset. */
  alt?: string
}

export type CoverKind = 'ph-warm' | 'ph-cool' | 'ph-paper' | 'ph-grid'
export type ArticleStatus = 'Draft' | 'Published'

export interface Article {
  id: string
  title: string
  description: string
  tags: string[]
  cover: CoverKind
  status: ArticleStatus
  updatedAt: string
  createdAt: string
  words: number
  blocks: Block[]
}

export interface Version {
  id: string
  articleId: string
  at: string
  words: number
  label?: string
  note: string
  blocks: Block[]
}

export type Route = 'editor' | 'dashboard' | 'history' | 'settings'

export type ToastTone = 'success' | 'error' | 'default'

export interface Toast {
  id: string
  text: string
  tone: ToastTone
}

export type ReadingWidth = 'narrow' | 'comfortable' | 'wide'

export type ColorScheme = 'warm' | 'slate' | 'sage' | 'rose' | 'mono'

export type AIProvider = 'mock' | 'openai' | 'anthropic'

export interface AppSettings {
  readingWidth: ReadingWidth
  autoSaveDelayMs: number
  spellCheck: boolean
  colorScheme: ColorScheme
  aiProvider: AIProvider
  aiApiUrl: string
  aiApiKey: string
  aiModel: string
}

export interface EditorSelection {
  text: string
  // The browser Range at the moment of capture. Goes stale if the surrounding
  // DOM changes — guard with a try/catch when restoring.
  range: Range | null
}
