# Agent Note：侧边栏底部的可折叠标题分组

Status: implemented

[English](2026-09-24-sidebar-collapsible-bands.md) | 中文

## Problem

fork 本地侧边栏允许宽侧边栏用户折叠列底部的标题分组：业务包提供自带标题的分组，外壳对设置位拥有一个系统分组。上游 alpha.2 侧边栏不再保留折叠状态，设置位始终渲染；新外壳还替换了全局面板机制。业务包会装入十个底部条目，没有分组时底部会是一长串固定列表。

## Decision

把折叠机制移植到 alpha.2 `SidebarRoot`，同时保留上游的面板导航、Windows 标题栏支持与交叉淡入动画：

- 外壳状态沿用默认/覆盖两层结构——`defaultCollapsedKeys` 集合（以外壳所有的 `'system'` 键为种子）加显式用户覆盖——通过（已在 ui-primitives 中重建的）`SidebarGroupsContext` 暴露给底部占用方。
- 底部以该 context provider 包裹 `sidebar.footer.action` 与 `sidebar.settings`。业务分组通过其首个 `SidebarFootAction` 的 `groupHeader`/`group` 属性自行加标题与折叠，外壳保持业务无关。
- 外壳渲染一个仅宽侧边栏可见的 `SidebarGroupToggle` 标题（`group.system`：系统设置 / Settings），控制 `sidebar.settings` 位。折叠仅限宽侧边栏；56px 窄轨渲染全部图标、无标题。
- 不再恢复私有的 `sidebar.footer.bottom` slot：其唯一旧占用方（退出登录）改用原生 `sidebar.footer.action` 列表中的一个条目，因此系统分组只控制一个位而非两个。

`group.system` locale 键加入两套词典。sidebar-root 测试新增系统分组与分组种子用例（17 个测试）；外壳快照在展开/窄轨/Windows 各形态下重新生成。

## Alternatives considered

**保留 `sidebar.footer.bottom` 作为系统分组的第二个受控位。** 它只为一个占用方存在；原生 `footer.action` 已能以相同的 owner share 承载图标+标题条目。保留它只会为不存在的消费方维护私有 slot 与双位折叠分支。

**让每个分组用本地状态自管折叠、不经外壳 context。** 分组的默认折叠种子需要在首次绘制前落地，无标题的条目也必须能隐藏；局部分组状态两者都做不到，而外壳系统分组同样需要该机制。

## Consequences

`SidebarRoot.tsx` 在包测试下保持 v8 覆盖 100%；两面 typecheck 与 ui-sidebar 套件（972 个测试）通过。同一批工作还附带修复分析器：A2 变更漏将 `packageRoots` 加入 WorkspaceAnalyzer 构造器的选项归一化，现已补上。
