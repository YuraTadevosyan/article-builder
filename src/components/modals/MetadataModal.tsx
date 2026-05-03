import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tag } from '../ui/Tag'
import { CoverPh } from '../ui/CoverPh'
import { TAG_LIBRARY } from '@/data/seed'
import type { Article, CoverKind } from '@/types'
import { cn } from '@/lib/utils'

interface MetadataModalProps {
  open: boolean
  article: Article | null
  onClose: () => void
  onSave: (id: string, patch: Partial<Article>) => void
  push: (text: string, tone?: 'success' | 'error' | 'default') => void
}

export function MetadataModal({ open, article, onClose, onSave, push }: MetadataModalProps) {
  const [draft, setDraft] = useState<Partial<Article>>(article || {})

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(article || {})
  }, [article])

  if (!article) return null

  const toggleTag = (t: string) => {
    const has = (draft.tags || []).includes(t)
    setDraft(d => ({ ...d, tags: has ? (d.tags || []).filter(x => x !== t) : [...(d.tags || []), t] }))
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[620px] p-0">
        <DialogHeader>
          <div>
            <DialogTitle>Article metadata</DialogTitle>
            <DialogDescription>Title, description, tags, cover and SEO preview.</DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 p-5">
          <div className="space-y-1.5">
            <Label htmlFor="meta-title">Title</Label>
            <Input
              id="meta-title"
              data-testid="meta-title-input"
              value={draft.title || ''}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="meta-desc">Description</Label>
            <Textarea
              id="meta-desc"
              rows={2}
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
            <div className="text-[11px] text-muted-foreground">Shown on the dashboard and in social previews.</div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex w-fit border border-border">
              {(['Draft', 'Published'] as const).map((s, i) => (
                <button
                  key={s}
                  onClick={() => setDraft({ ...draft, status: s })}
                  className={cn(
                    'cursor-pointer border-0 px-4 py-2 font-mono text-[11px] transition-colors',
                    i === 0 && 'border-r border-r-border',
                    draft.status === s ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/85'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_LIBRARY.map(t => (
                <Tag key={t} label={t} active={(draft.tags || []).includes(t)} onClick={() => toggleTag(t)} />
              ))}
            </div>
            <div className="text-[11px] text-muted-foreground">Click to toggle.</div>
          </div>

          <div className="space-y-1.5">
            <Label>Cover image</Label>
            <div className="grid grid-cols-4 gap-2">
              {(['ph-warm', 'ph-cool', 'ph-paper', 'ph-grid'] as CoverKind[]).map(k => (
                <button
                  key={k}
                  onClick={() => setDraft({ ...draft, cover: k })}
                  className={cn(
                    'cursor-pointer bg-transparent p-0',
                    draft.cover === k ? 'border-2 border-foreground' : 'border border-border'
                  )}
                >
                  <CoverPh kind={k} height={56} />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>SEO preview</Label>
            <div className="border border-border bg-secondary p-3">
              <div className="mono mb-1 text-[10px] text-[var(--green)]">field.notes › articles</div>
              <div className="mb-1 font-serif text-base font-medium" style={{ color: '#1a4ed8' }}>{draft.title}</div>
              <div className="text-xs leading-relaxed text-foreground/75">{draft.description}</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            data-testid="meta-save-btn"
            onClick={() => { onSave(article.id, draft); push('Metadata saved', 'success'); onClose() }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
