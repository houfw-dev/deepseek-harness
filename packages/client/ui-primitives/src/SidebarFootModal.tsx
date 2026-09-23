// SidebarFootModal: the chrome shared by sidebar-foot entries that open a
// modal — the SidebarFootAction trigger row plus the Modal it opens. The open
// state is component-local viewing state; callers own only the trigger
// identity (icon, label) and the modal body. Modal sizing stays with the
// caller through `dialogClassName` / `contentClassName`.

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Modal } from './Modal.tsx'
import { SidebarFootAction } from './SidebarFootAction.tsx'

/** Props of the sidebar-foot trigger + modal pair. */
export interface SidebarFootModalProps {
  /** False in the collapsed rail: the label hides and the tooltip takes over. */
  wide: boolean
  /** Trigger label (also the tooltip text and the default modal title). */
  label: string
  /** Modal title; defaults to {@link label}. */
  title?: string | undefined
  /** Accessible label of the modal close button. */
  closeLabel: string
  /** Trigger icon; the caller sizes it for wide (16px) vs rail (18px). */
  icon: ReactNode
  /** Wide-only group caption above the trigger (see SidebarFootAction). */
  groupHeader?: string | undefined
  /** Collapse group key (see SidebarFootAction; the band leader also sets groupHeader). */
  group?: string | undefined
  /** Initial collapsed state for the band; the band leader sets this (see SidebarFootAction). */
  defaultCollapsed?: boolean | undefined
  /** Class on the Modal box, for per-surface size overrides. */
  dialogClassName?: string | undefined
  /** Class on the Modal scroll region, for per-surface overflow handling. */
  contentClassName?: string | undefined
  /** Modal body. */
  children?: ReactNode | undefined
}

/**
 * Render a sidebar-foot trigger row and the modal it opens.
 * @param props - wide flag, label/title, icon, modal class overrides, body.
 * @returns the trigger button (with tooltip when collapsed) plus the modal.
 */
export function SidebarFootModal({
  wide,
  label,
  title,
  closeLabel,
  icon,
  groupHeader,
  group,
  defaultCollapsed,
  dialogClassName,
  contentClassName,
  children,
}: SidebarFootModalProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <SidebarFootAction
        wide={wide}
        label={label}
        icon={icon}
        onAction={() => { setOpen(true) }}
        groupHeader={groupHeader}
        group={group}
        defaultCollapsed={defaultCollapsed}
        ariaHasPopup="dialog"
        ariaExpanded={open}
      />
      <Modal
        open={open}
        onClose={() => { setOpen(false) }}
        title={title ?? label}
        closeLabel={closeLabel}
        className={dialogClassName ?? ''}
        contentClassName={contentClassName ?? ''}
      >
        {children}
      </Modal>
    </>
  )
}
