// DataTable: the shared workbench results table. Panels supply the header
// cells and row elements; this shell owns the result-count line, the empty
// state, scroll wrap, and the shared table chrome (padding, borders, hover).
// The icon-only row-delete button lives here too so every workbench panel
// renders it identically — and deletes only after a confirmation dialog.

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Button } from './Button.tsx'
import { ConfirmDialog } from './ConfirmDialog.tsx'
import { IconTrashOutlineRegular } from './icons/index.tsx'
import { EmptyState } from './FormKit.tsx'
import css from './DataTable.module.css'

/** Props for the results table. */
export interface DataTableProps {
  /** Optional result-count line rendered above the table (and empty state). */
  meta?: ReactNode
  /** Show the centered empty state instead of the table when true. */
  empty: boolean
  /** Empty-state message (a filter matched nothing, or the list has no rows). */
  emptyLabel: ReactNode
  /** Header cells (`<th scope="col">…</th>`), in column order. */
  headers: ReactNode
  /** Row elements (`<tr>…</tr>`). */
  children: ReactNode
}

/**
 * Render the optional count line and the workbench results table, or the empty
 * state when `empty`.
 * @param props - count line, empty flag, empty message, header cells, and rows.
 * @returns the count line plus the empty state or table element tree.
 */
export function DataTable({ meta, empty, emptyLabel, headers, children }: DataTableProps) {
  return (
    <>
      {meta !== undefined ? <div className={css.meta}>{meta}</div> : null}
      {empty
        ? <EmptyState>{emptyLabel}</EmptyState>
        : (
          <div className={css.tableWrap}>
            <table className={css.table}>
              <thead>
                <tr>{headers}</tr>
              </thead>
              <tbody>{children}</tbody>
            </table>
          </div>
        )}
    </>
  )
}

/** The shared `count`/`empty` dictionary keys a results-table host must provide. */
export type ResultsTableDictionaryKey = 'count' | 'empty'

/** A namespace translator narrowed to the shared {@link ResultsTableDictionaryKey} keys. */
export type ResultsTableTranslate = (
  key: ResultsTableDictionaryKey,
  params?: Record<string, unknown>,
) => string

/** Props for the results region (count line, table, and empty state). */
export interface ResultsTableProps {
  /** Namespace translator carrying the shared `count` ({ count }) and `empty` keys. */
  t: ResultsTableTranslate
  /** Whether the initial list load has completed (avoids an empty flash). */
  loaded: boolean
  /** Total filtered row count (the list behind pagination). */
  count: number
  /** Header cells (`<th scope="col">…</th>`), in column order. */
  headers: ReactNode
  /** Paged row elements (`<tr>…</tr>`). */
  children: ReactNode
}

/**
 * Render the workbench results region: the result-count line and the table, or
 * the empty state once loading finished with no rows.
 * @param props - translator, loaded flag, filtered total, header cells, rows.
 * @returns the count line plus the table or empty state element tree.
 */
export function ResultsTable({ t, loaded, count, headers, children }: ResultsTableProps) {
  return (
    <DataTable
      meta={t('count', { count })}
      empty={loaded && count === 0}
      emptyLabel={t('empty')}
      headers={headers}
    >
      {children}
    </DataTable>
  )
}

/** Localized copy for the delete-confirmation dialog. */
export interface DeleteConfirmCopy {
  /** Dialog heading, e.g. "确认删除" / "Confirm deletion". */
  title: string
  /** Supporting text naming the row and the consequence. */
  message: ReactNode
  /** Destructive button label, e.g. "删除" / "Delete". */
  confirmLabel: string
  /** Cancel button label. */
  cancelLabel: string
}

/** Props for the icon-only delete button in a row actions cell. */
export interface DeleteRowButtonProps {
  /** Accessible label, usually including the row's title. */
  label: string
  /** Localized confirmation-dialog copy; the row is deleted only on confirm. */
  confirm: DeleteConfirmCopy
  /** Keep the button visible but inert outside the row's deletable state. */
  disabled?: boolean
  /** Called only after the user confirms the delete dialog. */
  onDelete: () => void
}

/**
 * Ghost icon button that opens a delete-confirmation dialog for one table row;
 * the row is deleted only when the user confirms.
 * @param props - accessible label, localized confirm copy, optional disabled
 *   flag, and the delete callback.
 * @returns the button plus its confirmation dialog.
 */
export function DeleteRowButton({ label, confirm, disabled = false, onDelete }: DeleteRowButtonProps) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className={css.deleteButton}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => { setOpen(true) }}
      >
        <IconTrashOutlineRegular size={16} />
      </Button>
      <ConfirmDialog
        open={open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        cancelLabel={confirm.cancelLabel}
        onCancel={() => { setOpen(false) }}
        onConfirm={() => { setOpen(false); onDelete() }}
      />
    </>
  )
}
