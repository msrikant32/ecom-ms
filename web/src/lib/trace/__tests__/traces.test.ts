import { describe, expect, it } from "vitest";
import { assertValidTrace } from "../assertValidTrace";
import { allTraces } from "../data";

describe("hand-authored traces", () => {
  it.each(allTraces.map((trace) => [trace.id, trace] as const))(
    "%s is internally consistent",
    (_id, trace) => {
      expect(() => assertValidTrace(trace)).not.toThrow();
    }
  );

  it("final console output matches the documented expected order", () => {
    const expected: Record<string, string[]> = {
      "call-stack-basic": ["25"],
      "callbacks-plain": ["Hello, Ada!"],
      "callbacks-hell": ["1: got user", "2: got posts", "3: got comments"],
      "event-loop-ordering": ["start", "end", "timeout"],
      "libuv-fs-read-file": ["reading file...", "file contents: <data>"],
      "libuv-network-socket": ["request sent...", "got response: 200"],
      "promises-microtask-ordering": [
        "start",
        "end",
        "promise (microtask)",
        "timeout (macrotask)",
      ],
      "async-await-suspension": ["1", "A", "2", "B 1"],
    };

    for (const trace of allTraces) {
      const lastStep = trace.steps[trace.steps.length - 1];
      const actual = lastStep.consoleLines.map((line) => line.text);
      expect(actual, `trace "${trace.id}"`).toEqual(expected[trace.id]);
    }
  });
});
