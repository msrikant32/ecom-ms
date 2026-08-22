import Link from "next/link";
import { topics, getQuestionsForTopic } from "@/content/interview";
import { getTopicIcon, getTopicAccent } from "./topicIcons";

export function TopicGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {topics.map((topic) => {
        const count = getQuestionsForTopic(topic.id).length;
        const Icon = getTopicIcon(topic.id);
        const accent = getTopicAccent(topic.id);

        if (count === 0) {
          return (
            <div
              key={topic.id}
              className="flex flex-col gap-2 rounded-xl border border-dashed border-zinc-200 p-5 opacity-60 dark:border-zinc-800"
            >
              <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.75} />
              <h3 className="text-base font-semibold text-zinc-700 dark:text-zinc-300">{topic.label}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-500">{topic.blurb}</p>
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                Coming soon
              </span>
            </div>
          );
        }

        return (
          <Link
            key={topic.id}
            href={`/interview/topics/${topic.id}`}
            className="group flex flex-col gap-2 rounded-xl border border-zinc-200 p-5 transition-colors hover:border-amber-400 dark:border-zinc-800 dark:hover:border-amber-600"
          >
            <Icon className={`h-6 w-6 ${accent}`} strokeWidth={1.75} />
            <h3 className="text-base font-semibold text-zinc-900 group-hover:text-amber-600 dark:text-zinc-50 dark:group-hover:text-amber-400">
              {topic.label}
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{topic.blurb}</p>
            <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
              {count} question{count === 1 ? "" : "s"}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
