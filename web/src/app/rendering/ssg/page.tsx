import type { Metadata } from "next";
import { getRenderingMode } from "@/content/renderingModes";
import { RenderingPageBody } from "@/components/layout/RenderingPageBody";

// Forces this page to be fully prerendered at build time and served as
// static HTML thereafter — the same output for every visitor until the
// next `next build`.
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `${getRenderingMode("ssg").title} — Rendering Strategies`,
};

export default function SsgPage() {
  return <RenderingPageBody modeId="ssg" />;
}
