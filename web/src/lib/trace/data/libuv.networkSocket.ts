import type { Trace } from "../types";

const sourceCode = `const http = require('http');

http.get('http://api.example.com/data', (res) => {
  console.log('got response:', res.statusCode);
});

console.log('request sent...');
`;

export const libuvNetworkSocket: Trace = {
  id: "libuv-network-socket",
  title: "Network I/O: no thread pool involved",
  sourceCode,
  steps: [
    {
      id: "s1",
      line: 3,
      narration: "http.get is called to open a TCP connection and send a request.",
      callStack: [{ id: "get", label: "http.get(...)" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s2",
      line: 3,
      narration:
        "Unlike file I/O, network sockets don't use the libuv thread pool. The OS kernel's native async I/O (epoll on Linux, kqueue on macOS, IOCP on Windows) watches the socket — no worker thread is consumed.",
      callStack: [],
      webApis: [
        { id: "sock1", label: "GET api.example.com", lane: "os-async-io" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [],
    },
    {
      id: "s3",
      line: 7,
      narration: "The main thread continues immediately.",
      callStack: [{ id: "log", label: "console.log(...)" }],
      webApis: [
        { id: "sock1", label: "GET api.example.com", lane: "os-async-io" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "request sent..." }],
    },
    {
      id: "s4",
      line: 7,
      narration: "Script finishes; stack empties while the OS watches the socket for a response.",
      callStack: [],
      webApis: [
        { id: "sock1", label: "GET api.example.com", lane: "os-async-io" },
      ],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "request sent..." }],
    },
    {
      id: "s5",
      line: 4,
      narration:
        "Sometime later the response arrives. The OS notifies libuv via its event notification mechanism, and the callback is moved onto the (empty) call stack.",
      callStack: [{ id: "cb", label: "(res) => {...}" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [{ id: "c1", text: "request sent..." }],
    },
    {
      id: "s6",
      line: 4,
      narration: "console.log runs with the response.",
      callStack: [{ id: "cb", label: "(res) => {...}" }],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "request sent..." },
        { id: "c2", text: "got response: 200" },
      ],
    },
    {
      id: "s7",
      line: 5,
      narration:
        "Callback returns. Compare with fs.readFile: same 'goes off, comes back later' shape, completely different mechanism underneath — no thread-pool slot was ever used here.",
      callStack: [],
      webApis: [],
      microtaskQueue: [],
      macrotaskQueue: [],
      consoleLines: [
        { id: "c1", text: "request sent..." },
        { id: "c2", text: "got response: 200" },
      ],
    },
  ],
};
