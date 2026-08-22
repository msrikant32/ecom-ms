import { type TopicId } from "@/lib/trace/data";
import { type MultiActorTopicId } from "@/lib/trace/multiActorData";

export type AnyTopicId = TopicId | MultiActorTopicId;

export interface TopicMeta {
  id: AnyTopicId;
  title: string;
  blurb: string;
  intro: string;
}

export const topics: TopicMeta[] = [
  {
    id: "call-stack",
    title: "Call Stack",
    blurb: "How JavaScript tracks what's running, one frame at a time.",
    intro:
      "Every function call pushes a frame onto the call stack; every return pops one off. It's strictly last-in-first-out (LIFO) — watch a 3-level-deep chain of calls unwind in the exact reverse order it built up.",
  },
  {
    id: "callbacks",
    title: "Callbacks & Callback Hell",
    blurb: "Passing functions as data — and what happens when you nest too many.",
    intro:
      "A callback is just a function passed as an argument and invoked later. The first example is entirely synchronous, to isolate the pattern from timing. The second nests three setTimeout calls to show the classic 'pyramid of doom' — and a surprising fact: the call stack never actually gets three levels deep, even though the code does.",
  },
  {
    id: "event-loop",
    title: "The Event Loop",
    blurb: "Why a 0ms setTimeout still runs after your synchronous code.",
    intro:
      "The event loop's first rule: it never interrupts running JavaScript. The call stack must be completely empty before it will pull anything off a queue — which is why 'start, end, timeout' is the only possible output order here, regardless of the delay.",
  },
  {
    id: "libuv",
    title: "libuv",
    blurb:
      "The C library that gives Node.js async I/O — and why file reads and network calls work differently.",
    intro:
      "libuv is the C library underneath Node that implements the event loop and hands off blocking work. But 'async' isn't one mechanism: file system operations use a fixed-size thread pool (4 workers by default), while network sockets ride the operating system's own async I/O notifications and use zero thread-pool slots. Compare the two traces below.",
  },
  {
    id: "promises",
    title: "Promises & the Microtask Queue",
    blurb: "Why promise callbacks always beat setTimeout, no matter the delay.",
    intro:
      "Promise .then() callbacks go into a separate, higher-priority microtask queue — not the same macrotask queue setTimeout uses. The event loop always drains the microtask queue completely before handling even one macrotask, which is why a promise callback can 'jump the line' ahead of a setTimeout(fn, 0).",
  },
  {
    id: "async-await",
    title: "Async/Await",
    blurb: "Syntactic sugar over promises: suspend, resume, and the illusion of blocking.",
    intro:
      "await looks like it pauses execution in place, but under the hood it suspends the async function, pops its frame off the call stack, and schedules a microtask to resume it later. The rest of your program keeps running in the meantime — it's queue-based concurrency wearing a synchronous-looking disguise.",
  },
  {
    id: "cluster",
    title: "Cluster",
    blurb: "Scaling across CPU cores with separate OS processes.",
    intro:
      "cluster.fork() spawns full, independent OS processes — separate memory, separate V8 heap, separate event loop, nothing shared automatically. The primary process holds the one real listening socket and round-robins incoming connections to workers over IPC. That isolation is the whole point: one worker crashing or leaking memory never touches another. Note: cluster does NOT auto-restart a crashed worker — the primary has to listen for the 'exit' event and fork a replacement itself.",
  },
  {
    id: "worker-threads",
    title: "Worker Threads",
    blurb: "Offloading CPU-heavy work without leaving the process.",
    intro:
      "new Worker() spawns a new OS thread inside the SAME process — much lighter than cluster's full process fork. It's built for offloading synchronous, CPU-heavy work (hashing, image processing, a slow Fibonacci) so it never blocks the main thread's event loop. Data still crosses via message-passing (structured clone) by default, not literal shared memory — that's what SharedArrayBuffer is for, a further opt-in step this example doesn't use.",
  },
];

export function getTopic(id: AnyTopicId): TopicMeta {
  const topic = topics.find((t) => t.id === id);
  if (!topic) throw new Error(`Unknown topic id: ${id}`);
  return topic;
}

export function getAdjacentTopics(id: AnyTopicId): {
  prev?: TopicMeta;
  next?: TopicMeta;
} {
  const index = topics.findIndex((t) => t.id === id);
  return { prev: topics[index - 1], next: topics[index + 1] };
}
