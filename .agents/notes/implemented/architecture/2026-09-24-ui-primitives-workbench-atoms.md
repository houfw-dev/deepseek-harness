# Agent Note: Workbench atoms rebuilt in ui-primitives

Status: implemented

English | [中文](2026-09-24-ui-primitives-workbench-atoms.zh.md)

## Problem

The fork-local kit shipped a family of generic workbench UI atoms — pager and paginator hook, results table and icon-only row delete, inline form-card pieces (card, fields, tag input, footer), clipped tag pill list, and the sidebar-foot trigger/modal chrome with collapsible caption groups. The upstream client rewrite (rc.7 → alpha.2) replaced the primitives these were built on (icons renamed, `Modal` lost `bodyClassName` and made `closeLabel`/`headless` a required union), so the old files no longer compile and every business panel depends on them.

## Decision

Rebuild the family inside the upstream `@deepseek-ai/dsh-client-ui-primitives` package, composing the existing atoms rather than forking them:

- `Pagination.tsx`, `usePagination.ts` are framework-agnostic and moved verbatim.
- `FormKit.tsx` (`FormCard`, `FormField`, `FormFieldGroup`, `TextField`, `parseTags`, `TagsField`, `FormError`, `FormActions`, `FormFooter`, `ErrorBanner`, `EmptyState`, `SearchField`, `ListPager`) composes the upstream `Button`/`Input`/`Pagination`; only the search icon import changes.
- `DataTable.tsx` (`DataTable`, `ResultsTable`, `DeleteRowButton`) and `ConfirmDialog.tsx` move with icon renames (`IconTrashOutline16` → `IconTrashOutlineRegular`, `IconWarningOutline16` → `IconWarningOutlineRegular`, `IconSearchOutline16` → `IconSearchOutlineRegular`, `IconChevronDownOutline14` → `IconChevronDownOutlineRegular`).
- `SidebarFootModal` drops the `bodyClassName` passthrough (the new `Modal` has no such prop) but keeps `dialogClassName`/`contentClassName`; `closeLabel` is always supplied, satisfying the new required union.
- `TagList.tsx`, `SidebarGroupToggle.tsx`, `SidebarFootAction.tsx`, and the three CSS modules move unchanged apart from the chevron rename.

All exports are re-exported from the package root, and the ported suites live in `tests/workbench-atoms.client.spec.tsx` (kept separate from upstream `atoms.client.spec.tsx`), extended to cover every `FormKit` and `ResultsTable` export.

## Alternatives considered

**Publish the atoms as a separate business-only package.** Every workbench panel imports them; a separate package reintroduces a versioned dependency on the base for pure presentational code and breaks when base atoms change again.

**Patch the upstream `Modal` to restore `bodyClassName`.** No ported caller needs a separate body wrapper class; keeping the prop would be an unconsumed compatibility surface.

## Consequences

All nine source files sit at 100% v8 coverage; the full package suite (1247 tests) stays green. Business panels can import the kit unchanged by name once the subtree base moves to this fork. The collapsible sidebar `SidebarRoot` shell that consumes `SidebarGroupsApi` is rebuilt separately (A4).
