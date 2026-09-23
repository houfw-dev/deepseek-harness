# Agent Note: Typert 支持可配置的包根目录

Status: implemented

[English](2026-09-23-typert-configurable-package-roots.md) | 中文

## Problem

生成器从 Host/Client 聚合 tsconfig 的 project references 发现包项目，但会忽略包目录不在 `<root>/packages` 内的引用。以只读 subtree（`base/`）方式消费本 fork 的业务仓，其自有包在该树之外，却希望一次生成同时覆盖 `packages` 和 `base/packages`。

## Decision

`WorkspaceAnalyzerOptions` 新增可选的 `packageRoots` 目录列表，路径相对于工作区根（接受绝对路径，默认 `['packages']`）。当项目引用的真实包目录位于任一配置根内时即被接纳；vendor 纳入所使用的 vendored 树白名单保持不变。`WorkspaceTypertGeneratorOptions` 与 tsdown 插件选项同样转发该字段。

默认值保证上游布局行为不变：现有调用方不会增加或丢失任何包。

## Alternatives considered

**在分析器中硬编码 subtree 布局。** 这会让框架与单一消费方的目录名耦合，每次布局变动都会再次断裂。

**不加边界、扫描全部项目引用。** 聚合文件还引用了测试夹具和工具项目，这些文件绝不能进入类型图。

## Consequences

业务仓的 `tsdown.config.ts` 可继续使用 `typertPlugin({ packageRoots: ['packages', 'base/packages'] })`。按既有豁免，typert 源码不在 v8 覆盖范围内，其测试套件仍是正确性门禁。
