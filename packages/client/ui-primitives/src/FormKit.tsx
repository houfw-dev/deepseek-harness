// FormKit: the shared inline-form card pieces used by the workbench panels
// (add/edit/submit flows render as in-panel cards because the modal shell has
// no nested-dialog support), plus the panel error banner, empty state, and
// growing search field.

import type { InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from './Button.tsx'
import { Input } from './Input.tsx'
import { Pagination, type PaginationLabels } from './Pagination.tsx'
import { IconSearchOutlineRegular } from './icons/index.tsx'
import css from './FormKit.module.css'

/**
 * Bordered card that replaces the query/result region while a form is open.
 * @param props.title - the card heading.
 * @returns the card element with its form fields as children.
 */
export function FormCard({ title, className, children }: {
  title: ReactNode
  /** Optional panel-specific layout classes merged onto the card element. */
  className?: string | undefined
  children: ReactNode
}) {
  return (
    <div className={clsx(css.formCard, className)}>
      <h3 className={css.formTitle}>{title}</h3>
      {children}
    </div>
  )
}

/**
 * One labeled field: the caption above the control.
 * @param props.label - the field caption.
 * @returns a label wrapping the caption and the control children.
 */
export function FormField({ label, children }: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <label className={css.field}>
      <span className={css.fieldLabel}>{label}</span>
      {children}
    </label>
  )
}

/**
 * A field row for a non-labelable control (a chip radiogroup or a native
 * select): a caption above the control, without the label association.
 * @param props.label - the field caption.
 * @returns a div containing the caption and the control children.
 */
export function FormFieldGroup({ label, children }: {
  label: ReactNode
  children: ReactNode
}) {
  return (
    <div className={css.field}>
      <span className={css.fieldLabel}>{label}</span>
      {children}
    </div>
  )
}

/**
 * A labeled single-line text/url/number input field; input attributes pass
 * through to the shared {@link Input}.
 * @param props.label - the field caption.
 * @returns the labeled field.
 */
export function TextField({ label, className, ...rest }: {
  label: ReactNode
  className?: string | undefined
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <FormField label={label}>
      <Input className={clsx(css.fieldInput, className)} {...rest} />
    </FormField>
  )
}

/**
 * Split a comma-separated tag field (ASCII or Chinese comma) into trimmed,
 * non-empty tags.
 * @param raw - the raw tag input text.
 * @returns the parsed tag list.
 */
export function parseTags(raw: string): string[] {
  return raw
    .split(/[,，]/)
    .map(tag => tag.trim())
    .filter(tag => tag !== '')
}

/** Props for {@link TagsField}. */
export interface TagsFieldProps {
  /** The field caption. */
  label: ReactNode
  /** The raw comma-separated tag text. */
  value: string
  /** Optional input placeholder. */
  placeholder?: string
  /** Called with the new raw text on every edit. */
  onValueChange: (value: string) => void
}

/**
 * A labeled single-line field for comma-separated tags; the caller parses the
 * raw text with {@link parseTags} on submit.
 * @param props - caption, raw value, optional placeholder, change callback.
 * @returns the labeled tag input.
 */
export function TagsField({ label, value, placeholder, onValueChange }: TagsFieldProps) {
  return (
    <TextField
      label={label}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(event) => { onValueChange(event.target.value) }}
    />
  )
}

/**
 * A validation message inside a form card (announced via the alert role).
 * @returns the alert paragraph.
 */
export function FormError({ children }: { children: ReactNode }) {
  return <p className={css.formError} role="alert">{children}</p>
}

/**
 * The form's button row; buttons are right-aligned.
 * @returns the action row containing the cancel/confirm buttons.
 */
export function FormActions({ children }: { children: ReactNode }) {
  return <div className={css.formActions}>{children}</div>
}

/**
 * The form card's closing block: an optional validation alert followed by the
 * right-aligned cancel and confirm buttons.
 * @param props.error - whether the validation alert is shown.
 * @param props.errorLabel - the validation alert text.
 * @param props.cancelLabel - the dismiss button label.
 * @param props.confirmLabel - the submit button label.
 * @param props.confirmIcon - the submit button leading icon.
 * @param props.onCancel - dismiss callback.
 * @param props.onConfirm - submit callback.
 * @returns the alert (when active) and the button row.
 */
export function FormFooter({ error, errorLabel, cancelLabel, confirmLabel, confirmIcon, onCancel, onConfirm }: {
  error: boolean
  errorLabel: ReactNode
  cancelLabel: ReactNode
  confirmLabel: ReactNode
  confirmIcon: ReactNode
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <>
      {error ? <FormError>{errorLabel}</FormError> : null}
      <FormActions>
        <Button variant="outline" size="sm" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant="primary" size="sm" icon={confirmIcon} onClick={onConfirm}>{confirmLabel}</Button>
      </FormActions>
    </>
  )
}

/**
 * A panel-level failure banner (a failed host call or unavailable store).
 * @returns the alert banner paragraph.
 */
export function ErrorBanner({ children }: { children: ReactNode }) {
  return <p className={css.error} role="alert">{children}</p>
}

/**
 * Centered region shown when a list or filter matches nothing.
 * @returns the status region.
 */
export function EmptyState({ children }: { children: ReactNode }) {
  return <div className={css.empty} role="status">{children}</div>
}

/**
 * The workbench list search box: a growing input with a leading search icon.
 * @param props.value - the current query text.
 * @param props.placeholder - the input placeholder (also used as the accessible label).
 * @param props.ariaLabel - optional explicit accessible label.
 * @param props.onValueChange - called with the new query text on every edit.
 * @param props.className - optional extra class for the query-row layout.
 * @returns the search input.
 */
export function SearchField({ value, placeholder, ariaLabel, onValueChange, className }: {
  value: string
  placeholder?: string
  ariaLabel?: string
  onValueChange: (value: string) => void
  className?: string | undefined
}) {
  return (
    <Input
      className={clsx(css.searchInput, className)}
      icon={<IconSearchOutlineRegular size={16} />}
      type="text"
      value={value}
      placeholder={placeholder}
      aria-label={ariaLabel ?? placeholder}
      onChange={(event) => { onValueChange(event.target.value) }}
    />
  )
}

/**
 * The workbench list pager: renders nothing until the list spans more than one
 * page, then the shared {@link Pagination} control.
 * @param props.page - the current 1-based page.
 * @param props.pageCount - the total number of pages.
 * @param props.onPageChange - called with the requested page.
 * @param props.labels - localized pager labels from `pagerLabels(t)`.
 * @returns the pager element, or null.
 */
export function ListPager({ page, pageCount, onPageChange, labels }: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  labels: PaginationLabels
}) {
  if (pageCount <= 1) return null
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      onPageChange={onPageChange}
      labels={labels}
    />
  )
}
