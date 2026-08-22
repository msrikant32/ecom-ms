import type { Trace } from "../types";
import { callStackBasic } from "./callStack.basic";
import { callbacksPlain } from "./callbacks.plain";
import { callbacksHell } from "./callbacks.hell";
import { eventLoopOrdering } from "./eventLoop.ordering";
import { libuvFsReadFile } from "./libuv.fsReadFile";
import { libuvNetworkSocket } from "./libuv.networkSocket";
import { promisesMicrotaskOrdering } from "./promises.microtaskOrdering";
import { asyncAwaitSuspension } from "./asyncAwait.suspension";

export const topicIds = [
  "call-stack",
  "callbacks",
  "event-loop",
  "libuv",
  "promises",
  "async-await",
] as const;

export type TopicId = (typeof topicIds)[number];

export const tracesByTopic: Record<TopicId, Trace[]> = {
  "call-stack": [callStackBasic],
  callbacks: [callbacksPlain, callbacksHell],
  "event-loop": [eventLoopOrdering],
  libuv: [libuvFsReadFile, libuvNetworkSocket],
  promises: [promisesMicrotaskOrdering],
  "async-await": [asyncAwaitSuspension],
};

export const allTraces: Trace[] = Object.values(tracesByTopic).flat();
