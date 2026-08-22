import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAdjacentQuestionInTopic,
  getInterviewQuestion,
  getRoundBadgeLabel,
  getTopic,
  getTopicId,
  interviewQuestions,
} from "@/content/interview";
import { CodeBlock } from "@/components/interview/CodeBlock";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Pager } from "@/components/layout/Pager";
import { RoundBadge } from "@/components/interview/RoundBadge";

export function generateStaticParams() {
  return interviewQuestions.map((q) => ({ slug: q.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const question = getInterviewQuestion(slug);
  return { title: question ? `${question.question} — Interview Prep` : "Interview Prep" };
}

export default async function InterviewQuestionPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const question = getInterviewQuestion(slug);
  if (!question) notFound();

  const topicId = getTopicId(question.category);
  const topic = getTopic(topicId);
  const { prev, next } = getAdjacentQuestionInTopic(slug);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Interview Prep", href: "/interview" },
          ...(topic ? [{ label: topic.label, href: `/interview/topics/${topic.id}` }] : []),
          { label: question.question },
        ]}
      />

      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <RoundBadge roundId={question.round} />
          <p className="text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            {question.category}
          </p>
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {question.question}
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{question.intro}</p>
      </header>

      <div className="flex flex-col gap-6">
        {question.sections.map((section) => (
          <section key={section.heading} className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {section.heading}
            </h2>
            <div className="flex flex-col gap-3">
              {section.points.map((point) => (
                <div
                  key={point.title}
                  className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {point.title}
                  </h3>
                  {point.detail && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{point.detail}</p>
                  )}
                  {point.code && (
                    <CodeBlock code={point.code} language={point.codeLanguage} />
                  )}
                  {point.sourceRef && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-500">
                      Source: <code className="font-mono">{point.sourceRef}</code>
                    </p>
                  )}
                  {point.relatedLink && (
                    <Link
                      href={point.relatedLink.href}
                      className="text-xs text-amber-600 hover:underline dark:text-amber-400"
                    >
                      {point.relatedLink.label} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-800 dark:text-amber-200">
        <p className="font-semibold">In an actual interview</p>
        <p className="mt-1">{question.closingTip}</p>
      </section>

      <Pager
        prev={
          prev && {
            href: `/interview/${prev.slug}`,
            label: prev.question,
            eyebrow: [prev.category, getRoundBadgeLabel(prev.round)].filter(Boolean).join(" · "),
          }
        }
        next={
          next && {
            href: `/interview/${next.slug}`,
            label: next.question,
            eyebrow: [next.category, getRoundBadgeLabel(next.round)].filter(Boolean).join(" · "),
          }
        }
      />
    </div>
  );
}
