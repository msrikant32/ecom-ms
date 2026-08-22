import type { ConsoleLine } from "./types";

export type ActorKind = "process" | "thread";

export interface Actor {
  id: string;
  label: string;
  kind: ActorKind;
}

export type ActorStatus = "not-started" | "running" | "terminated";

export interface ActorFrame {
  id: string;
  label: string;
}

export interface ActorState {
  actorId: string;
  status: ActorStatus;
  callStack: ActorFrame[];
}

/** A message currently in transit between two actors' call stacks. */
export interface ChannelMessage {
  id: string;
  label: string;
  from: string;
  to: string;
}

/**
 * Full snapshot of every actor's state at one point in a multi-actor
 * example's execution — same "steps are snapshots, not deltas" design as
 * the single-actor Trace. A message chip and the call-stack frame it turns
 * into on delivery deliberately share an id, so Motion's layoutId
 * animates it visually flying from the channel into the receiving actor's
 * lane between steps.
 */
export interface MultiActorStep {
  id: string;
  line: number;
  lineEnd?: number;
  narration: string;
  actorStates: ActorState[];
  inFlightMessages: ChannelMessage[];
  consoleLines: ConsoleLine[];
}

export interface MultiActorTrace {
  id: string;
  title: string;
  sourceCode: string;
  actors: Actor[];
  steps: MultiActorStep[];
}
