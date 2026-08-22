export type WebApiLane = "libuv-threadpool" | "os-async-io" | "timer-list";

export interface StackFrame {
  id: string;
  label: string;
}

export interface QueueItem {
  id: string;
  label: string;
}

export interface WebApiItem extends QueueItem {
  lane: WebApiLane;
}

export interface ConsoleLine {
  id: string;
  text: string;
}

/**
 * A full snapshot of visualizer state at one point in an example's
 * execution — not a delta. Scrubbing to step N just renders steps[N],
 * so Step/Back/Reset/Play all reduce to "pick an index".
 */
export interface TraceStep {
  id: string;
  /** 1-indexed line in Trace.sourceCode to highlight. */
  line: number;
  /** Optional end of a multi-line highlight range (inclusive). */
  lineEnd?: number;
  /** Caption explaining what's happening at this step. */
  narration: string;
  callStack: StackFrame[];
  webApis: WebApiItem[];
  microtaskQueue: QueueItem[];
  macrotaskQueue: QueueItem[];
  /** Cumulative console output up to and including this step. */
  consoleLines: ConsoleLine[];
}

export interface Trace {
  id: string;
  title: string;
  /** Single source of truth for the code panel and its line numbers. */
  sourceCode: string;
  steps: TraceStep[];
}
