# Agent Note：在 ui-primitives 中重建工作台原子组件

Status: implemented

[English](2026-09-24-ui-primitives-workbench-atoms.md) | 中文

## Problem

fork 本地工具集曾提供一族通用的工作台 UI 原子——分页器与分页 hook、结果表格与图标行删除按钮、内嵌表单卡片组件（卡片、字段、标签输入、底部按钮行）、单行裁剪标签列表，以及带可折叠标题分组的 sidebar foot 触发器/弹窗外壳。上游客户端重写（rc.7 → alpha.2）替换了这些组件所依赖的原子（图标改名；`Modal` 去掉 `bodyClassName`，并把 `closeLabel`/`headless` 改为必填联合类型），旧文件已无法编译，而每个业务面板都依赖它们。

## Decision

在上游 `@deepseek-ai/dsh-client-ui-primitives` 包内重建该组件族，基于既有原子组合而非分叉：

- `Pagination.tsx`、`usePagination.ts` 框架无关，原样搬运。
- `FormKit.tsx`（`FormCard`、`FormField`、`FormFieldGroup`、`TextField`、`parseTags`、`TagsField`、`FormError`、`FormActions`、`FormFooter`、`ErrorBanner`、`EmptyState`、`SearchField`、`ListPager`）组合上游 `Button`/`Input`/`Pagination`，仅搜索图标导入变更。
- `DataTable.tsx`（`DataTable`、`ResultsTable`、`DeleteRowButton`）与 `ConfirmDialog.tsx` 随图标改名搬运（`IconTrashOutline16` → `IconTrashOutlineRegular`、`IconWarningOutline16` → `IconWarningOutlineRegular`、`IconSearchOutline16` → `IconSearchOutlineRegular`、`IconChevronDownOutline14` → `IconChevronDownOutlineRegular`）。
- `SidebarFootModal` 去掉 `bodyClassName` 透传（新 `Modal` 无此属性），保留 `dialogClassName`/`contentClassName`；始终传入 `closeLabel`，满足新的必填联合类型。
- `TagList.tsx`、`SidebarGroupToggle.tsx`、`SidebarFootAction.tsx` 及三个 CSS 模块除 chevron 改名外原样搬运。

全部导出从包入口再导出；移植的测试放在 `tests/workbench-atoms.client.spec.tsx`（与上游 `atoms.client.spec.tsx` 分开），并补全所有 `FormKit`、`ResultsTable` 导出的覆盖。

## Alternatives considered

**把原子作为独立的业务专用包发布。** 每个工作台面板都引用它们；独立包会为纯展示代码重新引入对基座的版本化依赖，并在基座原子再次变更时断裂。

**修补上游 `Modal` 恢复 `bodyClassName`。** 移植后的调用方都不需要独立的 body 包装类；保留该属性只会成为无人消费的兼容面。

## Consequences

九个源文件 v8 覆盖均为 100%；整包测试套件（1247 个测试）保持全绿。subtree 基座切换到本 fork 后，业务面板可按原名继续引用工具集。消费 `SidebarGroupsApi` 的可折叠 sidebar `SidebarRoot` 外壳在 A4 另行重建。
