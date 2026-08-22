import type { Trace } from "../types";

const sourceCode = `function multiply(a, b) {
  return a * b;
}
function square(n) {
  return multiply(n, n);
}
function printSquare(n) {
  console.log(square(n));
}
printSquare(5);
`;

export const callStackBasic: Trace = {
  id: "call-stack-basic",
  title: "Call stack: LIFO push/pop",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 9,
      narration:
        "printSquare(5) is called from the top level — a frame for it is pushed onto the (empty) call stack.",
      callStack: [{ id: "printSquare", label: "printSquare(5)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s2",
      line: 8,
      narration:
        "Execution enters printSquare's body and reaches the call to square(n) inside console.log(...).",
      callStack: [{ id: "printSquare", label: "printSquare(5)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s3",
      line: 5,
      narration:
        "square(5) is called — its frame is pushed on top of printSquare's. The stack is now 2 deep.",
      callStack: [
        { id: "printSquare", label: "printSquare(5)" },
        { id: "square", label: "square(5)" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s4",
      line: 2,
      narration:
        "Inside square, multiply(5, 5) is called — pushed on top again. The stack is 3 frames deep.",
      callStack: [
        { id: "printSquare", label: "printSquare(5)" },
        { id: "square", label: "square(5)" },
        { id: "multiply", label: "multiply(5, 5)" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s5",
      line: 2,
      narration:
        "multiply returns 5 * 5 = 25. Its job is done, so its frame is popped off the stack.",
      callStack: [
        { id: "printSquare", label: "printSquare(5)" },
        { id: "square", label: "square(5)" },
      ],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s6",
      line: 5,
      narration:
        "square receives 25 from multiply and returns it. square's frame pops too.",
      callStack: [{ id: "printSquare", label: "printSquare(5)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s7",
      line: 8,
      narration:
        "printSquare receives 25 and calls console.log(25) — this runs directly, it doesn't get its own visible frame here.",
      callStack: [{ id: "printSquare", label: "printSquare(5)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "25" }],
    },
    {
      id: "s8",
      line: 9,
      narration:
        "console.log finishes, printSquare returns, and its frame pops. The call stack is empty again — the script has finished.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "25" }],
    },
  ],
};
