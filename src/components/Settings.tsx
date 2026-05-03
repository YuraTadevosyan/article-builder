import { useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { AppSettings, ColorScheme, ReadingWidth, AIProvider } from '@/types'

interface SettingsProps {
  theme: string
  setTheme: (t: string) => void
  settings: AppSettings
  onUpdateSettings: (patch: Partial<AppSettings>) => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

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
  const [active, setActive] = useState('appearance')

  const setProvider = (p: AIProvider) => {
    onUpdateSettings({
      aiProvider: p,
      aiApiUrl: PROVIDER_DEFAULTS[p].url,
      aiModel: PROVIDER_DEFAULTS[p].model,
    })
  }

  return (
    <div data-testid="settings-page" className="h-full flex-1 overflow-auto">
      <div className="mx-auto max-w-[980px] px-4 pb-16 pt-6 md:px-10 md:pb-20 md:pt-8">
        <div className="mb-6">
          <div className="label mb-1.5">Workspace</div>
          <h1 className="m-0 font-serif text-2xl font-bold leading-tight tracking-tight md:text-3xl">Settings</h1>
        </div>

        <Tabs value={active} onValueChange={setActive} className="w-full">
          <TabsList>
            <TabsTrigger value="appearance" data-testid="settings-nav-appearance">Appearance</TabsTrigger>
            <TabsTrigger value="editor"     data-testid="settings-nav-editor">Editor</TabsTrigger>
            <TabsTrigger value="ai"         data-testid="settings-nav-ai">AI</TabsTrigger>
            <TabsTrigger value="shortcuts"  data-testid="settings-nav-shortcuts">Shortcuts</TabsTrigger>
          </TabsList>

          {/* Appearance */}
          <TabsContent value="appearance">
            <SettingsSection title="Appearance" subtitle="Mode, color scheme, and reading width.">
              <SettingRow label="Mode" hint="Light is best for daytime drafting; dark for late-night editing.">
                <div className="flex border border-border">
                  {[
                    { id: 'light', label: 'Light', Icon: Sun },
                    { id: 'dark',  label: 'Dark',  Icon: Moon },
                  ].map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => setTheme(t.id)}
                      data-testid={`theme-${t.id}`}
                      className={cn(
                        'flex cursor-pointer items-center gap-1.5 border-0 px-3 py-1.5 font-mono text-[11px] transition-colors',
                        i === 0 && 'border-r border-r-border',
                        theme === t.id ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85'
                      )}
                    >
                      <t.Icon size={12} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </SettingRow>

              <SettingRow label="Color scheme" hint="Each scheme has a matched light and dark palette.">
                <div className="flex flex-wrap gap-2">
                  {SCHEMES.map(s => {
                    const isActive = settings.colorScheme === s.id
                    const swatch = theme === 'dark' ? s.dark : s.light
                    return (
                      <button
                        key={s.id}
                        onClick={() => onUpdateSettings({ colorScheme: s.id })}
                        data-testid={`scheme-${s.id}`}
                        title={s.label}
                        className={cn(
                          'flex cursor-pointer flex-col items-stretch gap-1 bg-transparent p-1 transition-colors',
                          isActive ? 'border-2 border-accent' : 'border-2 border-border'
                        )}
                      >
                        <div className="flex h-7 w-16">
                          <span className="flex-[2] border-r" style={{ background: swatch.paper, borderRightColor: swatch.ink }} />
                          <span className="flex-1" style={{ background: swatch.ink }} />
                          <span className="flex-1" style={{ background: swatch.accent }} />
                        </div>
                        <span className="mono text-center text-[10px] text-foreground/85">{s.label}</span>
                      </button>
                    )
                  })}
                </div>
              </SettingRow>

              <SettingRow label="Reading column" hint="The width of the editor and preview panes.">
                <div className="flex border border-border">
                  {READING_WIDTHS.map((w, i) => (
                    <button
                      key={w.id}
                      data-testid={`reading-${w.id}`}
                      onClick={() => onUpdateSettings({ readingWidth: w.id })}
                      className={cn(
                        'cursor-pointer border-0 px-3 py-1.5 font-mono text-[11px] transition-colors',
                        i < READING_WIDTHS.length - 1 && 'border-r border-r-border',
                        settings.readingWidth === w.id ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85'
                      )}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </SettingsSection>
          </TabsContent>

          {/* Editor */}
          <TabsContent value="editor">
            <SettingsSection title="Editor" subtitle="Auto-save cadence and writing aids.">
              <SettingRow label="Auto-save" hint="Save the document after this long without input.">
                <div className="flex w-[230px] items-center gap-2.5">
                  <Slider
                    min={500}
                    max={5000}
                    step={250}
                    value={[settings.autoSaveDelayMs]}
                    onValueChange={([v]) => onUpdateSettings({ autoSaveDelayMs: v })}
                    data-testid="autosave-range"
                    className="flex-1"
                  />
                  <span className="mono w-10 text-[11px] text-foreground/85">
                    {(settings.autoSaveDelayMs / 1000).toFixed(2).replace(/\.?0+$/, '')}s
                  </span>
                </div>
              </SettingRow>

              <SettingRow label="Spell check" hint="Use the browser's native spell checker in editable blocks.">
                <Switch
                  checked={settings.spellCheck}
                  onCheckedChange={(v) => onUpdateSettings({ spellCheck: v })}
                  data-testid="toggle-spellcheck"
                />
              </SettingRow>
            </SettingsSection>
          </TabsContent>

          {/* AI */}
          <TabsContent value="ai">
            <SettingsSection title="AI Assistant" subtitle="Pick a provider. Keys are kept in memory and never leave the browser.">
              <SettingRow label="Provider" hint="Mock returns canned responses. OpenAI and Anthropic call their APIs from the browser.">
                <Select value={settings.aiProvider} onValueChange={(v) => setProvider(v as AIProvider)}>
                  <SelectTrigger className="w-full sm:w-[200px]" data-testid="provider-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mock">Mock (offline)</SelectItem>
                    <SelectItem value="openai">OpenAI</SelectItem>
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>

              {settings.aiProvider !== 'mock' && (
                <>
                  <SettingRow label="API URL" hint="POST endpoint. Defaults match the official provider URLs; override for proxies.">
                    <Input
                      type="text"
                      className="w-full sm:w-[320px]"
                      value={settings.aiApiUrl}
                      onChange={(e) => onUpdateSettings({ aiApiUrl: e.target.value })}
                      data-testid="ai-url-input"
                    />
                  </SettingRow>

                  <SettingRow label="API key" hint="Stored in memory only — re-enter after a reload.">
                    <Input
                      type="password"
                      className="w-full sm:w-[320px]"
                      value={settings.aiApiKey}
                      onChange={(e) => onUpdateSettings({ aiApiKey: e.target.value })}
                      placeholder={settings.aiProvider === 'openai' ? 'sk-…' : 'sk-ant-…'}
                      data-testid="ai-key-input"
                    />
                  </SettingRow>

                  <SettingRow label="Model">
                    <Input
                      type="text"
                      className="w-full sm:w-[320px]"
                      value={settings.aiModel}
                      onChange={(e) => onUpdateSettings({ aiModel: e.target.value })}
                      data-testid="ai-model-input"
                    />
                  </SettingRow>

                  <SettingRow label="">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!settings.aiApiKey) push('Add an API key first', 'error')
                        else push('AI configured. Open the AI panel to use it.', 'success')
                      }}
                    >
                      Save & verify (manual)
                    </Button>
                  </SettingRow>
                </>
              )}
            </SettingsSection>
          </TabsContent>

          {/* Shortcuts */}
          <TabsContent value="shortcuts">
            <SettingsSection title="Keyboard shortcuts" subtitle="A subset — full list in the command palette (⌘K).">
              <ShortcutTable />
            </SettingsSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SettingsSection({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="fade-up">
      <h2 className="m-0 mb-1 font-serif text-xl font-semibold tracking-tight">{title}</h2>
      <div className="mb-5 text-[13px] text-muted-foreground">{subtitle}</div>
      <div className="border border-border">{children}</div>
    </div>
  )
}

function SettingRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--rule-softer)] px-3 py-3.5 last:border-b-0 sm:flex-row sm:items-start sm:gap-6 sm:px-4">
      <div className="min-w-0 flex-1">
        {label && <Label className="mb-0.5 block text-[13px] font-medium">{label}</Label>}
        {hint && <div className="text-[12px] leading-relaxed text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
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
        <div key={i} className={cn('flex items-center px-4 py-2.5', i < rows.length - 1 && 'border-b border-[var(--rule-softer)]')}>
          <div className="flex-1 text-[13px]">{r.action}</div>
          <div className="flex gap-1">
            {r.combo.map((k, j) => (
              <span key={j} className="border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground/85">{k}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
