import { useState } from 'react'
import { Icon } from './Icon'
import { Kbd } from './ui/Kbd'
import type { AppSettings, ColorScheme, ReadingWidth, AIProvider } from '../types'

interface SettingsProps {
  theme: string
  setTheme: (t: string) => void
  settings: AppSettings
  onUpdateSettings: (patch: Partial<AppSettings>) => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

type SectionId = 'appearance' | 'editor' | 'ai' | 'shortcuts'

const sections: { id: SectionId; label: string }[] = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'editor', label: 'Editor' },
  { id: 'ai', label: 'AI' },
  { id: 'shortcuts', label: 'Shortcuts' },
]

const READING_WIDTHS: { id: ReadingWidth; label: string }[] = [
  { id: 'narrow', label: 'Narrow' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'wide', label: 'Wide' },
]

interface SchemeSwatch {
  id: ColorScheme
  label: string
  light: { paper: string; ink: string; accent: string }
  dark: { paper: string; ink: string; accent: string }
}

const SCHEMES: SchemeSwatch[] = [
  { id: 'warm',  label: 'Warm',  light: { paper: '#f6f4ee', ink: '#0d0d0c', accent: '#d4733a' }, dark: { paper: '#131311', ink: '#f3f0e6', accent: '#e8884a' } },
  { id: 'slate', label: 'Slate', light: { paper: '#f0f2f5', ink: '#0e1116', accent: '#2563eb' }, dark: { paper: '#0f141b', ink: '#e6ecf2', accent: '#3b82f6' } },
  { id: 'sage',  label: 'Sage',  light: { paper: '#f3f1e8', ink: '#1a1d18', accent: '#5e8b54' }, dark: { paper: '#131611', ink: '#e9eadf', accent: '#84b079' } },
  { id: 'rose',  label: 'Rose',  light: { paper: '#f8f0ec', ink: '#1c1715', accent: '#c4576f' }, dark: { paper: '#1a1414', ink: '#f0e6e3', accent: '#db7a8e' } },
  { id: 'mono',  label: 'Mono',  light: { paper: '#ffffff', ink: '#000000', accent: '#000000' }, dark: { paper: '#000000', ink: '#ffffff', accent: '#ffffff' } },
]

const PROVIDER_DEFAULTS: Record<AIProvider, { url: string; model: string }> = {
  mock:      { url: '', model: '' },
  openai:    { url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-4o-mini' },
  anthropic: { url: 'https://api.anthropic.com/v1/messages',      model: 'claude-haiku-4-5-20251001' },
}

export function Settings({ theme, setTheme, settings, onUpdateSettings, push }: SettingsProps) {
  const [active, setActive] = useState<SectionId>('appearance')

  const setProvider = (p: AIProvider) => {
    onUpdateSettings({
      aiProvider: p,
      aiApiUrl: PROVIDER_DEFAULTS[p].url,
      aiModel: PROVIDER_DEFAULTS[p].model,
    })
  }

  return (
    <div data-testid="settings-page" style={{ flex: 1, height: '100%', overflow: 'auto' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '32px 40px 80px' }}>
        <div style={{ marginBottom: 24 }}>
          <div className="label" style={{ marginBottom: 6 }}>Workspace</div>
          <h1 style={{ fontFamily: 'var(--serif)', fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, lineHeight: 1.1 }}>
            Settings
          </h1>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 32 }}>
          <nav style={{ borderRight: '1px solid var(--rule-soft)', paddingRight: 20 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                data-testid={`settings-nav-${s.id}`}
                style={{
                  display: 'block', width: '100%', textAlign: 'left',
                  padding: '8px 10px', border: 0,
                  borderLeft: `2px solid ${active === s.id ? 'var(--accent)' : 'transparent'}`,
                  background: active === s.id ? 'var(--paper-2)' : 'transparent',
                  color: active === s.id ? 'var(--ink)' : 'var(--ink-2)',
                  fontSize: 13, fontFamily: 'var(--sans)',
                  fontWeight: active === s.id ? 500 : 400,
                  cursor: 'pointer', marginBottom: 2,
                }}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div>
            {active === 'appearance' && (
              <SettingsSection title="Appearance" subtitle="Mode, color scheme, and reading width.">
                <SettingRow
                  label="Mode"
                  hint="Light is best for daytime drafting; dark for late-night editing."
                  control={
                    <div style={{ display: 'flex', border: '1px solid var(--rule-soft)' }}>
                      {[{ id: 'light', icon: 'sun', label: 'Light' }, { id: 'dark', icon: 'moon', label: 'Dark' }].map((t, i) => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          data-testid={`theme-${t.id}`}
                          style={{
                            padding: '6px 12px', border: 0,
                            borderRight: i === 0 ? '1px solid var(--rule-soft)' : 0,
                            background: theme === t.id ? 'var(--ink)' : 'transparent',
                            color: theme === t.id ? 'var(--paper)' : 'var(--ink-2)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            fontFamily: 'var(--mono)', fontSize: 11,
                          }}
                        >
                          <Icon name={t.icon} size={12} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  }
                />
                <SettingRow
                  label="Color scheme"
                  hint="Each scheme has a matched light and dark palette."
                  control={
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {SCHEMES.map(s => {
                        const active = settings.colorScheme === s.id
                        const swatch = theme === 'dark' ? s.dark : s.light
                        return (
                          <button
                            key={s.id}
                            onClick={() => onUpdateSettings({ colorScheme: s.id })}
                            data-testid={`scheme-${s.id}`}
                            title={s.label}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 4,
                              padding: 4,
                              border: `2px solid ${active ? 'var(--accent)' : 'var(--rule-soft)'}`,
                              background: 'transparent', cursor: 'pointer',
                            }}
                          >
                            <div style={{ display: 'flex', width: 64, height: 28 }}>
                              <span style={{ flex: 2, background: swatch.paper, borderRight: `1px solid ${swatch.ink}` }} />
                              <span style={{ flex: 1, background: swatch.ink }} />
                              <span style={{ flex: 1, background: swatch.accent }} />
                            </div>
                            <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--ink-2)', textAlign: 'center' }}>{s.label}</span>
                          </button>
                        )
                      })}
                    </div>
                  }
                />
                <SettingRow
                  label="Reading column"
                  hint="The width of the editor and preview panes."
                  control={
                    <div style={{ display: 'flex', border: '1px solid var(--rule-soft)' }}>
                      {READING_WIDTHS.map((w, i) => (
                        <button
                          key={w.id}
                          data-testid={`reading-${w.id}`}
                          onClick={() => onUpdateSettings({ readingWidth: w.id })}
                          style={{
                            padding: '6px 12px', border: 0,
                            borderRight: i < READING_WIDTHS.length - 1 ? '1px solid var(--rule-soft)' : 0,
                            background: settings.readingWidth === w.id ? 'var(--ink)' : 'transparent',
                            color: settings.readingWidth === w.id ? 'var(--paper)' : 'var(--ink-2)',
                            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11,
                          }}>{w.label}</button>
                      ))}
                    </div>
                  }
                />
              </SettingsSection>
            )}

            {active === 'editor' && (
              <SettingsSection title="Editor" subtitle="Auto-save cadence and writing aids.">
                <SettingRow
                  label="Auto-save"
                  hint="Save the document after this long without input."
                  control={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="range"
                        min={500}
                        max={5000}
                        step={250}
                        value={settings.autoSaveDelayMs}
                        onChange={(e) => onUpdateSettings({ autoSaveDelayMs: parseInt(e.target.value, 10) })}
                        data-testid="autosave-range"
                        style={{ width: 160 }}
                      />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--ink-2)', width: 40 }}>
                        {(settings.autoSaveDelayMs / 1000).toFixed(2).replace(/\.?0+$/, '')}s
                      </span>
                    </div>
                  }
                />
                <SettingRow
                  label="Spell check"
                  hint="Use the browser's native spell checker in editable blocks."
                  control={
                    <Toggle
                      on={settings.spellCheck}
                      onToggle={() => onUpdateSettings({ spellCheck: !settings.spellCheck })}
                    />
                  }
                />
              </SettingsSection>
            )}

            {active === 'ai' && (
              <SettingsSection title="AI Assistant" subtitle="Pick a provider. Keys are kept in memory and never leave the browser.">
                <SettingRow
                  label="Provider"
                  hint="Mock returns canned responses. OpenAI and Anthropic call their APIs from the browser."
                  control={
                    <div style={{ display: 'flex', border: '1px solid var(--rule-soft)' }}>
                      {(['mock', 'openai', 'anthropic'] as const).map((p, i) => (
                        <button
                          key={p}
                          onClick={() => setProvider(p)}
                          data-testid={`provider-${p}`}
                          style={{
                            padding: '6px 12px', border: 0,
                            borderRight: i < 2 ? '1px solid var(--rule-soft)' : 0,
                            background: settings.aiProvider === p ? 'var(--ink)' : 'transparent',
                            color: settings.aiProvider === p ? 'var(--paper)' : 'var(--ink-2)',
                            cursor: 'pointer', fontFamily: 'var(--mono)', fontSize: 11, textTransform: 'capitalize',
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  }
                />
                {settings.aiProvider !== 'mock' && (
                  <>
                    <SettingRow
                      label="API URL"
                      hint="POST endpoint. Defaults match the official provider URLs; override for proxies."
                      control={
                        <input
                          type="text"
                          value={settings.aiApiUrl}
                          onChange={(e) => onUpdateSettings({ aiApiUrl: e.target.value })}
                          data-testid="ai-url-input"
                          style={{ width: 320 }}
                        />
                      }
                    />
                    <SettingRow
                      label="API key"
                      hint="Stored in memory only — re-enter after a reload."
                      control={
                        <input
                          type="password"
                          value={settings.aiApiKey}
                          onChange={(e) => onUpdateSettings({ aiApiKey: e.target.value })}
                          placeholder={settings.aiProvider === 'openai' ? 'sk-…' : 'sk-ant-…'}
                          data-testid="ai-key-input"
                          style={{ width: 320 }}
                        />
                      }
                    />
                    <SettingRow
                      label="Model"
                      control={
                        <input
                          type="text"
                          value={settings.aiModel}
                          onChange={(e) => onUpdateSettings({ aiModel: e.target.value })}
                          data-testid="ai-model-input"
                          style={{ width: 320 }}
                        />
                      }
                    />
                    <SettingRow
                      label=""
                      control={
                        <button
                          className="btn"
                          onClick={() => {
                            if (!settings.aiApiKey) push('Add an API key first', 'error')
                            else push('AI configured. Open the AI panel to use it.', 'success')
                          }}
                        >
                          Save & verify (manual)
                        </button>
                      }
                    />
                  </>
                )}
              </SettingsSection>
            )}

            {active === 'shortcuts' && (
              <SettingsSection title="Keyboard shortcuts" subtitle="A subset — full list in the command palette (⌘K).">
                <ShortcutTable />
              </SettingsSection>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="fade-up">
      <h2 style={{ fontFamily: 'var(--serif)', fontSize: 22, fontWeight: 600, margin: '0 0 4px', letterSpacing: '-0.01em' }}>{title}</h2>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 20 }}>{subtitle}</div>
      <div style={{ border: '1px solid var(--rule-soft)' }}>{children}</div>
    </div>
  )
}

function SettingRow({ label, hint, control }: { label: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, padding: '14px 18px', borderBottom: '1px solid var(--rule-softer)' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} data-testid="toggle" style={{
      width: 36, height: 20, background: on ? 'var(--ink)' : 'var(--paper-2)',
      border: '1px solid var(--rule-soft)', position: 'relative', cursor: 'pointer', padding: 0,
    }}>
      <div style={{
        position: 'absolute', top: 1, left: on ? 17 : 1,
        width: 16, height: 16, background: on ? 'var(--accent)' : 'var(--ink-3)',
        transition: 'left 120ms',
      }} />
    </button>
  )
}

function ShortcutTable() {
  const rows = [
    { combo: ['⌘', 'K'], action: 'Open command palette' },
    { combo: ['⌘', 'N'], action: 'New article' },
    { combo: ['⌘', 'B'], action: 'Bold' },
    { combo: ['⌘', 'I'], action: 'Italic' },
    { combo: ['⌘', 'U'], action: 'Underline' },
    { combo: ['⌘', 'K'], action: 'Insert link (when editor focused)' },
    { combo: ['⌘', '/'], action: 'Toggle AI panel' },
    { combo: ['Esc'], action: 'Close panel / modal' },
  ]
  return (
    <div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 18px', borderBottom: i < rows.length - 1 ? '1px solid var(--rule-softer)' : 0 }}>
          <div style={{ flex: 1, fontSize: 13 }}>{r.action}</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {r.combo.map((k, j) => <Kbd key={j}>{k}</Kbd>)}
          </div>
        </div>
      ))}
    </div>
  )
}
