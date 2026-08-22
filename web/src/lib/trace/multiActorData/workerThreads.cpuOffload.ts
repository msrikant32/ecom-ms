import type { MultiActorTrace } from "../multiActorTypes";

const sourceCode = `const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

if (isMainThread) {
  console.log('Main thread: starting a worker to compute a Fibonacci number');

  const worker = new Worker(__filename, { workerData: { n: 40 } });

  worker.on('message', (result) => {
    console.log('Main thread received result:', result);
  });
} else {
  function fib(n) {
    return n < 2 ? n : fib(n - 1) + fib(n - 2);
  }

  const result = fib(workerData.n);
  parentPort.postMessage(result);
}
`;

export const workerThreadsCpuOffload: MultiActorTrace = {
  id: "worker-threads-cpu-offload",
  title: "worker_threads: same process, separate thread",
  sourceCode,
  actors: [
    { id: "main", label: "Main", kind: "thread" },
    { id: "worker1", label: "Worker 1", kind: "thread" },
  ],
  steps: [
    {
      id: "s1",
      line: 4,
      narration: "The main thread runs first (isMainThread is true here) and logs its intent.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "not-started", callStack: [] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s2",
      line: 6,
      narration:
        "new Worker(__filename, { workerData: { n: 40 } }) spawns a new OS thread — NOT a new process. It runs inside the same process as the main thread, though data passed via workerData is still cloned, not literally shared.",
      actorStates: [
        {
          actorId: "main",
          status: "running",
          callStack: [
            { id: "mainFrame", label: "(main thread)" },
            { id: "newWorker", label: "new Worker(...)" },
          ],
        },
        { actorId: "worker1", status: "not-started", callStack: [] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s3",
      line: 6,
      narration:
        "The worker thread boots and re-runs this same file. isMainThread is false there, so it takes the else branch — with workerData = { n: 40 } passed in.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s4",
      line: 8,
      narration:
        "Back on the main thread, worker.on('message', ...) registers a listener and returns immediately — it does not block. The main thread is free to do other work while the worker computes.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s5",
      line: 13,
      narration:
        "Meanwhile the worker thread runs fib(40) — a deliberately slow, CPU-heavy synchronous computation. This fully occupies the worker's own thread and call stack, but crucially cannot block the main thread at all: they're separate threads with separate stacks.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1frame", label: "(worker thread)" },
            { id: "fib", label: "fib(40) — computing..." },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s6",
      line: 16,
      narration:
        "fib(40) finally returns its result after a lot of recursive calls, all of which happened entirely on the worker's own stack, invisible to the main thread.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s7",
      line: 17,
      narration:
        "parentPort.postMessage(result) sends the result back to the main thread. This is a real message hand-off (the value is structured-cloned) — not a shared-memory read.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [
        { id: "msgResult", label: "postMessage(102334155)", from: "worker1", to: "main" },
      ],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s8",
      line: 9,
      narration:
        "The main thread's 'message' listener fires — the chip flies from the channel straight into the main thread's own call stack.",
      actorStates: [
        {
          actorId: "main",
          status: "running",
          callStack: [
            { id: "mainFrame", label: "(main thread)" },
            { id: "msgResult", label: "on('message') handler" },
          ],
        },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
      ],
    },
    {
      id: "s9",
      line: 9,
      narration: "console.log prints the result on the main thread.",
      actorStates: [
        {
          actorId: "main",
          status: "running",
          callStack: [
            { id: "mainFrame", label: "(main thread)" },
            { id: "msgResult", label: "on('message') handler" },
          ],
        },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
        { id: "c2", text: "Main thread received result: 102334155" },
      ],
    },
    {
      id: "s10",
      line: 10,
      narration:
        "The handler returns and its frame pops. fib(40) never once blocked the main thread's event loop — it ran entirely on a separate OS thread, with only the final result crossing back over via message-passing.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1frame", label: "(worker thread)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
        { id: "c2", text: "Main thread received result: 102334155" },
      ],
    },
    {
      id: "s11",
      line: 18,
      narration:
        "With nothing left to do, the worker thread's event loop has no more pending work, so it exits on its own — worker threads don't need an explicit terminate() call to end when their job is done.",
      actorStates: [
        { actorId: "main", status: "running", callStack: [{ id: "mainFrame", label: "(main thread)" }] },
        { actorId: "worker1", status: "terminated", callStack: [] },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Main thread: starting a worker to compute a Fibonacci number" },
        { id: "c2", text: "Main thread received result: 102334155" },
      ],
    },
  ],
};
