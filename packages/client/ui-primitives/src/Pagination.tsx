// Pagination: a locale-agnostic pager (Previous, page numbers, Next). The
// kit owns no copy — callers pass every label — and no data: the caller owns
// the page state and slices its own list, handing the pager the 1-based page
// and total page count.

import type { ReactNode } from 'react'
import { Button } from './Button.tsx'
import css from './Pagination.module.css'

/** Copy the primitive renders; the owning feature supplies its own locale. */
export interface PaginationLabels {
  /** Accessible name for the whole pager navigation landmark. */
  nav: string
  /** Previous-page button contents. */
  prev: ReactNode
  /** Next-page button contents. */
  next: ReactNode
  /** Accessible name for a numbered page button, given its 1-based number. */
  page: (page: number) => string
}

/** The shared `pager.*` dictionary keys a pager-hosting namespace must provide. */
export type PagerDictionaryKey = 'pager.nav' | 'pager.prev' | 'pager.next' | 'pager.page'

/** A namespace translator narrowed to the shared {@link PagerDictionaryKey} keys. */
export type PagerTranslate = (key: PagerDictionaryKey, params?: Record<string, unknown>) => string

/**
 * Build {@link PaginationLabels} from a namespace translator that carries the
 * shared `pager.*` keys, so every feature wires the pager with one call.
 * @param t - the namespace translator.
 * @returns the labels the pager renders.
 */
export function pagerLabels(t: PagerTranslate): PaginationLabels {
  return {
    nav: t('pager.nav'),
    prev: t('pager.prev'),
    next: t('pager.next'),
    page: page => t('pager.page', { page }),
  }
}

/** Props of the controlled pager. */
export interface PaginationProps {
  /** 1-based current page. */
  page: number
  /** Total page count; clamped to at least 1. */
  pageCount: number
  /** Request navigation to a 1-based page. */
  onPageChange: (page: number) => void
  /** Button and navigation labels. */
  labels: PaginationLabels
}

/**
 * Render Previous / page-number / Next controls for a controlled list.
 * @param props - the 1-based page, total page count, a change callback, and labels.
 * @returns the navigation element tree.
 */
export function Pagination({ page, pageCount, onPageChange, labels }: PaginationProps) {
  const total = Math.max(1, Math.trunc(pageCount))
  const current = Math.min(Math.max(1, Math.trunc(page)), total)
  const pages = Array.from({ length: total }, (_, index) => index + 1)

  return (
    <nav className={css.pager} aria-label={labels.nav}>
      <Button
        variant="outline"
        size="sm"
        className={css.edge}
        disabled={current <= 1}
        onClick={() => { onPageChange(current - 1) }}
      >
        {labels.prev}
      </Button>
      <span className={css.pages}>
        {pages.map(number => (
          <Button
            key={number}
            variant={number === current ? 'primary' : 'ghost'}
            size="sm"
            className={css.page}
            aria-label={labels.page(number)}
            aria-current={number === current ? 'page' : undefined}
            onClick={() => { onPageChange(number) }}
          >
            {number}
          </Button>
        ))}
      </span>
      <Button
        variant="outline"
        size="sm"
        className={css.edge}
        disabled={current >= total}
        onClick={() => { onPageChange(current + 1) }}
      >
        {labels.next}
      </Button>
    </nav>
  )
}
