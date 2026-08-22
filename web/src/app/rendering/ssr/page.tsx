import type { Metadata } from "next";
import { getRenderingMode } from "@/content/renderingModes";
import { RenderingPageBody } from "@/components/layout/RenderingPageBody";

// Forces this page to be dynamically rendered on the server for every
// request — the opposite of the static-by-default behavior Next.js
// otherwise applies to a page with no runtime APIs or fetch calls.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `${getRenderingMode("ssr").title} — Rendering Strategies`,
};

export default function SsrPage() {
  return <RenderingPageBody modeId="ssr" />;
}
