// Sidebar group collapse: the sidebar shell owns which caption groups are
// collapsed and shares the state with foot entries through React context.
// The band's first entry renders a SidebarGroupToggle for its caption; every
// entry carrying the same group key hides while the group is collapsed
// (wide sidebar only — the collapsed 56px rail renders no captions).

import { createContext, useContext } from 'react'
import clsx from 'clsx'
import { IconChevronDownOutlineRegular } from './icons/index.tsx'
import css from './SidebarFoot.module.css'

/** Collapse state shared by the sidebar shell and its foot entries. */
export interface SidebarGroupsApi {
  /** Group keys currently collapsed (entries carrying a key here hide, wide mode only). */
  readonly collapsed: ReadonlySet<string>
  /** Flip one group's collapsed state by key. */
  toggle: (key: string) => void
  /**
   * Declare a collapse group from a foot entry through a layout effect, so the
   * shell knows every band key before first paint. Entries with the same key
   * report it repeatedly and the call stays idempotent. startsCollapsed seeds
   * the band hidden (the band's leader passes its defaultCollapsed prop);
   * false bands start expanded. Explicit user toggles always win over the
   * seed. The shell seeds its own system group; the rail never collapses.
   */
  reportGroup: (key: string, startsCollapsed: boolean) => void
}

/** Context provided by the sidebar shell around its footer region; null outside it. */
export const SidebarGroupsContext = createContext<SidebarGroupsApi | null>(null)

/** Read the sidebar group-collapse API, or null when no sidebar shell is mounted. */
export function useSidebarGroups(): SidebarGroupsApi | null {
  return useContext(SidebarGroupsContext)
}

/** Props for a sidebar group caption collapse toggle. */
export interface SidebarGroupToggleProps {
  /** Group caption text (also the button's accessible name). */
  label: string
  /** Whether the group is currently collapsed. */
  collapsed: boolean
  /** Flip the group's collapsed state. */
  onToggle: () => void
}

/**
 * Render a sidebar group caption as a collapse toggle: caption plus a chevron
 * that rotates to point sideways when collapsed.
 * @param props - caption label, collapsed flag, and toggle callback.
 * @returns the wide-only caption button.
 */
export function SidebarGroupToggle({ label, collapsed, onToggle }: SidebarGroupToggleProps) {
  return (
    <button
      type="button"
      className={css.groupHeaderButton}
      aria-expanded={!collapsed}
      onClick={onToggle}
    >
      <span className={css.groupHeaderText}>{label}</span>
      <IconChevronDownOutlineRegular
        className={clsx(css.groupChevron, collapsed && css.groupChevronCollapsed)}
      />
    </button>
  )
}
