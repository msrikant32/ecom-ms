import type { QueueItem, Trace, TraceStep } from "./types";

/**
 * Traces are hand-authored, not derived from real execution, so nothing
 * guarantees internal consistency at write time. This is the one automated
 * check standing between a typo and a visualizer that quietly lies about
 * how Node.js actually behaves.
 */
export function assertValidTrace(trace: Trace): void {
  const ctx = `Trace "${trace.id}"`;

  if (trace.steps.length === 0) {
    throw new Error(`${ctx}: must have at least one step`);
  }

  const lineCount = trace.sourceCode.split("\n").length;
  let prevConsoleLength = 0;
  let prevStep: TraceStep | null = null;

  trace.steps.forEach((step, index) => {
    const stepCtx = `${ctx}, step ${index} (${step.id})`;

    if (step.line < 1 || step.line > lineCount) {
      throw new Error(
        `${stepCtx}: line ${step.line} is out of range [1, ${lineCount}]`
      );
    }
    if (step.lineEnd !== undefined) {
      if (step.lineEnd < step.line || step.lineEnd > lineCount) {
        throw new Error(
          `${stepCtx}: lineEnd ${step.lineEnd} is invalid for line ${step.line} (max ${lineCount})`
        );
      }
    }
    if (!step.narration.trim()) {
      throw new Error(`${stepCtx}: narration must not be empty`);
    }

    checkNoDuplicateIds(step.callStack, "callStack", stepCtx);
    checkNoDuplicateIds(step.webApis, "webApis", stepCtx);
    checkNoDuplicateIds(step.microtaskQueue, "microtaskQueue", stepCtx);
    checkNoDuplicateIds(step.macrotaskQueue, "macrotaskQueue", stepCtx);

    if (step.consoleLines.length < prevConsoleLength) {
      throw new Error(
        `${stepCtx}: consoleLines shrank from ${prevConsoleLength} to ${step.consoleLines.length} — console output must only accumulate`
      );
    }
    prevConsoleLength = step.consoleLines.length;

    if (prevStep && stepsAreIdentical(prevStep, step)) {
      throw new Error(
        `${stepCtx}: identical to the previous step — likely an accidental no-op step`
      );
    }
    prevStep = step;
  });
}

function checkNoDuplicateIds(
  items: QueueItem[],
  field: string,
  stepCtx: string
): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) {
      throw new Error(`${stepCtx}: duplicate id "${item.id}" in ${field}`);
    }
    seen.add(item.id);
  }
}

function stepsAreIdentical(a: TraceStep, b: TraceStep): boolean {
  const strip = (step: TraceStep) =>
    Object.fromEntries(Object.entries(step).filter(([key]) => key !== "id"));
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
