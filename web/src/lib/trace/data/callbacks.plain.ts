import type { Trace } from "../types";

const sourceCode = `function greet(name, callback) {
  callback(\`Hello, \${name}!\`);
}

greet('Ada', (message) => {
  console.log(message);
});
`;

export const callbacksPlain: Trace = {
  id: "callbacks-plain",
  title: "A callback is just a function you hand to someone else",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 5,
      narration:
        "greet('Ada', callback) is called. The arrow function is passed in as data — it is NOT run yet, just handed over.",
      callStack: [{ id: "greet", label: "greet('Ada', callback)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s2",
      line: 2,
      narration:
        "Inside greet, we call callback(...) — this is the moment the passed-in function actually runs.",
      callStack: [{ id: "greet", label: "greet('Ada', callback)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s3",
      line: 6,
      narration:
        "The callback's frame is pushed on top of greet's. A callback invocation is a normal function call — nothing magic happens here.",
      callStack: [
        { id: "greet", label: "greet('Ada', callback)" },
        { id: "callback", label: "callback('Hello, Ada!')" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s4",
      line: 6,
      narration: "console.log(message) runs, printing the greeting.",
      callStack: [
        { id: "greet", label: "greet('Ada', callback)" },
        { id: "callback", label: "callback('Hello, Ada!')" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "Hello, Ada!" }],
    },
    {
      id: "s5",
      line: 2,
      narration: "The callback returns; its frame pops off the stack.",
      callStack: [{ id: "greet", label: "greet('Ada', callback)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "Hello, Ada!" }],
    },
    {
      id: "s6",
      line: 3,
      narration: "greet returns; its frame pops too. The stack is empty.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "Hello, Ada!" }],
    },
  ],
};
