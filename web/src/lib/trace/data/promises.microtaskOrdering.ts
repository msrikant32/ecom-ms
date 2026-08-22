import type { Trace } from "../types";

const sourceCode = `console.log('start');

setTimeout(() => console.log('timeout (macrotask)'), 0);

Promise.resolve().then(() => console.log('promise (microtask)'));

console.log('end');
`;

export const promisesMicrotaskOrdering: Trace = {
  id: "promises-microtask-ordering",
  title: "Microtasks always drain before the next macrotask",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 1,
      narration: "Script runs synchronously from the top.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "start" }],
    },
    {
      id: "s2",
      line: 3,
      narration: "setTimeout registers its callback in the Timers lane and returns immediately.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "start" }],
    },
    {
      id: "s3",
      line: 5,
      narration:
        "Promise.resolve() creates an already-resolved promise. .then() schedules its callback directly into the Microtask Queue — no Web API wait needed, since there's nothing to wait for.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [{ id: "m1", label: "() => log('promise')" }],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "start" }],
    },
    {
      id: "s4",
      line: 7,
      narration: "console.log('end') runs — still synchronous.",
      callStack: [{ id: "script", label: "(script)" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [{ id: "m1", label: "() => log('promise')" }],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
      ],
    },
    {
      id: "s5",
      line: 7,
      narration:
        "The script finishes; its frame pops. NOW the event loop checks: are there microtasks pending? Yes — it must drain the entire microtask queue before it's even allowed to look at the macrotask (timer) queue.",
      callStack: [],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [{ id: "m1", label: "() => log('promise')" }],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
      ],
    },
    {
      id: "s6",
      line: 5,
      narration: "The microtask callback runs and logs its message.",
      callStack: [{ id: "cbPromise", label: "() => log('promise')" }],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "promise (microtask)" },
      ],
    },
    {
      id: "s7",
      line: 5,
      narration:
        "Microtask queue is now empty. Only now does the event loop move on to the macrotask queue and pick up the timer callback.",
      callStack: [],
      webApis: [{ id: "t1", label: "() => log('timeout')", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "promise (microtask)" },
      ],
    },
    {
      id: "s8",
      line: 3,
      narration: "The timeout callback is dequeued and runs.",
      callStack: [{ id: "cbTimeout", label: "() => log('timeout')" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "promise (microtask)" },
        { id: "c4", text: "timeout (macrotask)" },
      ],
    },
    {
      id: "s9",
      line: 3,
      narration:
        "Final order: start, end, promise (microtask), timeout (macrotask) — the microtask queue always fully drains before the next macrotask, no matter how short the timer delay is.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "start" },
        { id: "c2", text: "end" },
        { id: "c3", text: "promise (microtask)" },
        { id: "c4", text: "timeout (macrotask)" },
      ],
    },
  ],
};
