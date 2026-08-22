import { describe, expect, it } from "vitest";
import { assertValidMultiActorTrace } from "../assertValidMultiActorTrace";
import { allMultiActorTraces } from "../multiActorData";

describe("hand-authored multi-actor traces", () => {
  it.each(allMultiActorTraces.map((trace) => [trace.id, trace] as const))(
    "%s is internally consistent",
    (_id, trace) => {
      expect(() => assertValidMultiActorTrace(trace)).not.toThrow();
    }
  );

  it("final console output matches the documented expected order", () => {
    const expected: Record<string, string[]> = {
      "cluster-round-robin": [
        "Primary 1000 is running",
        "Worker 1001 started",
        "Worker 1002 started",
      ],
      "worker-threads-cpu-offload": [
        "Main thread: starting a worker to compute a Fibonacci number",
        "Main thread received result: 102334155",
      ],
    };

    for (const trace of allMultiActorTraces) {
      const lastStep = trace.steps[trace.steps.length - 1];
      const actual = lastStep.consoleLines.map((line) => line.text);
      expect(actual, `trace "${trace.id}"`).toEqual(expected[trace.id]);
    }
  });
});
