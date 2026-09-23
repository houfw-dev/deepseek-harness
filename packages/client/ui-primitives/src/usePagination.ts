// usePagination: page state for a controlled list. The caller owns the
// filtered list and hands it over; the hook slices the visible page and
// exposes the 1-based page the Pagination primitive renders.

import { useEffect, useMemo, useState } from 'react'

/** State returned by {@link usePagination} for a list of `T`. */
export interface PaginationState<T> {
  /** 1-based current page, always clamped into `[1, pageCount]`. */
  page: number
  /** Total page count; at least 1. */
  pageCount: number
  /** The items on the current page. */
  paged: readonly T[]
  /** Request navigation to a 1-based page. */
  setPage: (page: number) => void
}

/**
 * Split a filtered list into fixed-size pages for the controlled
 * {@link Pagination} primitive. A change to `resetKey` (the active filters)
 * restarts from page one; shrinking the list clamps the page back so a
 * shrinking last page never leaves the table empty.
 * @param items - the full filtered list.
 * @param pageSize - rows per page.
 * @param resetKey - value whose change restarts from page one.
 * @returns the current page, page count, visible slice, and a setter.
 */
export function usePagination<T>(
  items: readonly T[],
  pageSize: number,
  resetKey: unknown,
): PaginationState<T> {
  const [page, setPage] = useState(1)

  useEffect(() => { setPage(1) }, [resetKey])

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(Math.max(1, Math.trunc(page)), pageCount)

  // Clamp back when the filtered set shrinks under the current page
  // (e.g. a delete empties the last page).
  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const start = (safePage - 1) * pageSize
  const paged = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize],
  )

  return { page: safePage, pageCount, paged, setPage }
}
