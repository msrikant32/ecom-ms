import type { Metadata } from "next";
import { getRenderingMode } from "@/content/renderingModes";
import { RenderingPageBody } from "@/components/layout/RenderingPageBody";

// Statically generated like SSG, but Next.js will regenerate this page in
// the background at most once every 10 seconds — the classic ISR
// stale-while-revalidate behavior.
export const revalidate = 10;

export const metadata: Metadata = {
  title: `${getRenderingMode("isr").title} — Rendering Strategies`,
};

export default function IsrPage() {
  return <RenderingPageBody modeId="isr" />;
}
