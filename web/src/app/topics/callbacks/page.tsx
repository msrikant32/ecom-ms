import type { Metadata } from "next";
import { getTopic } from "@/content/topics";
import { TopicPageBody } from "@/components/layout/TopicPageBody";

export const metadata: Metadata = {
  title: `${getTopic("callbacks").title} — Node.js Core Concepts`,
};

export default function Page() {
  return <TopicPageBody topicId="callbacks" />;
}
