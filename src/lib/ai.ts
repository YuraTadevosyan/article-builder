import type { AppSettings } from '../types'

// Mock samples — kept here so the AIPanel never reaches into a static
// dictionary. The four (intent × tone × scope) combos that historically
// existed in the panel collapse to a smaller set; the scope flag just
// changes the shape of the canned text.
const MOCK_SAMPLES: Record<string, string> = {
  expand:    'Each session lowers the activation energy of the next, and the work done in motion compounds faster than the work done from a standing start. The discipline of daily practice rewards itself in a way that feels almost unfair.',
  rewrite:   'There is a kind of writing advice that endures because it is true and unfashionable: appear at the desk, every day, for a small amount of time.',
  summarize: 'Daily defended sessions outperform heroic sprints. Measure session-completion rate, not raw word count.',
  generate_short: 'Stop mid-sentence. Tomorrow you will sit down already in motion.',
  generate_article: '# On stopping mid-sentence\n\nThe single most useful trick I know for sustaining a writing practice is to stop in the middle of a sentence.\n\n## Why mid-sentence works\n\nWhen you stop at a clean boundary — end of paragraph, end of section — you have to *re-enter* the doc cold the next morning. Stopping mid-sentence means tomorrow\'s you sits down already in motion.\n\n- Lower activation cost\n- Continuity over volume\n- Calmer ambition\n\n## What to actually do\n\nSet a 25-minute timer. When it goes off, finish the current word and stop. Do not finish the thought. Tomorrow\'s you will thank you.',
}

export function sampleResponse(intent: string, _tone: string, scope: string): Promise<string> {
  return new Promise(resolve => {
    const key = intent === 'generate'
      ? (scope === 'all' ? 'generate_article' : 'generate_short')
      : intent
    const text = MOCK_SAMPLES[key] || MOCK_SAMPLES.expand
    setTimeout(() => resolve(text), 900)
  })
}

export async function callAI(settings: AppSettings, prompt: string): Promise<string> {
  if (settings.aiProvider === 'openai') return callOpenAI(settings, prompt)
  if (settings.aiProvider === 'anthropic') return callAnthropic(settings, prompt)
  throw new Error(`Unknown provider: ${settings.aiProvider}`)
}

async function callOpenAI(settings: AppSettings, prompt: string): Promise<string> {
  const res = await fetch(settings.aiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${settings.aiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.aiModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2048,
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await safeText(res)}`)
  const json: unknown = await res.json()
  const text = pluck(json, ['choices', 0, 'message', 'content'])
  if (typeof text !== 'string') throw new Error('OpenAI: unexpected response shape')
  return text.trim()
}

async function callAnthropic(settings: AppSettings, prompt: string): Promise<string> {
  const res = await fetch(settings.aiApiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': settings.aiApiKey,
      'anthropic-version': '2023-06-01',
      // Required header for browser-side calls; Anthropic blocks them
      // by default to discourage shipping keys to clients.
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: settings.aiModel,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await safeText(res)}`)
  const json: unknown = await res.json()
  const text = pluck(json, ['content', 0, 'text'])
  if (typeof text !== 'string') throw new Error('Anthropic: unexpected response shape')
  return text.trim()
}

async function safeText(res: Response): Promise<string> {
  try { return (await res.text()).slice(0, 200) } catch { return '' }
}

// Tiny safe accessor for nested JSON shape; avoids the `any` cascade.
function pluck(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj
  for (const k of path) {
    if (cur == null) return undefined
    if (typeof k === 'number') {
      if (!Array.isArray(cur)) return undefined
      cur = cur[k]
    } else {
      if (typeof cur !== 'object') return undefined
      cur = (cur as Record<string, unknown>)[k]
    }
  }
  return cur
}
