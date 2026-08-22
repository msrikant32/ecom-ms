import type { Trace } from "../types";

const sourceCode = `console.log('start');
setTimeout(() => console.log('timeout'), 0);
console.log('end');
`;

export const eventLoopOrdering: Trace = {
  id: "event-loop-ordering",
  title: "Why 0ms doesn't mean 'now'",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 1,
      narration: "The script starts running synchronously. console.log('start') runs.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "start" }],
    },
    {
      id: "s2",
      line: 2,
      narration:
        "setTimeout(fn, 0) is called. Even with a 0ms delay, it does NOT run fn immediately — it registers fn in the Timers lane and returns right away.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "start" }],
    },
    {
      id: "s3",
      line: 3,
      narration:
        "console.log('end') runs next — still perfectly synchronous. Nothing async has happened yet.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
      ],
    },
    {
      id: "s4",
      line: 3,
      narration:
        "The script finishes; its frame pops and the call stack is empty. Only now can the event loop even look at the Timers lane.",
      callStack: [],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
      ],
    },
    {
      id: "s5",
      line: 2,
      narration:
        "The event loop sees the stack is empty and the 0ms timer is ready, so it moves the callback onto the stack to run.",
      callStack: [{ id: "cb", label: "() => log('timeout')" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
      ],
    },
    {
      id: "s6",
      line: 2,
      narration: "console.log('timeout') runs.",
      callStack: [{ id: "cb", label: "() => log('timeout')" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "timeout" },
      ],
    },
    {
      id: "s7",
      line: 2,
      narration:
        "The callback returns and its frame pops. Final order: start, end, timeout — never start, timeout, end, no matter how short the delay is.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "timeout" },
      ],
    },
  ],
};
