import type { Trace } from "../types";

const sourceCode = `setTimeout(() => {
  console.log('1: got user');
  setTimeout(() => {
    console.log('2: got posts');
    setTimeout(() => {
      console.log('3: got comments');
    }, 500);
  }, 500);
}, 500);
`;

export const callbacksHell: Trace = {
  id: "callbacks-hell",
  title: "Callback hell: nested code, not a nested stack",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 1,
      narration: "setTimeout(cb1, 500) is called to register the first timer.",
      callStack: [{ id: "setTimeout1", label: "setTimeout(cb1, 500)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s2",
      line: 9,
      narration:
        "setTimeout returns immediately — it never waits. cb1 now sits in the Timers lane while the script (and the call stack) has nothing left to do.",
      callStack: [],
      webApis: [{ id: "t1", label: "cb1 (500ms)", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s3",
      line: 2,
      narration:
        "~500ms later, the event loop moves cb1 from Timers onto the (empty) call stack to run it.",
      callStack: [{ id: "cb1", label: "cb1()" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "1: got user" }],
    },
    {
      id: "s4",
      line: 3,
      lineEnd: 8,
      narration:
        "Still inside cb1, it calls setTimeout(cb2, 500) — registering the next, more deeply nested timer.",
      callStack: [{ id: "cb1", label: "cb1()" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "1: got user" }],
    },
    {
      id: "s5",
      line: 9,
      narration:
        "cb2 now waits in Timers. cb1 has nothing left to do and returns — its frame pops. The stack is empty again, even though the CODE is nested three levels deep. Code nesting depth is not the same as call stack depth.",
      callStack: [],
      webApis: [{ id: "t2", label: "cb2 (500ms)", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "1: got user" }],
    },
    {
      id: "s6",
      line: 4,
      narration: "~500ms later, cb2 is dequeued and pushed onto the stack.",
      callStack: [{ id: "cb2", label: "cb2()" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1: got user" },
        { id: "c2", text: "2: got posts" },
      ],
    },
    {
      id: "s7",
      line: 5,
      lineEnd: 7,
      narration: "cb2 calls setTimeout(cb3, 500) — the third nested timer.",
      callStack: [{ id: "cb2", label: "cb2()" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1: got user" },
        { id: "c2", text: "2: got posts" },
      ],
    },
    {
      id: "s8",
      line: 8,
      narration: "cb2 returns; its frame pops. Stack is empty again, waiting on cb3.",
      callStack: [],
      webApis: [{ id: "t3", label: "cb3 (500ms)", lane: "timer-list" }],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1: got user" },
        { id: "c2", text: "2: got posts" },
      ],
    },
    {
      id: "s9",
      line: 6,
      narration: "~500ms later, cb3 runs and logs the final message.",
      callStack: [{ id: "cb3", label: "cb3()" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1: got user" },
        { id: "c2", text: "2: got posts" },
        { id: "c3", text: "3: got comments" },
      ],
    },
    {
      id: "s10",
      line: 7,
      narration:
        "cb3 returns; its frame pops. All three timers fired one after another, each in its own shallow, momentary stack frame — the deep visual nesting only ever existed in the source code.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "1: got user" },
        { id: "c2", text: "2: got posts" },
        { id: "c3", text: "3: got comments" },
      ],
    },
  ],
};
