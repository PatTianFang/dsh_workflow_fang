# DSH Workflow · DSH 0.2.1-rc.3 adaptation

`@dsh-external/workflow` turns DeepSeek Harness's one-off multi-agent execution into a reusable, governed, observable, and resumable workflow layer. It integrates with DSH's Cordis services, subagent providers, tool restrictions, approval flow, Session log, background jobs, commands, and native workflow events.

[中文 README](README.md) · [KodaX parity matrix](docs/KODAX_PARITY.md) · [Configuration](docs/CONFIGURATION.md) · [Security](docs/SECURITY.md)

> **This is not the upstream project — it is a requirement-driven adaptation of it.**
> The code baseline is [omdsh-dev/dsh_workflow](https://github.com/omdsh-dev/dsh_workflow) `v0.1.2` (MIT, targeting DSH `0.0.1-rc.2`). This repository ports it to **DSH `0.2.1-rc.3`** so it installs and runs as-is: no feature removed, no interaction changed, no safety boundary relaxed — only the host seams were rewritten, and building no longer needs a private DSH source checkout.

## What this repository is

| | |
| --- | --- |
| Upstream | [omdsh-dev/dsh_workflow](https://github.com/omdsh-dev/dsh_workflow) `v0.1.2`, MIT, host DSH `0.0.1-rc.2` |
| This repository | `PatTianFang/dsh_workflow_fang` `v0.2.0`, MIT, host DSH **`0.2.1-rc.3`** |
| Relationship | An adaptation (port) of the upstream plugin; not an official release, not a DSH-official plugin, not an upstream feature branch |
| Scope of change | Host seams + engineering (npm build, compatibility pin, verification scripts); the user-visible feature surface is preserved 1:1 |
| Not in scope | No new user features, no removed capabilities, no change to command semantics, capsule format, or security policy |

Three rules governed the port:

1. **No capability removed** — three tools, every `/workflow` subcommand, six patterns, two built-ins, capsules and the run graph, cached resume, read-only policy, structured-output repair, background jobs, and native `tool-workflow/*` events are all still there.
2. **Behavior is verifiable** — all 179 upstream tests were migrated and pass; assertion counts were compared per file to prove nothing was weakened, plus a real end-to-end install smoke run.
3. **No relaxed boundary** — the QuickJS capability VM, JSON boundary, deterministic guards, read-only masks, and approval classes are unchanged; capabilities the host no longer exposes now fail loudly instead of degrading silently.

## What changed relative to upstream

DSH moved from `0.0.1-rc.2` to `0.2.1-rc.3` and replaced most of the seams this plugin integrates with, so the work is about *how* the plugin talks to the host, not *what* it does:

| Area | Upstream (DSH `0.0.1-rc.2`) | This repository (DSH `0.2.1-rc.3`) |
| --- | --- | --- |
| Child start | `ctx.subagents.start(provider, request)` | `startActivation({ provider, label, request, signal, delivery: 'caller' })` |
| Child agent handle | `SubagentRun.localAgent` | `parent.ctx.agents.get(childId)` |
| Read-only child | `request.toolFilter` (field removed by the host) | `child.ctx.tools.restrict(mask)` on the published child scope |
| Session history | `session.events` | `session.ownEvents()` |
| Tool evidence | `tool/result` content blocks | `tool/result` `message.toolCallId` / `message.isError` |
| Plugin message source | `{ kind: 'plugin', plugin }` (retired) | registered `{ kind: 'dsh-workflow', form }` |
| Background jobs | `owner: Agent`, `done.output` | `owner: agent.session.id`, `done.result` |
| Native run-start event | `{ runId, name, turn: null }` | `{ runId, name }` |
| Build | private DSH checkout, pnpm `link:` | npm dependencies on the published `@deepseek-ai/*` packages |
| Compatibility check | git commit of a private checkout | [`compatibility.json`](compatibility.json) v2 package pin + native projection contract check |

Two boundaries a user may notice, both caused by the host and both *stricter*, never looser:

- **Read-only**: the host removed the delegation-time tool filter, so the same allow-list is now applied to the published child Agent's scope; a provider that publishes no local child fails loudly instead of running unconstrained.
- **Structured-repair child**: previously `toolFilter: { allow: [] }`, now a deny of every visible tool — same effect (it may only reformat text, never investigate).

Details: [v0.2.0 port notes](docs/features/v0.2.0.md) · [CHANGELOG](CHANGELOG.md).

## Install

Requires Node.js `>=22.19` and the DSH package generation pinned in [`compatibility.json`](compatibility.json) (currently DSH `0.2.1-rc.3`).

```sh
# 1) from this repository (build output is committed; no local compile needed)
dsh plugin --profile desktop add "github:PatTianFang/dsh_workflow_fang#main"

# 2) or from a local checkout
dsh plugin --profile desktop add /path/to/dsh_workflow_fang

# 3) or from a packed tarball
npm pack
dsh plugin --profile desktop add /path/to/dsh-external-workflow-0.2.0.tgz
```

In DeepSeek Harness Desktop the same bundle can be installed through the plugin manager by pointing it at this package directory.

The composed profile should then contain:

```yaml
- id: dsh-external-workflow
  name: '@dsh-external/workflow'
```

Verify with `dsh --profile desktop --dump-config`, with `/workflow list` in a session, or by checking that the model sees `workflow_list`, `run_workflow`, and `workflow_manage`.

## How to use it

Slash commands are for humans, the three tools are for the model, and both share one engine, one run store, and one safety policy.

### 1. See what is available

```text
/workflow list
```

Lists two built-ins (`parallel-investigation`, `scoped-review`), six patterns (`classify-and-act`, `fan-out-and-synthesize`, `adversarial-verification`, `generate-and-filter`, `tournament`, `loop-until-done`), your project `.dsh/workflows`, and your personal `$DSH_HOME/workflows`.

### 2. Run a built-in

```text
/workflow parallel-investigation {"question":"Why is this test flaky?"}
```

### 3. Author one for your task

```text
/workflow create Design a parallel security review for this repository, focusing on permissions and path handling
```

This is not "ask the model again": the command returns immediately and hands your exact query to the current Agent as a real user message (so chat, session titles, and the Workspace all see it). The Agent investigates the repository with its own tools and then calls `run_workflow` with `source + manifest`; the generated script runs in the QuickJS sandbox after a pre-launch smoke check and a one-shot grant.

### 4. Review code out of the box

```text
# review uncommitted changes (default)
/workflow review

# review against main, with constraints and test evidence, waiting for the result
/workflow review base --risk high \
  --requirement "preserve the public API" \
  --test-evidence "npm test passed" \
  --wait -- focus on error handling
```

It captures the Git diff, writes content-addressed review packets (packet + constraints + evidence), then runs `scoped-review`: two primaries, a per-finding verifier, and an audit artifact.

### 5. Watch, control, and reuse runs

```text
/workflow runs                     # the latest 20 runs
/workflow show                     # latest run (--full includes every event)
/workflow stop                     # stop the active run
/workflow save <runId> my-flow     # save this authored flow as a reusable workflow
/workflow my-flow {"k":"v"}        # run it by name
/workflow rerun <runId|name>       # rerun from the snapshot / current version
/workflow resume-run <runId>       # replay cached tasks and finish the rest
```

Run artifacts land in the current project's `.dsh/workflow-runs/<run-id>/` (`run.json`, `events.jsonl`, the immutable snapshot, the `results/` effect cache, `artifacts/`), and native `tool-workflow/*` Session events make progress visible in the DSH Web UI.

### 6. Command reference

```text
/workflow help
/workflow list
/workflow create <request>
/workflow review [base | sha <hash>] [--lean] [--risk low|medium|high] [--requirement "..."] [--test-evidence "..."] [--wait] [-- <focus>]
/workflow <name> [JSON args]
/workflow runs [--all|--limit N]
/workflow show [--full] [runId]
/workflow pause|resume|stop [runId]
/workflow rerun|resume-run <runId|savedName> [JSON args] [--wait]
/workflow save <runId> <name> [project|personal]
/workflow rename-run <runId> <display name>
/workflow rename-saved <from> <to> [project|personal]
/workflow revise <savedName> <change>
/workflow delete-run <runId> [--force]
/workflow delete-saved <name> [project|personal]
/workflow prune [--dry-run] [--keep N] [--older-than 7d|24h]
```

`/workflow create` and free-text `/workflow <request>` reject `--wait` (authoring is owned by the current Agent turn); named workflows, `rerun`, `resume-run`, and `review` accept `--wait`. The tool equivalent is `wait: true`.

Starts return `{ runId, status, jobId? }` immediately so a long process does not occupy the current turn. `/workflow show` defaults to the latest run and `/workflow stop` to the active run.

### 7. Tool surface

| Tool | Purpose |
| --- | --- |
| `workflow_list` | Discover built-in, pattern, project, and personal workflows; invalid entries are reported, never executed |
| `run_workflow` | Run a named workflow, scout-then-author from a request, or execute a capability-only inline workflow (`{ name }` / `{ request }` / `{ source, manifest, args, wait }`) |
| `workflow_manage` | Inspect and control durable runs: show, pause, resume, stop, rerun, resume-run, save, rename, revise, delete, prune |

Minimal inline workflow (the same contract `/workflow create` hands to the Agent):

```js
async function run(wf, args) {
  return await wf.phase('analyze', async () => {
    const r = await wf.runAgent({ name: 'analyst', prompt: String(args?.q ?? 'analyze'), readOnly: true, modelHint: 'balanced' })
    return r?.finalText ?? 'no result'
  })
}
```

```json
{"name":"focused-analysis","description":"Analyze with one specialist.","phases":["analyze"],"readOnly":true,"maxAgents":1,"maxConcurrency":1,"patterns":["classify-and-act"]}
```

`modelHint` must be exactly `fast | balanced | deep`; with `readOnly: true` the child only sees tools inside the read-only allow-list.

### 8. Configuration

Defaults are usable. Override in the profile's `cordis.patch.yml` when you need to tune it (full field list in [Configuration](docs/CONFIGURATION.md)):

```yaml
- id: dsh-external-workflow
  name: '@dsh-external/workflow'
  config:
    approvalMode: generated-and-local  # never | generated-and-local | always
    maxAgents: 64
    maxConcurrency: 8
    maxRetainedRuns: 500
    fastProvider: spawn
    fastModelProvider: deepseek-official
    fastMaxTokens: 4096
    balancedProvider: spawn
    balancedModelProvider: deepseek-official
    balancedMaxTokens: 8192
    deepProvider: spawn
    deepModelProvider: deepseek-official
    deepMaxTokens: 16384
    readOnlyAllowedTools:
      - read
      - read_image
      - glob
      - grep
      - lsp
      - skill
      - web_search
```

`availableTools`, `availableMcp`, and `availableSkills` are deployment capability lists used by capsule preflight: a declared requirement that is not listed fails instead of degrading quietly.

## Why it matters to DSH

DSH already provides strong harness primitives. This plugin composes them into durable workflow assets:

| One-off orchestration | DSH Workflow |
| --- | --- |
| Re-describe decomposition every turn | Save project or personal named workflows |
| Results live only in chat | Durable run graph, events, artifacts, summary, and cost |
| Restart after interruption | Snapshot rerun and effect-cache resume |
| Prompt-level limits | Manifest, preflight, token reservation, concurrency and agent caps |
| Generated scripts are hard to govern | Capability VM, JSON boundary, deterministic guards, approval classes |
| Multi-agent work is a technique | Multi-agent work becomes a shareable engineering asset |

The native DSH `workflow` tool remains the best fit for a single foreground fan-out. This plugin is the reusable process layer above it.

## Capability surface

- Strict `dsh.workflow` v1 capsules carrying manifest, source, intent, inputs, requirements, and provenance.
- `async function run(wf, args)` with phase, agent spawn/run/wait/snapshot/output/send/stop, parallel, pipeline, synthesis, one-level nesting, artifacts, logging, and budget visibility.
- `runAgent` returns `null` for ordinary terminal child failure so workflows can degrade intentionally, while `wait` on an explicit handle retains the complete failure. Required object schemas get exactly one same-route, tool-free repair when native structured capture is absent and fail explicitly if still invalid.
- Per-agent scope, constraints, read-only policy, provider/subagent type, fast/balanced/deep routing, explicit model, isolation, token allocation, evidence, verification, structured output, and terse results.
- Deterministic project/personal discovery, trusted-local approval, save/archive/rename/revise/delete, immutable run snapshots, cached resume, retention, and identity ambiguity checks.
- Two concrete built-ins, including packet-based scoped review with strict schemas, read contracts, a second high-risk primary, per-finding verification, and an audit artifact; plus all six KodaX workflow patterns. Public `writeReviewPackets()` creates content-addressed, non-overwriting packet/evidence files from caller-captured diff, requirements, and test evidence. `/workflow review` captures Git scope and launches that built-in without requiring a patched DSH core `/review` command.
- Stable ProcessSnapshot, WorkflowOutcome, and AgentResult projections with progress, explicit unverified outcomes, verification evidence, routes, usage, artifacts, and replay origin.
- Durable lifecycle controls through service APIs, tools, `/workflow`, DSH background jobs, and native `tool-workflow/*` Session events.
- Scout-then-author generation with structured output, a three-attempt repair loop, source policy, quality lint, preflight, and approval.
- `/workflow create <request>` and free-text `/workflow <request>` return from the command plane immediately and hand explicit Workflow intent to the current Agent, matching KodaX's Worker-owned scout-then-author path. The exact user query is delivered as a human Session message, so it is visible in chat, feeds DSH title generation, and identifies the session in its Workspace; the authoring contract is delivered separately as collapsed plugin context. The Agent investigates with its normal tools and then calls `run_workflow` with `source + manifest`, so authoring cannot strand the UI in `command/run`. The exact handed-off message grants one inline start once, after a pre-launch smoke run validates the same child-task contract used by the engine. Invalid authored fields (for example a `modelHint` outside `fast | balanced | deep`) fail before a real child starts and leave the same-turn grant available for a corrected retry. Internal relays, later direct user messages, and repeated valid calls cannot reuse it, while tool-produced scouting context does not revoke it by accident. `approvalMode: always` and trusted-local gates remain enforced.
- Dynamic workflow starts are session-scoped native events. A background workflow therefore stays `running` when its launching tool step or Agent turn closes, and only its actual `tool-workflow/run-end` projects completion, failure, or cancellation instead of a false interruption.

See the [complete parity contract](docs/KODAX_PARITY.md) for the evidence-backed capability matrix. The implementation references behavior only and does not copy KodaX's source-available code.

## Safety model

Generated scripts run in a separate QuickJS WebAssembly heap. The host exposes only a JSON capability bridge; imports, process/filesystem/shell/network access, timers, nondeterministic clock/randomness, and non-JSON boundary values are rejected. CPU slices, wall time, memory, and stack are bounded, and wall timeout closes the bridge and aborts the run.

Read-only execution dynamically intersects the parent Agent's visible catalog with a trusted allow-list, so unknown or newly added mutation tools are excluded by default. DSH 0.2 dropped the per-delegation tool filter, so the mask is applied to the published child Agent's own scope before its first tool call; a provider that publishes no local child fails loudly instead of running unconstrained. Read evidence, successful mutation-tool plus Git-workspace change evidence, required changed paths, final-text checks, and bounded same-actor repair are built in. Deployments can add non-Git workspace evidence, worktrees, and target/effort dispatch through public adapter registrations; unsupported requests fail loudly.

## Development

The plugin compiles against the published DSH capability packages pinned in `compatibility.json`; no DSH source checkout is required.

```sh
npm install
npm run check          # compatibility pin + native projection contract + 179 tests + typecheck + build
npm run test:coverage  # requires the optional @vitest/coverage-v8 package
npm pack               # produce an installable tarball
```

After changing code, rebuild and reinstall:

```sh
npm run build && npm pack
dsh plugin --profile desktop add /absolute/path/to/dsh-external-workflow-0.2.0.tgz
```

When DSH moves, update `compatibility.json` (package versions and `hostVersion`) plus `dshVersion` in `src/index.ts`, then rerun `npm run check`.

## Known limitations

- Trusted-local `.ts` uses Node 22's native erasable-syntax TypeScript support and Node's module cache (restart DSH after edits); publish transform-only syntax or hot-reloaded modules as `.mjs/.js`.
- DSH `0.2.1-rc.3` no longer accepts a per-delegation tool filter or an existing-agent target. Read-only masks are applied to the published child scope, and target/effort dispatch or worktree isolation still require a deployment adapter; absent adapters fail loudly.
- Built-in verification covers observed tool/read evidence, Git workspace mutation, per-required-path before/after fingerprints, and result postconditions; non-Git or external-authority policies register a verification adapter.
- Only generated capsule runs carry immutable source snapshots that can be saved/rerun from history.
- KodaX capsules are not treated as wire-compatible with `dsh.workflow` v1.
- This repository is validated against `0.2.1-rc.3` only; a host upgrade requires rerunning the compatibility check.

## Acknowledgements

- [omdsh-dev/dsh_workflow](https://github.com/omdsh-dev/dsh_workflow): the upstream project this repository adapts, including its workflow design, implementation, and test baseline (MIT).
- [DeepSeek Harness](https://www.npmjs.com/org/deepseek-ai): Harness, plugin, and subagent capability surface (`@deepseek-ai/dsh-*`).
- [KodaX](https://github.com/icetomoyo/KodaX): the behavioral reference for workflow product design; the upstream plugin is an independent implementation whose behavioral contract this port preserves.
- `dsh-external` community plugins for bundle installation, verification, security boundaries, and documentation structure.

## License

MIT. See [LICENSE](LICENSE). Upstream copyright belongs to its authors; the adaptation in this repository is released under the same license.
