import { useEffect } from 'react'

/**
 * Sets the document title and meta description for a route, restoring the
 * previous description on unmount so navigating away does not leave a stale one.
 */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    document.title = `${title} — Radiance`

    const meta = document.querySelector('meta[name="description"]')
    const previous = meta?.getAttribute('content') ?? null
    meta?.setAttribute('content', description)

    return () => {
      if (previous !== null) meta?.setAttribute('content', previous)
    }
  }, [title, description])
}
