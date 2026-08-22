import { tracesByTopic, type TopicId } from "@/lib/trace/data";
import {
  multiActorTopicIds,
  multiActorTracesByTopic,
  type MultiActorTopicId,
} from "@/lib/trace/multiActorData";
import { getAdjacentTopics, getTopic, type AnyTopicId } from "@/content/topics";
import { TraceTabs } from "@/components/visualizer/TraceTabs";
import { MultiActorVisualizer } from "@/components/visualizer/MultiActorVisualizer";
import { Breadcrumbs } from "./Breadcrumbs";
import { Pager } from "./Pager";

function isMultiActorTopic(id: AnyTopicId): id is MultiActorTopicId {
  return (multiActorTopicIds as readonly string[]).includes(id);
}

export function TopicPageBody({ topicId }: { topicId: AnyTopicId }) {
  const topic = getTopic(topicId);
  const { prev, next } = getAdjacentTopics(topicId);

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Node.js Concepts", href: "/topics" },
          { label: topic.title },
        ]}
      />
      <header className="flex flex-col gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {topic.title}
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">{topic.intro}</p>
      </header>
      {isMultiActorTopic(topicId) ? (
        <MultiActorVisualizer trace={multiActorTracesByTopic[topicId]} />
      ) : (
        <TraceTabs traces={tracesByTopic[topicId as TopicId]} />
      )}
      <Pager
        prev={prev && { href: `/topics/${prev.id}`, label: prev.title }}
        next={next && { href: `/topics/${next.id}`, label: next.title }}
      />
    </div>
  );
}
