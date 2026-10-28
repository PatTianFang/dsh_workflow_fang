# Changelog

## [Unreleased]

---

## [0.2.0] - 2026-10-28

Port of the plugin to DSH `0.2.1-rc.3`. The user-visible workflow surface is
unchanged; every host seam the plugin integrates with was re-expressed against
the current capability packages.

### Changed

- Start children through the managed activation seam:
  `ctx.subagents.startActivation({ provider, label, request, signal, delivery: 'caller' })`,
  returning `{ childId, result, dispose }`. The deployment dispatch adapter may
  still hand back a `SubagentRun`; the engine normalizes both shapes.
- Resolve the published child Agent through `parent.ctx.agents.get(childId)`
  instead of the removed `SubagentRun.localAgent` (steering, cancellation,
  follow-up repair, usage accounting, and tool evidence all use it).
- Enforce read-only children on the child's own scope with
  `child.ctx.tools.restrict(mask)`, because DSH 0.2 removed the per-delegation
  `toolFilter` from `SubagentStartRequest` and `SubagentCapabilities`. A
  provider that publishes no local child Agent fails loudly instead of running
  unconstrained. The structured-output repair child is constrained the same way
  (`allow: []` becomes a deny of every inherited tool).
- Read session history through `session.ownEvents()` (the synchronous
  `session.events` array is gone).
- Read tool evidence from the `tool/result` event's identified
  `ToolResultMessage` (`message.toolCallId`, `message.isError`) instead of the
  removed `tool-result` content blocks.
- Register a plugin-owned durable message source kind
  `{ kind: 'dsh-workflow', form }` through the merge-extensible
  `MessageSourceMap`, replacing the retired `{ kind: 'plugin', plugin }` wrapper.
- Background jobs pass `owner: agent.session.id` and report the terminal value
  as `done.result` (`JobOutcome`), not `done.output`.
- Append the native run-start marker as `{ runId, name }`; DSH 0.2 owns the
  run's conversation scope in its projection, so the caller-declared
  `turn: null` coordinate is gone.

### Added

- `compatibility.json` v2: pins the exact published `@deepseek-ai/*` capability
  versions (plus the Desktop bundle generation) instead of a private DSH
  snapshot commit.
- `scripts/check-compatibility.mjs` and
  `scripts/check-dsh-workflow-projection.mjs` now verify the installed npm
  packages and the native `tool-workflow/*` declaration contract, so
  `npm run check` works without a DSH source checkout.

### Removed

- `pnpm-lock.yaml` / `pnpm-workspace.yaml` from the published tree; the
  repository builds with npm and has no workspace links to a private checkout.

---

## [0.1.2] - 2026-08-13

### Fixed

- Smoke-validate command-authored inline workflows with the engine's shared child-task and deterministic admission contract before consuming the one-shot handoff grant. Invalid metadata, input schemas, read-only/agent/token limits (including concurrent reservations), provider capabilities/adapters, nested workflows, and concurrency now fail before any child starts, and the current Agent can correct the source in the same turn without falling into a disabled approval prompt.
- Publish dynamic workflow starts as session-scoped native events so a background run remains `running` after its launching tool step or turn closes; only the matching terminal `tool-workflow/run-end` decides completion, failure, or cancellation.
- State the exact `modelHint` values (`fast`, `balanced`, `deep`) in both workflow-authoring prompts.

---

## [0.1.1] - 2026-08-13

### Fixed

- Preserve the original `/workflow` query as a visible human Session message so DSH can render it, generate a session title, and identify the conversation in its Workspace.
- Keep workflow authoring instructions in separate plugin context while retaining exact one-shot approval semantics.
- Document DSH Web's manual-order five-session collapse and the “Last updated” view workaround.

---

## [0.1.0] - 2026-08-13

### Added

- Initial KodaX-parity dynamic workflow layer for DeepSeek Harness.

<!-- last-sync: f6cef1442dca3a47e1b132741b599a2d4bdbc8b8 -->
