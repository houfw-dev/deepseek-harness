# Agent Note: Collapsible caption bands at the sidebar foot

Status: implemented

English | [中文](2026-09-24-sidebar-collapsible-bands.zh.md)

## Problem

The fork-local sidebar let wide-sidebar users collapse caption bands at the column foot: business packs contributed self-captioned groups, and the shell owned a system group over its settings seat. The upstream alpha.2 sidebar kept no collapse state and always rendered the settings seat; the new shell also replaced the global-panel mechanism. Business packs install ten footer entries, so without bands the foot is a long fixed list.

## Decision

Port the collapse machinery onto the alpha.2 `SidebarRoot`, keeping the upstream's panel navigation, Windows-titlebar support, and crossfade animation:

- Shell state is the same defaults/overrides split — a `defaultCollapsedKeys` set (seeded with the shell-owned `'system'` key) plus explicit user overrides — exposed to foot occupants through `SidebarGroupsContext` (now rebuilt in ui-primitives).
- The foot wraps `sidebar.footer.action` and `sidebar.settings` in that context provider. Business bands caption and collapse themselves through their first `SidebarFootAction`'s `groupHeader`/`group` props; the shell stays business-agnostic.
- The shell renders a wide-only `SidebarGroupToggle` caption (`group.system`: 系统设置 / Settings) that gates the `sidebar.settings` seat. Collapse is wide-only; the 56px rail renders every icon and no captions.
- The private `sidebar.footer.bottom` slot is not reintroduced: the only former occupant (sign-out) is an entry in the native `sidebar.footer.action` list, so the system group gates one seat instead of two.

The `group.system` locale key joins both dictionaries. The sidebar-root spec gained system-group and band-seed cases (17 tests); shell snapshots regenerated for expanded/rail/Windows trees.

## Alternatives considered

**Keep `sidebar.footer.bottom` as a second system-group seat.** It existed for one occupant; native `footer.action` already covers icon+label entries with the same owner share. Keeping it would preserve a private slot and a two-slot gating branch for no consumer.

**Let every band manage its own collapsed state without shell context.** Band default-collapse seeding needs to land before first paint and entries without a caption must still hide; per-band local state cannot answer either, and the shell's system group needs the same mechanism anyway.

## Consequences

`SidebarRoot.tsx` stays at 100% v8 coverage under the package suites; both-face typecheck and the ui-sidebar suites (972 tests) pass. A follow-up analyzer fix in the same work adds `packageRoots` to the WorkspaceAnalyzer resolved-options type, which the A2 change had omitted from the constructor normalization.
