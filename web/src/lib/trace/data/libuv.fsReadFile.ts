import type { Trace } from "../types";

const sourceCode = `const fs = require('fs');

fs.readFile('file.txt', 'utf8', (err, data) => {
  console.log('file contents:', data);
});

console.log('reading file...');
`;

export const libuvFsReadFile: Trace = {
  id: "libuv-fs-read-file",
  title: "File I/O: offloaded to the libuv thread pool",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 3,
      narration: "fs.readFile is called. Node hands the actual file-reading work to libuv.",
      callStack: [{ id: "readFile", label: "fs.readFile(...)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s2",
      line: 3,
      narration:
        "libuv assigns the read to one of its 4 thread-pool workers. fs.readFile returns immediately — the main JS thread is never blocked waiting on disk I/O.",
      callStack: [],
      webApis: [
        { id: "w1", label: "readFile('file.txt')", lane: "libuv-threadpool" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s3",
      line: 7,
      narration: "The main thread moves right on to the next line.",
      callStack: [{ id: "log", label: "console.log(...)" }],
      webApis: [
        { id: "w1", label: "readFile('file.txt')", lane: "libuv-threadpool" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "reading file..." }],
    },
    {
      id: "s4",
      line: 7,
      narration:
        "Script finishes; call stack empties. Meanwhile a worker thread is still reading the file in the background.",
      callStack: [],
      webApis: [
        { id: "w1", label: "readFile('file.txt')", lane: "libuv-threadpool" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "reading file..." }],
    },
    {
      id: "s5",
      line: 4,
      narration:
        "The worker thread finishes reading the file and hands the result back. Its callback is moved onto the (empty) call stack to run.",
      callStack: [{ id: "cb", label: "(err, data) => {...}" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "reading file..." }],
    },
    {
      id: "s6",
      line: 4,
      narration: "console.log runs with the file's contents.",
      callStack: [{ id: "cb", label: "(err, data) => {...}" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "reading file..." },
        { id: "c2", text: "file contents: <data>" },
      ],
    },
    {
      id: "s7",
      line: 5,
      narration:
        "Callback returns, frame pops. The thread pool — not the main JS thread — did the blocking disk read; that's libuv's job for filesystem operations.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "reading file..." },
        { id: "c2", text: "file contents: <data>" },
      ],
    },
  ],
};
