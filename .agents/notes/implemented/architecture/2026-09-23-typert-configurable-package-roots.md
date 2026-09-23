# Agent Note: Typert accepts configurable package roots

Status: implemented

English | [中文](2026-09-23-typert-configurable-package-roots.zh.md)

## Problem

The generator discovers package projects from the Host/Client aggregate tsconfig project references, but ignores every reference whose package directory is not inside `<root>/packages`. A business repository that consumes this fork as a read-only subtree under `base/` has its own packs outside that tree and wants one generation pass over both `packages` and `base/packages`.

## Decision

`WorkspaceAnalyzerOptions` gains an optional `packageRoots` list of directories relative to the workspace root (absolute paths accepted, default `['packages']`). A project reference is admitted when its real package directory lies within any configured root; the vendored-tree whitelist used by vendor inclusion is unchanged. `WorkspaceTypertGeneratorOptions` and the tsdown plugin options forward the same field.

The default value keeps upstream layouts unchanged: no existing caller gains or loses a package.

## Alternatives considered

**Hard-code the subtree layout in the analyzer.** It would couple the framework to one consumer's directory names and re-break on every layout change.

**Scan every project reference without a boundary.** The aggregates reference test fixtures and tooling projects whose files must never enter the type graph.

## Consequences

The business repository's `tsdown.config.ts` keeps `typertPlugin({ packageRoots: ['packages', 'base/packages'] })`. Typert source stays outside v8 coverage by the existing exemption; its suites remain the correctness gate.
