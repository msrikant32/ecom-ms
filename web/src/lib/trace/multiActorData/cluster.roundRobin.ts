import type { MultiActorTrace } from "../multiActorTypes";

const sourceCode = `const cluster = require('cluster');
const http = require('http');

if (cluster.isPrimary) {
  console.log(\`Primary \${process.pid} is running\`);

  for (let i = 0; i < 2; i++) {
    cluster.fork();
  }
} else {
  http.createServer((req, res) => {
    res.end(\`Handled by worker \${process.pid}\`);
  }).listen(3000);

  console.log(\`Worker \${process.pid} started\`);
}
`;

export const clusterRoundRobin: MultiActorTrace = {
  id: "cluster-round-robin",
  title: "cluster: separate processes, round-robin dispatch",
  sourceCode,
  actors: [
    { id: "primary", label: "Primary", kind: "process" },
    { id: "worker1", label: "Worker 1", kind: "process" },
    { id: "worker2", label: "Worker 2", kind: "process" },
  ],
  steps: [
    {
      id: "s1",
      line: 5,
      narration: "Primary process (PID 1000) starts and logs its PID.",
      actorStates: [
        { actorId: "primary", status: "running", callStack: [{ id: "main", label: "(script)" }] },
        { actorId: "worker1", status: "not-started", callStack: [] },
        { actorId: "worker2", status: "not-started", callStack: [] },
      ],
      inFlightMessages: [],
      consoleLines: [{ id: "c1", text: "Primary 1000 is running" }],
    },
    {
      id: "s2",
      line: 8,
      narration:
        "cluster.fork() is called — this spawns worker 1 as a brand-new OS process that re-runs this same file. Nothing is shared automatically; it's a completely separate process.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "forkLoop", label: "for loop: fork()" },
          ],
        },
        { actorId: "worker1", status: "not-started", callStack: [] },
        { actorId: "worker2", status: "not-started", callStack: [] },
      ],
      inFlightMessages: [],
      consoleLines: [{ id: "c1", text: "Primary 1000 is running" }],
    },
    {
      id: "s3",
      line: 9,
      narration:
        "The loop runs a second time, forking worker 2 the same way. Both workers are now booting up as independent OS processes.",
      actorStates: [
        { actorId: "primary", status: "running", callStack: [{ id: "main", label: "(script)" }] },
        { actorId: "worker1", status: "running", callStack: [{ id: "w1main", label: "(script)" }] },
        { actorId: "worker2", status: "running", callStack: [{ id: "w2main", label: "(script)" }] },
      ],
      inFlightMessages: [],
      consoleLines: [{ id: "c1", text: "Primary 1000 is running" }],
    },
    {
      id: "s4",
      line: 11,
      lineEnd: 13,
      narration:
        "Each worker re-runs the file from the top; cluster.isPrimary is false for them, so they take the else branch and call http.createServer(...).listen(3000).",
      actorStates: [
        { actorId: "primary", status: "running", callStack: [{ id: "main", label: "(script)" }] },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s5",
      line: 13,
      narration:
        "Only the primary can actually bind port 3000 for real. Under the hood, cluster has the primary hold the one true listening socket, then hand off which worker services each incoming connection — that's how multiple processes appear to share a port without conflict.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s6",
      line: 13,
      narration:
        "Request A arrives. The primary's default round-robin scheduler picks worker 1 and forwards the connection over an internal IPC message.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [
        { id: "msgA", label: "connection A (round-robin)", from: "primary", to: "worker1" },
      ],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s7",
      line: 12,
      narration:
        "Worker 1 receives the connection and its request handler runs — the message chip flies from the channel straight into worker 1's own call stack.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
            { id: "msgA", label: "handle connection A" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s8",
      line: 13,
      narration: "Worker 1 responds and its handler frame pops — back to just listening.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s9",
      line: 13,
      narration: "Request B arrives. Round-robin now picks worker 2.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [
        { id: "msgB", label: "connection B (round-robin)", from: "primary", to: "worker2" },
      ],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s10",
      line: 12,
      narration:
        "Worker 2 receives and handles connection B — completely independently of worker 1. Separate processes mean one worker's memory, variables, and crashes can never directly touch another's.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
            { id: "msgB", label: "handle connection B" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
    {
      id: "s11",
      line: 13,
      narration:
        "Worker 2 finishes; its frame pops too. Two requests, two different OS processes, load-balanced round-robin, zero shared memory between them — that isolation is cluster's whole point.",
      actorStates: [
        {
          actorId: "primary",
          status: "running",
          callStack: [
            { id: "main", label: "(script)" },
            { id: "socket", label: "listening on :3000 (shared handle)" },
          ],
        },
        {
          actorId: "worker1",
          status: "running",
          callStack: [
            { id: "w1main", label: "(script)" },
            { id: "w1listen", label: ".listen(3000)" },
          ],
        },
        {
          actorId: "worker2",
          status: "running",
          callStack: [
            { id: "w2main", label: "(script)" },
            { id: "w2listen", label: ".listen(3000)" },
          ],
        },
      ],
      inFlightMessages: [],
      consoleLines: [
        { id: "c1", text: "Primary 1000 is running" },
        { id: "c2", text: "Worker 1001 started" },
        { id: "c3", text: "Worker 1002 started" },
      ],
    },
  ],
};
