import type { Agent } from '@deepseek-ai/dsh-agent';
import type { SubagentResult, SubagentRuntime } from '@deepseek-ai/dsh-subagent';
import { type ToolRestriction } from '@deepseek-ai/dsh-tools';
import type { ApprovalService } from '@deepseek-ai/dsh-user-approval';
import { WorkflowRunStore } from './store.js';
import type { ResolvedWorkflowConfig, WorkflowCapsule, WorkflowEvent, WorkflowModelHint, WorkflowPreflightResult, WorkflowRun, WorkflowManifest, WorkflowRunSnapshot, WorkflowSpawnAgentInput, WorkflowStartInput, WorkflowVerificationAdapter, WorktreeIsolationAdapter, WorkflowDispatchAdapter } from './types.js';
/**
 * Provider-neutral child handle. DSH `startActivation` delivers an activation
 * (childId) while a deployment dispatch adapter may still hand back a
 * `SubagentRun`; the workflow engine only needs identity, terminal result, and
 * disposal.
 */
export interface WorkflowChildRun {
    readonly childId: string;
    readonly result: Promise<SubagentResult>;
    dispose(): Promise<void>;
}
/**
 * Resolve the live child Agent DSH published for one activation. Evidence,
 * usage accounting, steering, cancellation, and read-only restrictions all
 * need the child's own scoped Agent rather than the run handle.
 * @param parent - the delegating parent whose scope holds the Agent registry.
 * @param childId - durable child session id, when the run is local.
 * @returns the live child Agent, or undefined for an absent/external child.
 */
export declare function childAgentOf(parent: Agent, childId: string | undefined): Agent | undefined;
export interface WorkflowEngineDependencies {
    readonly subagents: SubagentRuntime;
    readonly config: ResolvedWorkflowConfig;
    readonly store: WorkflowRunStore;
    readonly approval?: ApprovalService;
    readonly userInteractionAvailable?: boolean;
    readonly verification?: WorkflowVerificationAdapter;
    readonly isolation?: WorktreeIsolationAdapter;
    readonly dispatch?: WorkflowDispatchAdapter;
    readonly deploymentSemaphore?: WorkflowSemaphore;
    readonly now?: () => number;
    readonly id?: () => string;
    readonly resolveNested: (name: string) => Promise<{
        readonly module: WorkflowStartInput['module'];
        readonly source: WorkflowStartInput['source'];
    }>;
}
export declare class WorkflowControlError extends Error {
    constructor(message: string, options?: ErrorOptions);
}
/** Global tool names one agent scope can currently see. */
export declare function visibleToolNames(agent: Agent): string[];
export declare function resolveReadOnlyToolFilter(parent: Agent, configured?: readonly string[], denied?: readonly string[]): ToolRestriction;
/**
 * Apply a read-only tool mask to one published child Agent.
 *
 * DSH 0.2 removed the per-delegation `toolFilter` from `SubagentStartRequest`
 * and tells deployments to configure tools in an Agent Preset selected with
 * `agentPreset`. The tool registry still owns per-scope restrictions, so the
 * workflow engine applies the same mask the delegation seam used to apply, on
 * the child's own scope. A restriction filters what a scope inherits and never
 * what its own layer registers, so the child keeps the structured-output
 * machinery it answers through.
 *
 * An empty allow list means "no tool may run"; the registry rejects empty
 * filters, so that shape is expressed as a deny of every inherited name.
 * @param child - the live child Agent whose scope receives the mask.
 * @param filter - the resolved read-only mask.
 * @returns the exact disposer that lifts the restriction.
 */
export declare function applyReadOnlyToolFilter(child: Agent, filter: ToolRestriction): () => void;
export declare class WorkflowSemaphore {
    private readonly limit;
    private active;
    private readonly waiters;
    constructor(limit: number);
    acquire(signal: AbortSignal): Promise<() => void>;
    private lease;
}
/** Validate an authored child-agent request against the same contract used at dispatch. */
export declare function validateWorkflowTaskInput(value: WorkflowSpawnAgentInput): WorkflowSpawnAgentInput;
export interface WorkflowTaskAdmissionContext {
    readonly manifest: WorkflowManifest;
    readonly config: ResolvedWorkflowConfig;
    readonly totalSpawned: number;
    readonly subagents?: Pick<SubagentRuntime, 'getProvider'>;
    readonly dispatchAvailable?: boolean;
    readonly isolationAvailable?: boolean;
}
export interface WorkflowTaskAdmission {
    readonly readOnly: boolean;
    readonly route: ResolvedWorkflowConfig['modelTiers'][WorkflowModelHint];
    readonly allocation: number;
    readonly subagentProvider: string;
}
/** Validate deterministic task admission rules shared by smoke and real execution. */
export declare function validateWorkflowTaskAdmission(input: WorkflowSpawnAgentInput, context: WorkflowTaskAdmissionContext): WorkflowTaskAdmission;
export declare class DynamicWorkflowEngine {
    private readonly deps;
    private readonly runs;
    private readonly subscribers;
    private readonly now;
    private readonly id;
    constructor(deps: WorkflowEngineDependencies);
    preflight(input: WorkflowStartInput): Promise<WorkflowPreflightResult>;
    start(input: WorkflowStartInput): Promise<WorkflowRun>;
    list(): readonly WorkflowRunSnapshot[];
    get(runId: string): WorkflowRunSnapshot | undefined;
    subscribe(listener: (event: WorkflowEvent, snapshot: WorkflowRunSnapshot) => void): () => void;
    isActive(runId: string): boolean;
    disposeAll(reason?: string): Promise<void>;
    pause(runId: string): boolean;
    resume(runId: string): boolean;
    stop(runId: string, reason?: string): boolean;
    private execute;
    private finish;
    private needsApproval;
    private emit;
    private persist;
    private projectProcess;
    private projectOutcome;
    private waitAdmission;
    private createApi;
    private startTask;
    private driveTask;
    /**
     * Start one child through the managed activation seam.
     *
     * `delivery: 'caller'` keeps the result with the workflow engine instead of
     * notifying the parent model, which is what a workflow child needs.
     * @param provider - registered subagent transport name.
     * @param request - start request without the caller-owned signal.
     * @param signal - cancellation owned by the run.
     * @returns the provider-neutral child handle.
     */
    private startChild;
    /**
     * Resolve the published child Agent or fail loud.
     * @param parent - the delegating parent whose scope holds the registry.
     * @param childId - durable child session id.
     * @param provider - provider name for the error message.
     * @returns the live child Agent.
     */
    private requireChildAgent;
    /**
     * Constrain one published child to the workflow's read-only tool mask.
     * @param parent - the delegating parent whose scope holds the registry.
     * @param childId - durable child session id.
     * @param provider - provider name for the error message.
     * @returns the disposer that lifts the restriction.
     */
    private restrictChildToReadOnly;
    private taskPrompt;
    private expectTask;
    private taskSnapshot;
    private waitTask;
}
export declare function snapshotCapsule(module: WorkflowStartInput['module'], config: ResolvedWorkflowConfig): WorkflowCapsule | undefined;
