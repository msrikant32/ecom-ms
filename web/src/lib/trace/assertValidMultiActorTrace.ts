import type { MultiActorStep, MultiActorTrace } from "./multiActorTypes";

/**
 * Same purpose as assertValidTrace, plus the invariants unique to having
 * several actors sharing one Motion LayoutGroup: every declared actor must
 * report state on every step, and every id used anywhere in a step (across
 * ALL actors' call stacks and the message channel) must be unique — layoutId
 * is tracked globally per LayoutGroup, not per-panel, so a collision would
 * make two unrelated items silently swap positions instead of animating
 * correctly.
 */
export function assertValidMultiActorTrace(trace: MultiActorTrace): void {
  const ctx = `MultiActorTrace "${trace.id}"`;

  if (trace.steps.length === 0) {
    throw new Error(`${ctx}: must have at least one step`);
  }
  if (trace.actors.length === 0) {
    throw new Error(`${ctx}: must declare at least one actor`);
  }

  const actorIds = new Set(trace.actors.map((a) => a.id));
  const lineCount = trace.sourceCode.split("\n").length;
  let prevConsoleLength = 0;
  let prevStep: MultiActorStep | null = null;

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

    const statedActorIds = step.actorStates.map((s) => s.actorId);
    if (statedActorIds.length !== actorIds.size) {
      throw new Error(
        `${stepCtx}: expected state for all ${actorIds.size} actors, got ${statedActorIds.length}`
      );
    }
    for (const actorId of statedActorIds) {
      if (!actorIds.has(actorId)) {
        throw new Error(`${stepCtx}: unknown actor id "${actorId}"`);
      }
    }
    if (new Set(statedActorIds).size !== statedActorIds.length) {
      throw new Error(`${stepCtx}: duplicate actor state entries`);
    }

    const allIds: string[] = [];
    for (const actorState of step.actorStates) {
      for (const frame of actorState.callStack) allIds.push(frame.id);
    }
    for (const message of step.inFlightMessages) {
      allIds.push(message.id);
      if (!actorIds.has(message.from) || !actorIds.has(message.to)) {
        throw new Error(
          `${stepCtx}: message "${message.id}" references an unknown actor (from="${message.from}", to="${message.to}")`
        );
      }
    }
    const seen = new Set<string>();
    for (const id of allIds) {
      if (seen.has(id)) {
        throw new Error(
          `${stepCtx}: duplicate id "${id}" across actor call stacks / message channel — layoutId must be unique per step`
        );
      }
      seen.add(id);
    }

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

function stepsAreIdentical(a: MultiActorStep, b: MultiActorStep): boolean {
  const strip = (step: MultiActorStep) =>
    Object.fromEntries(Object.entries(step).filter(([key]) => key !== "id"));
  return JSON.stringify(strip(a)) === JSON.stringify(strip(b));
}
