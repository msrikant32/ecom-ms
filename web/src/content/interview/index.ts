import type { InterviewQuestion } from "./types";
import { round1Questions } from "./round1";
import { round2Questions } from "./round2";
import { round3Questions } from "./round3";
import { generalQuestions } from "./general";
import { nodejsBackendQuestions } from "./nodejsBackend";
import { databaseQuestions } from "./databaseQuestions";
import { distributedScalingQuestions } from "./distributedScaling";
import { securityQuestions } from "./securityQuestions";
import { awsQuestions } from "./awsQuestions";
import { amazonConnectQuestions } from "./amazonConnectQuestions";
import { behavioralQuestions } from "./behavioralQuestions";
import { cicdQuestions } from "./cicdQuestions";
import { distributedPatternsQuestions } from "./distributedPatternsQuestions";
import { dockerQuestions } from "./dockerQuestions";
import { typescriptQuestions } from "./typescriptQuestions";
import { bigOQuestions } from "./bigOQuestions";

export * from "./types";

export const interviewQuestions: InterviewQuestion[] = [
  ...round1Questions,
  ...round2Questions,
  ...round3Questions,
  ...generalQuestions,
  ...nodejsBackendQuestions,
  ...databaseQuestions,
  ...distributedScalingQuestions,
  ...securityQuestions,
  ...awsQuestions,
  ...amazonConnectQuestions,
  ...behavioralQuestions,
  ...cicdQuestions,
  ...distributedPatternsQuestions,
  ...bigOQuestions,
  ...dockerQuestions,
  ...typescriptQuestions,
];

export interface TopicMeta {
  id: string;
  label: string;
  blurb: string;
}

/** Maps each question's free-text `category` to one prep topic bucket. */
const CATEGORY_TO_TOPIC: Record<string, string> = {
  JavaScript: "javascript",
  React: "react",
  "Node.js / Express": "nodejs",
  "Backend Fundamentals": "nodejs",
  MongoDB: "database",
  SQL: "database",
  NoSQL: "database",
  "Distributed Systems / Databases": "database",
  DSA: "dsa",
  "System Design": "system-design",
  "Backend / System Design": "system-design",
  Behavioral: "behavioral",
  Process: "process",
  Security: "security",
  AWS: "aws",
  "Amazon Connect": "amazon-connect",
  Docker: "docker",
  TypeScript: "typescript",
};

export const topics: TopicMeta[] = [
  { id: "javascript", label: "JavaScript", blurb: "Closures, scoping, async/await, event loop, prototypes." },
  { id: "react", label: "React", blurb: "Hooks, rendering behavior, state, component design." },
  { id: "nodejs", label: "Node.js / Backend", blurb: "Express, middleware, auth, backend fundamentals." },
  { id: "database", label: "Database", blurb: "SQL, MongoDB, replication, partitioning, CAP theorem." },
  { id: "dsa", label: "DSA", blurb: "Data structures & algorithms problems." },
  { id: "system-design", label: "System Design", blurb: "Scaling, caching, architecture tradeoffs." },
  { id: "aws", label: "AWS / Cloud", blurb: "VPC, EC2, Lambda, DynamoDB, KMS, CloudFront, WAF, and more." },
  { id: "behavioral", label: "Behavioral", blurb: "War stories, teamwork, conflict handling." },
  { id: "process", label: "Process & Tooling", blurb: "Git workflow, code review, CI/CD." },
  { id: "security", label: "Security", blurb: "Encryption, hashing, JWTs, TLS, key management." },
  { id: "amazon-connect", label: "Amazon Connect", blurb: "Contact flows, routing, IVR, omnichannel, security." },
  { id: "docker", label: "Docker", blurb: "Images, layers, compose, volumes, orchestration." },
  { id: "typescript", label: "TypeScript", blurb: "Generics, utility types, narrowing, strict mode." },
];

export function getTopicId(category: string): string {
  return CATEGORY_TO_TOPIC[category] ?? "other";
}

export function getTopic(topicId: string): TopicMeta | undefined {
  return topics.find((t) => t.id === topicId);
}

export function getQuestionsForTopic(topicId: string): InterviewQuestion[] {
  return interviewQuestions.filter((q) => getTopicId(q.category) === topicId);
}

export function getInterviewQuestion(slug: string): InterviewQuestion | undefined {
  return interviewQuestions.find((q) => q.slug === slug);
}

/** Prev/next within the same topic bucket — used for the pager on a question page. */
export function getAdjacentQuestionInTopic(slug: string): {
  prev?: InterviewQuestion;
  next?: InterviewQuestion;
} {
  const question = getInterviewQuestion(slug);
  if (!question) return {};
  const siblings = getQuestionsForTopic(getTopicId(question.category));
  const index = siblings.findIndex((q) => q.slug === slug);
  return { prev: siblings[index - 1], next: siblings[index + 1] };
}

const ROUND_BADGE: Record<string, string> = {
  "round-1": "Round 1",
  "round-2": "Round 2",
  "round-3": "Round 3",
  general: "General",
};

export function getRoundBadgeLabel(roundId?: string): string | undefined {
  if (!roundId) return undefined;
  return ROUND_BADGE[roundId] ?? roundId;
}
