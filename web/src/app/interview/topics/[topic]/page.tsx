import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { topics, getTopic, getQuestionsForTopic } from "@/content/interview";
import { reactQuickRef } from "@/content/interview/reactQuickRef";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { RoundBadge } from "@/components/interview/RoundBadge";
import { QuickRefDeck } from "@/components/interview/QuickRefDeck";
import { getTopicIcon, getTopicAccent } from "@/components/interview/topicIcons";

export function generateStaticParams() {
  return topics.map((t) => ({ topic: t.id }));
}

export async function generateMetadata(props: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic: topicId } = await props.params;
  const topic = getTopic(topicId);
  return { title: topic ? `${topic.label} — Interview Prep` : "Interview Prep" };
}

export default async function InterviewTopicPage(props: { params: Promise<{ topic: string }> }) {
  const { topic: topicId } = await props.params;
  const topic = getTopic(topicId);
  if (!topic) notFound();

  const questions = getQuestionsForTopic(topic.id);
  const Icon = getTopicIcon(topic.id);
  const accent = getTopicAccent(topic.id);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Interview Prep", href: "/interview" },
          { label: topic.label },
        ]}
      />

      <header className="flex flex-col gap-3">
        {/* eslint-disable-next-line react-hooks/static-components -- TOPIC_ICON is a static
        module-level map (components/interview/topicIcons.tsx); same component reference every render. */}
        <Icon className={`h-8 w-8 ${accent}`} strokeWidth={1.75} />
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{topic.label}</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{topic.blurb}</p>
      </header>

      {questions.length === 0 && topic.id !== "react" ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          No questions here yet — coming soon.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {questions.map((q) => (
            <Link
              key={q.slug}
              href={`/interview/${q.slug}`}
              className="group flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 transition-colors hover:border-amber-400 dark:border-zinc-800 dark:hover:border-amber-600"
            >
              <div className="flex items-center gap-2">
                <RoundBadge roundId={q.round} />
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                  {q.category}
                </span>
              </div>
              <h3 className="text-base font-semibold text-zinc-900 group-hover:text-amber-600 dark:text-zinc-50 dark:group-hover:text-amber-400">
                {q.question}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{q.summary}</p>
            </Link>
          ))}
        </div>
      )}

      {topic.id === "react" && (
        <div className="flex flex-col gap-4 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
              Quick Reference
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {reactQuickRef.length} more React questions, searchable and grouped by category
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Lighter-format answers spanning Basic to Advanced — search, filter by difficulty, or
              expand/collapse to scan the whole set.
            </p>
          </div>
          <QuickRefDeck />
        </div>
      )}
    </div>
  );
}
