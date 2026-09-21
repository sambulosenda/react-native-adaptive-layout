# 0001. Slot-based children

Date: 2026-09-21
Status: Accepted

## Context

The layout needs exactly two panes with distinct roles. Options: positional children
(`children[0]`, `children[1]`), render props (`renderPrimary`), or slot marker components.

## Decision

Slot markers: `FoldableLayout.Primary` and `FoldableLayout.Secondary`. They render nothing and are
matched by component identity, so order does not matter. Misuse produces a one-time development
warning rather than a throw.

## Consequences

- Readable JSX that mirrors the native concept.
- Slot resolution is pure and unit-testable.
- Wrapping a slot in another component breaks identity matching; documented in the README.
