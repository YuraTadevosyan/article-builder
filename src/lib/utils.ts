import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uid(prefix = 'id'): string {
  return prefix + '-' + Math.random().toString(36).slice(2, 8)
}

export function fmtDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date('2026-04-27T10:00:00Z')
  const diffMs = now.getTime() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return mins + 'm ago'
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return hrs + 'h ago'
  const days = Math.round(hrs / 24)
  if (days < 7) return days + 'd ago'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function fmtDateLong(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function stripTags(s: string): string {
  return (s || '').replace(/<[^>]+>/g, '')
}
