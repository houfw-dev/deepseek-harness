// ConfirmDialog: a small destructive-action confirmation card. Like Modal it
// portals to document.body, but it renders at the above-modal layer (z-1100,
// the same one Menu/Toast/HoverCard use) so it floats over an already-open
// workbench modal. Escape is swallowed on the window-capture phase so the key
// closes this dialog without also dismissing the modal beneath it (the shared
// Modal listens for Escape on the document-bubble phase).

import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { Button } from './Button.tsx'
import { IconWarningOutlineRegular } from './icons/index.tsx'
import css from './ConfirmDialog.module.css'

/** Props for the destructive-action confirmation dialog. */
export interface ConfirmDialogProps {
  /** Whether the dialog is showing. */
  open: boolean
  /** Dialog heading (also the accessible name). */
  title: string
  /** Supporting text under the title (name the target and the consequence). */
  message: ReactNode
  /** Destructive action label, e.g. "删除" / "Delete". */
  confirmLabel: string
  /** Cancel button label. */
  cancelLabel: string
  /** Confirm callback (the dialog closes itself first). */
  onConfirm: () => void
  /** Cancel callback (mask click, Escape, or the cancel button). */
  onCancel: () => void
}

/**
 * Render a centered confirmation card over the page, gated to a deliberate
 * confirm before a destructive action.
 * @param props - open flag, title/message, button labels, and the two callbacks.
 * @returns null when closed; otherwise the portaled overlay tree.
 */
export function ConfirmDialog({
  open, title, message, confirmLabel, cancelLabel, onConfirm, onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      // Capture on window fires before the beneath-modal's document-bubble
      // Escape listener; stop propagation so only this dialog closes.
      e.stopPropagation()
      onCancel()
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [open, onCancel])

  if (!open) return null

  return createPortal((
    <div className={css.root} role="presentation">
      <div className={css.mask} aria-hidden="true" onClick={onCancel} />
      <div className={css.dialog} role="alertdialog" aria-modal="true" aria-label={title}>
        <div className={css.warning}>
          <IconWarningOutlineRegular size={20} className={css.warningIcon} />
          <div className={css.text}>
            <h2 className={css.title}>{title}</h2>
            <p className={css.message}>{message}</p>
          </div>
        </div>
        <div className={css.footer}>
          <Button variant="outline" className={css.action} onClick={onCancel} autoFocus>
            {cancelLabel}
          </Button>
          <Button variant="ghost" className={clsx(css.action, css.danger)} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  ), document.body)
}
