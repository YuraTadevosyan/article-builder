import { useState } from 'react'
import { Icon } from './Icon'
import { uid, fmtDate, stripTags } from '../lib/utils'
import { callAI, sampleResponse } from '../lib/ai'
import type { AppSettings, Article } from '../types'

type IntentId = 'expand' | 'rewrite' | 'summarize' | 'generate'
type Tone = 'Professional' | 'Casual' | 'Technical' | 'Punchy'
type Scope = 'all' | 'selection'

interface AIHistory {
  id: string
  intent: IntentId
  prompt: string
  scope: Scope
  at: string
  text: string
}

interface AIPanelProps {
  open: boolean
  onClose: () => void
  onApply: (text: string) => void
  onReplaceArticle: (markdown: string) => void
  onReplaceSelection: (text: string) => boolean
  selectionText: string
  article: Article
  settings: AppSettings
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

const intentOptions: { id: IntentId; label: string; icon: string }[] = [
  { id: 'expand', label: 'Expand', icon: 'expand' },
  { id: 'rewrite', label: 'Rewrite', icon: 'rewrite' },
  { id: 'summarize', label: 'Summarize', icon: 'summary' },
  { id: 'generate', label: 'Generate', icon: 'wand' },
]

const tones: Tone[] = ['Professional', 'Casual', 'Technical', 'Punchy']

function articleToMarkdown(a: Article): string {
  return a.blocks.map(b => {
    if (b.type === 'h1') return `# ${stripTags(b.text || '')}`
    if (b.type === 'h2') return `## ${stripTags(b.text || '')}`
    if (b.type === 'h3') return `### ${stripTags(b.text || '')}`
    if (b.type === 'ul') return (b.items || []).map(i => `- ${stripTags(i)}`).join('\n')
    if (b.type === 'ol') return (b.items || []).map((i, idx) => `${idx + 1}. ${stripTags(i)}`).join('\n')
    if (b.type === 'blockquote') return `> ${stripTags(b.text || '')}`
    if (b.type === 'code') return '```\n' + stripTags(b.text || '') + '\n```'
    if (b.type === 'img') return ''
    return stripTags(b.text || '')
  }).filter(Boolean).join('\n\n')
}

function buildPrompt(intent: IntentId, tone: Tone, scope: Scope, userPrompt: string, article: Article, selection: string): string {
  const context = scope === 'selection'
    ? `Selected text from the article:\n"""\n${selection}\n"""`
    : `Full article (markdown):\n"""\n${articleToMarkdown(article)}\n"""`
  const intentLine = {
    expand: 'Expand the source text. Add detail, examples, and depth while keeping voice consistent.',
    rewrite: 'Rewrite the source text. Keep the meaning; change phrasing and rhythm.',
    summarize: 'Summarize the source text. Distill the argument; cut filler.',
    generate: scope === 'all'
      ? 'Generate a complete article on the requested topic. Use markdown headings (##), paragraphs, and lists. Begin with an H1.'
      : 'Generate new prose to fit at the location of the selection.',
  }[intent]
  const formatLine = scope === 'all' && intent === 'generate'
    ? 'Output: a full article in plain markdown. No preamble, no commentary, no code fences around the article.'
    : 'Output: just the prose. No preamble or commentary. Plain markdown is fine.'
  return [
    'You are a writing assistant for a long-form article editor.',
    intentLine,
    `Tone: ${tone}.`,
    formatLine,
    context,
    userPrompt ? `Author's instruction: ${userPrompt}` : '',
  ].filter(Boolean).join('\n\n')
}

export function AIPanel({ open, onClose, onApply, onReplaceArticle, onReplaceSelection, selectionText, article, settings, push }: AIPanelProps) {
  const [tone, setTone] = useState<Tone>('Professional')
  const [intent, setIntent] = useState<IntentId>('expand')
  const [scope, setScope] = useState<Scope>('all')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<{ text: string; intent: IntentId; tone: Tone; scope: Scope; prompt: string } | null>(null)
  const [history, setHistory] = useState<AIHistory[]>([])

  if (!open) return null

  const hasSelection = selectionText.trim().length > 0
  const effectiveScope: Scope = scope === 'selection' && !hasSelection ? 'all' : scope
  const replaceArticleMode = effectiveScope === 'all' && intent === 'generate'

  const submit = async () => {
    if (!prompt.trim() && intent !== 'generate' && effectiveScope === 'all') {
      push('Type a prompt first', 'error'); return
    }
    if (effectiveScope === 'selection' && !hasSelection) {
      push('Select some text in the editor first', 'error'); return
    }
    setLoading(true)
    setResponse(null)
    const fullPrompt = buildPrompt(intent, tone, effectiveScope, prompt, article, selectionText)

    try {
      let text: string
      if (settings.aiProvider === 'mock') {
        text = await sampleResponse(intent, tone, effectiveScope)
      } else {
        if (!settings.aiApiKey) {
          push('Add an API key in Settings → AI', 'error')
          setLoading(false); return
        }
        text = await callAI(settings, fullPrompt)
      }
      setResponse({ text, intent, tone, scope: effectiveScope, prompt })
      setHistory(h => [
        { id: uid('a'), intent, prompt: prompt || `(${intent})`, scope: effectiveScope, at: new Date().toISOString(), text },
        ...h,
      ])
    } catch (err) {
      push(err instanceof Error ? err.message : 'AI request failed', 'error')
    } finally {
      setLoading(false)
    }
  }

  const apply = () => {
    if (!response) return
    if (response.scope === 'all' && response.intent === 'generate') {
      onReplaceArticle(response.text)
      push('Article replaced', 'success')
    } else if (response.scope === 'selection') {
      const ok = onReplaceSelection(response.text)
      if (ok) push('Selection replaced', 'success')
      else { onApply(response.text); push('Selection lost — appended instead', 'default') }
    } else {
      onApply(response.text)
      push('Inserted into doc', 'success')
    }
  }

  const applyLabel = response?.scope === 'all' && response?.intent === 'generate'
    ? 'Replace article'
    : response?.scope === 'selection'
    ? 'Replace selection'
    : 'Insert'

  return (
    <>
      {/* Backdrop — covers the editor on mobile so taps outside dismiss the
          panel. Hidden on md+ where the panel is an inline column. */}
      <div
        className="fixed inset-0 z-40 bg-black/35 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        data-testid="ai-panel"
        aria-label="AI assistant"
        className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[420px] shrink-0 flex-col border-l border-border bg-secondary shadow-xl md:relative md:inset-auto md:z-auto md:w-[340px] md:max-w-none md:shadow-none"
      >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--rule-soft)', height: 48, gap: 8 }}>
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-accent shadow-[var(--shadow-sm)]">
          <Icon name="ai" size={13} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>AI Assistant</span>
          <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>
            {settings.aiProvider.toUpperCase()}{settings.aiModel ? ` · ${settings.aiModel}` : ''}
          </span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={onClose}
          aria-label="Close AI assistant"
          style={{ height: 32, width: 32, padding: 0, justifyContent: 'center' }}
        >
          <Icon name="close" size={14} />
        </button>
      </div>

      {/* Scope */}
      <div style={{ padding: '12px 14px 8px', borderBottom: '1px solid var(--rule-soft)' }}>
        <div className="label" style={{ marginBottom: 8 }}>Scope</div>
        <div style={{ display: 'flex', border: '1px solid var(--rule-soft)', borderRadius: 8, overflow: 'hidden' }}>
          {([
            { id: 'all' as const, label: 'Whole article' },
            { id: 'selection' as const, label: hasSelection ? `Selection (${selectionText.length}c)` : 'Selection' },
          ]).map((s, i) => {
            const disabled = s.id === 'selection' && !hasSelection
            const active = effectiveScope === s.id
            return (
              <button
                key={s.id}
                onClick={() => !disabled && setScope(s.id)}
                disabled={disabled}
                data-testid={`ai-scope-${s.id}`}
                style={{
                  flex: 1, padding: '6px 8px', border: 0,
                  borderRight: i === 0 ? '1px solid var(--rule-soft)' : 0,
                  background: active ? 'var(--ink)' : 'transparent',
                  color: disabled ? 'var(--ink-4)' : active ? 'var(--paper)' : 'var(--ink-2)',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--mono)', fontSize: 10,
                  opacity: disabled ? 0.5 : 1,
                }}
              >
                {s.label}
              </button>
            )
          })}
        </div>
        {effectiveScope === 'selection' && hasSelection && (
          <div className="mt-2 max-h-16 overflow-auto rounded-md border border-border border-l-[3px] border-l-accent bg-card p-2.5 text-[12px] leading-relaxed text-foreground/85">

            “{selectionText.length > 200 ? selectionText.slice(0, 200) + '…' : selectionText}”
          </div>
        )}
        {effectiveScope === 'all' && intent === 'generate' && (
          <div style={{ marginTop: 8, fontSize: 10, color: 'var(--ink-4)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            ⚠ Output replaces the entire article
          </div>
        )}
      </div>

      {/* Intent picker */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--rule-soft)' }}>
        <div className="label" style={{ marginBottom: 8 }}>Intent</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {intentOptions.map(o => (
            <button key={o.id} onClick={() => setIntent(o.id)} className="btn" data-active={intent === o.id} data-testid={`ai-intent-${o.id}`} style={{ justifyContent: 'flex-start', height: 30 }}>
              <Icon name={o.icon} size={12} />
              {o.label}
            </button>
          ))}
        </div>

        <div className="label" style={{ marginTop: 14, marginBottom: 8 }}>Tone</div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {tones.map(t => (
            <button key={t} onClick={() => setTone(t)} className="btn" data-active={tone === t} style={{ height: 24, padding: '0 8px', fontSize: 10 }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div style={{ padding: 14, borderBottom: '1px solid var(--rule-soft)' }}>
        <div className="label" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
          <span>Prompt</span>
          <span style={{ color: 'var(--ink-4)' }}>{prompt.length}/600</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value.slice(0, 600))}
          placeholder={
            intent === 'expand' ? 'Expand around the source text…' :
            intent === 'rewrite' ? 'Make it more direct…' :
            intent === 'summarize' ? 'TL;DR…' :
            replaceArticleMode ? 'Generate an article on…' : 'Generate prose to fit here…'
          }
          rows={3}
          style={{ resize: 'vertical', fontSize: 12, lineHeight: 1.5 }}
          data-testid="ai-prompt-input"
        />
        <button
          onClick={submit}
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: 8, justifyContent: 'center', height: 32 }}
          data-testid="ai-generate-btn"
        >
          {loading ? <><span className="caret" style={{ marginRight: 4 }} /> Generating…</> : <><Icon name="send" size={11} /> Generate</>}
        </button>
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {['Tighten the intro', 'Add an example', 'Stronger ending'].map(s => (
            <button
              key={s}
              onClick={() => setPrompt(s)}
              className="cursor-pointer rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:border-foreground hover:bg-secondary hover:text-foreground"
            >
              ↳ {s}
            </button>
          ))}
        </div>
      </div>

      {/* Response area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[100, 94, 88, 72, null, 92, 60].map((w, i) =>
              w ? <div key={i} className="ai-shimmer" style={{ height: 12, width: `${w}%` }} /> :
              <div key={i} style={{ height: 4 }} />
            )}
          </div>
        )}
        {!loading && response && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="label" style={{ color: 'var(--accent-ink)' }}>{response.intent} · {response.tone} · {response.scope === 'all' ? 'whole' : 'selection'}</span>
              <span style={{ flex: 1 }} />
              <button onClick={() => { navigator.clipboard?.writeText(response.text); push('Copied to clipboard', 'success') }} className="btn btn-ghost" style={{ height: 22, padding: '0 6px', fontSize: 10 }}>
                <Icon name="copy" size={10} /> Copy
              </button>
              <button onClick={apply} className="btn btn-primary" style={{ height: 22, padding: '0 8px', fontSize: 10 }} data-testid="ai-insert-btn">
                {applyLabel}
              </button>
            </div>
            <div className="whitespace-pre-wrap rounded-md border border-border border-l-[3px] border-l-accent bg-card p-3 text-[13px] leading-relaxed text-foreground/90 shadow-[var(--shadow-sm)]">
              {response.text}
            </div>
          </div>
        )}
        {!loading && !response && (
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Recent</div>
            {history.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--ink-4)', lineHeight: 1.5, padding: '6px 0' }}>
                No prompts yet. Pick a scope, intent, and tone, type something, and hit Generate.
              </div>
            )}
            {history.map(h => (
              <div key={h.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--rule-softer)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--accent-ink)', textTransform: 'uppercase' }}>{h.intent}</span>
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>· {h.scope === 'all' ? 'whole' : 'sel'}</span>
                  <span style={{ flex: 1 }} />
                  <span className="mono" style={{ fontSize: 9, color: 'var(--ink-4)' }}>{fmtDate(h.at)}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginBottom: 4, fontStyle: 'italic' }}>"{h.prompt}"</div>
                <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.5 }}>{h.text.length > 240 ? h.text.slice(0, 240) + '…' : h.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      </aside>
    </>
  )
}
