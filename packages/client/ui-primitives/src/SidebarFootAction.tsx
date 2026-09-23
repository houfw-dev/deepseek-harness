// SidebarFootAction: the chrome shared by sidebar-foot entries that fire a
// direct action instead of opening a modal — a 42px trigger row (icon + label
// in the wide sidebar, a 36px rail circle with a tooltip when collapsed) that
// invokes `onAction` on click. It is the trigger half of SidebarFootModal,
// split out so one-click foot entries (e.g. sign-out) match the modal openers
// exactly without opening anything.

import { useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { SidebarGroupToggle, useSidebarGroups } from './SidebarGroupToggle.tsx'
import { Tooltip } from './Tooltip.tsx'
import css from './SidebarFoot.module.css'

/** Props of the sidebar-foot direct-action trigger. */
export interface SidebarFootActionProps {
  /** False in the collapsed rail: the label hides and the tooltip takes over. */
  wide: boolean
  /** Trigger label (also the tooltip text when collapsed). */
  label: string
  /** Trigger icon; the caller sizes it for wide (16px) vs rail (18px). */
  icon: ReactNode
  /** Invoked on trigger activation. */
  onAction: () => void
  /**
   * Wide-only group caption rendered above the trigger. The first entry of
   * each sidebar group sets this so the shell itself stays business-agnostic;
   * collapsed rail renders no captions.
   */
  groupHeader?: string | undefined
  /**
   * Collapse group key. Every entry in the same sidebar band shares one
   * stable key; the band's lowest-order entry also sets {@link groupHeader},
   * so its caption renders as the collapse toggle. When the sidebar shell
   * collapses the group (wide mode only), every entry carrying the key hides
   * until the caption is clicked again. Entries without a key never collapse.
   */
  group?: string | undefined
  /**
   * Initial state for the band, set by its leader (the entry that also sets
   * `groupHeader`): true makes the group start collapsed in the wide sidebar.
   * Reported to the shell through context before first paint; user toggles
   * override it. The rail and groups without a provider ignore it.
   */
  defaultCollapsed?: boolean | undefined
  /** ARIA `haspopup` for a trigger that opens a popover (the modal variant sets `"dialog"`). */
  ariaHasPopup?: 'dialog' | undefined
  /** ARIA `expanded` for a trigger that toggles a popover (the modal variant tracks open state). */
  ariaExpanded?: boolean | undefined
}

/**
 * Render a sidebar-foot trigger row that fires `onAction` on click.
 * @param props - wide flag, label, icon, action callback, optional group
 *   caption/collapse key, and popover ARIA.
 * @returns the optional group caption (collapse toggle for a group leader)
 *   plus the trigger button (tooltip when collapsed); the trigger hides while
 *   its group is collapsed in the wide sidebar.
 */
export function SidebarFootAction({
  wide,
  label,
  icon,
  onAction,
  groupHeader,
  group,
  defaultCollapsed,
  ariaHasPopup,
  ariaExpanded,
}: SidebarFootActionProps) {
  const groups = useSidebarGroups()
  const reportDefaultCollapsed = groups?.reportDefaultCollapsed
  // The band leader seeds its group's initial state. A layout effect (not
  // render) reports it so the shell's re-render lands before the first paint;
  // wide only — the rail never collapses.
  useLayoutEffect(() => {
    if (wide && group !== undefined && defaultCollapsed === true) {
      reportDefaultCollapsed?.(group)
    }
  }, [wide, group, defaultCollapsed, reportDefaultCollapsed])
  const groupCollapsed = wide && group !== undefined
    && groups !== null && groups.collapsed.has(group)
  const renderCaption = (): ReactNode => {
    if (!wide || groupHeader === undefined || groupHeader === '') return null
    if (group === undefined || groups === null) {
      return <div className={css.groupHeader}>{groupHeader}</div>
    }
    return (
      <SidebarGroupToggle
        label={groupHeader}
        collapsed={groupCollapsed}
        onToggle={() => { groups.toggle(group) }}
      />
    )
  }

  return (
    <>
      {renderCaption()}
      {!groupCollapsed && (
        <Tooltip label={label} delayMs={500} disabled={wide}>
          <button
            type="button"
            className={clsx(css.trigger, !wide && css.rail)}
            aria-haspopup={ariaHasPopup}
            aria-expanded={ariaExpanded}
            onClick={onAction}
          >
            {icon}
            {wide && <span className={css.triggerLabel}>{label}</span>}
          </button>
        </Tooltip>
      )}
    </>
  )
}
