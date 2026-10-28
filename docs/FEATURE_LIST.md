# Feature List

## Version Info

- Current Release: v0.2.0
- Planned Version: none
- Last Updated: 2026-10-28

## Version Summary

| Version | Status | Progress |
| --- | --- | ---: |
| v0.2.0 | Complete | 1/1 |
| v0.1.2 | Complete | 1/1 |
| v0.1.1 | Complete | 1/1 |
| v0.1.0 | Complete | 1/1 |

## Feature Index

| ID | Title | Category | Priority | Status | Planned | Design |
| --- | --- | --- | --- | --- | --- | --- |
| 001 | KodaX-parity workflow orchestration | New | Critical | Complete | v0.1.0 | [Design](features/v0.1.0.md#feature_001-kodax-parity-workflow-orchestration) |
| 002 | Visible workflow handoff and session title integration | Fix | High | Complete | v0.1.1 | [Design](features/v0.1.1.md#feature_002-visible-workflow-handoff-and-session-title-integration) |
| 003 | Reliable handoff preflight and background lifecycle projection | Fix | Critical | Complete | v0.1.2 | [Design](features/v0.1.2.md#feature_003-reliable-handoff-preflight-and-background-lifecycle-projection) |
| 004 | Port to DSH 0.2.1-rc.3 capability packages | Compatibility | Critical | Complete | v0.2.0 | [Design](features/v0.2.0.md) |

## Feature Details

### FEATURE_001: KodaX-parity workflow orchestration

- Description: Add the complete reusable/generated/governed workflow layer above DSH native harness primitives.
- Category: New
- Priority: Critical
- Status: Complete
- Planned: v0.1.0
- Created: 2026-08-13
- Started: 2026-08-13
- Released: 2026-08-13

### FEATURE_002: Visible workflow handoff and session title integration

- Description: Preserve the exact `/workflow` query as a visible human Session message while keeping internal authoring guidance in plugin context, so DSH title and Workspace surfaces can identify the session.
- Category: Fix
- Priority: High
- Status: Complete
- Planned: v0.1.1
- Created: 2026-08-13
- Started: 2026-08-13
- Released: 2026-08-13

### FEATURE_003: Reliable handoff preflight and background lifecycle projection

- Description: Validate command-authored child inputs before consuming the handoff grant, and keep background workflow UI state live until a real terminal event.
- Category: Fix
- Priority: Critical
- Status: Complete
- Planned: v0.1.2
- Created: 2026-08-13
- Started: 2026-08-13
- Released: 2026-08-13

### FEATURE_004: Port to DSH 0.2.1-rc.3 capability packages

- Description: Move every host seam (activation start, child agent resolution, read-only masks, history reads, tool evidence, message sources, job outcomes, native run-start events) onto DSH `0.2.1-rc.3` without changing the workflow surface, and validate it against the published packages instead of a private checkout.
- Category: Compatibility
- Priority: Critical
- Status: Complete
- Planned: v0.2.0
- Created: 2026-10-28
- Started: 2026-10-28
- Released: 2026-10-28

## Summary

- Total: 4
- In Progress: 0
- Planned: 0
- Completed: 4
