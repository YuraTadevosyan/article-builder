import { useState, useCallback } from 'react'
import { uid } from '../lib/utils'
import type { Toast, ToastTone } from '../types'

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const push = useCallback((text: string, tone: ToastTone = 'default') => {
    const id = uid('t')
    setToasts(t => [...t, { id, text, tone }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  return { toasts, push, dismiss }
}
