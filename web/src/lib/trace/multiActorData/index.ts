import type { MultiActorTrace } from "../multiActorTypes";
import { clusterRoundRobin } from "./cluster.roundRobin";
import { workerThreadsCpuOffload } from "./workerThreads.cpuOffload";

export const multiActorTopicIds = ["cluster", "worker-threads"] as const;

export type MultiActorTopicId = (typeof multiActorTopicIds)[number];

export const multiActorTracesByTopic: Record<MultiActorTopicId, MultiActorTrace> = {
  cluster: clusterRoundRobin,
  "worker-threads": workerThreadsCpuOffload,
};

export const allMultiActorTraces: MultiActorTrace[] = Object.values(
  multiActorTracesByTopic
);
