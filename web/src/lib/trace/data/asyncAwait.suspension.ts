import type { Trace } from "../types";

const sourceCode = `async function getData() {
  console.log('A');
  const x = await Promise.resolve(1);
  console.log('B', x);
  return x;
}

console.log('1');
getData();
console.log('2');
`;

export const asyncAwaitSuspension: Trace = {
  id: "async-await-suspension",
  title: "await suspends and resumes — it doesn't block",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 8,
      narration: "Script starts.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "1" }],
    },
    {
      id: "s2",
      line: 9,
      narration: "getData() is called synchronously — like any function call, a frame is pushed.",
      callStack: [
        { id: "script", label: "(script)" },
        { id: "getData", label: "getData()" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "1" }],
    },
    {
      id: "s3",
      line: 2,
      narration: "Inside getData, console.log('A') runs.",
      callStack: [
        { id: "script", label: "(script)" },
        { id: "getData", label: "getData()" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
      ],
    },
    {
      id: "s4",
      line: 3,
      narration:
        "Promise.resolve(1) creates an already-resolved promise, and await suspends getData right here.",
      callStack: [
        { id: "script", label: "(script)" },
        { id: "getData", label: "getData() [suspended]" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
      ],
    },
    {
      id: "s5",
      line: 3,
      narration:
        "The key move: getData's frame is popped off the call stack (it's paused, not blocking anything), and a continuation — 'resume getData after this await' — is queued as a microtask.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [],
      microtaskQueue: [{ id: "m1", label: "resume getData() with x = 1" }],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
      ],
    },
    {
      id: "s6",
      line: 10,
      narration:
        "Control returns all the way back to the caller. getData() itself already returned (a pending Promise), so console.log('2') runs next.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [],
      microtaskQueue: [{ id: "m1", label: "resume getData() with x = 1" }],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
        { id: "c3", text: "2" },
      ],
    },
    {
      id: "s7",
      line: 10,
      narration:
        "The top-level script finishes; its frame pops. Stack is empty — now the event loop can drain the microtask queue.",
      callStack: [],
      webApis: [],
      microtaskQueue: [{ id: "m1", label: "resume getData() with x = 1" }],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
        { id: "c3", text: "2" },
      ],
    },
    {
      id: "s8",
      line: 4,
      narration:
        "getData's frame is pushed back onto the stack, resuming exactly where it left off, with x = 1.",
      callStack: [{ id: "getData", label: "getData() [resumed]" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
        { id: "c3", text: "2" },
      ],
    },
    {
      id: "s9",
      line: 4,
      narration: "console.log('B', x) runs.",
      callStack: [{ id: "getData", label: "getData() [resumed]" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
        { id: "c3", text: "2" },
        { id: "c4", text: "B 1" },
      ],
    },
    {
      id: "s10",
      line: 6,
      narration:
        "getData returns x; its frame pops for good. Final order: 1, A, 2, B 1 — proof that await is queue-based (via microtasks), not a blocking pause of the whole program.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1" },
        { id: "c2", text: "A" },
        { id: "c3", text: "2" },
        { id: "c4", text: "B 1" },
      ],
    },
  ],
};
