import {
  FileCode2,
  Atom,
  Server,
  Database,
  Binary,
  Network,
  Cloud,
  MessageCircle,
  GitBranch,
  ShieldCheck,
  PhoneCall,
  Box,
  Braces,
  type LucideIcon,
} from "lucide-react";

export const TOPIC_ICON: Record<string, LucideIcon> = {
  javascript: FileCode2,
  react: Atom,
  nodejs: Server,
  database: Database,
  dsa: Binary,
  "system-design": Network,
  aws: Cloud,
  behavioral: MessageCircle,
  process: GitBranch,
  security: ShieldCheck,
  "amazon-connect": PhoneCall,
  docker: Box,
  typescript: Braces,
};

export const TOPIC_ACCENT: Record<string, string> = {
  javascript: "text-amber-500 dark:text-amber-400",
  react: "text-sky-500 dark:text-sky-400",
  nodejs: "text-emerald-500 dark:text-emerald-400",
  database: "text-lime-600 dark:text-lime-400",
  dsa: "text-violet-500 dark:text-violet-400",
  "system-design": "text-rose-500 dark:text-rose-400",
  aws: "text-orange-500 dark:text-orange-400",
  behavioral: "text-fuchsia-500 dark:text-fuchsia-400",
  process: "text-cyan-500 dark:text-cyan-400",
  security: "text-teal-500 dark:text-teal-400",
  "amazon-connect": "text-indigo-500 dark:text-indigo-400",
  docker: "text-purple-500 dark:text-purple-400",
  typescript: "text-blue-500 dark:text-blue-400",
};

export function getTopicIcon(topicId: string): LucideIcon {
  return TOPIC_ICON[topicId] ?? FileCode2;
}

export function getTopicAccent(topicId: string): string {
  return TOPIC_ACCENT[topicId] ?? "text-zinc-500 dark:text-zinc-400";
}
