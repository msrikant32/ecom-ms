import type { Metadata } from "next";
import { getRenderingMode } from "@/content/renderingModes";
import { RenderingPageBody } from "@/components/layout/RenderingPageBody";

export const metadata: Metadata = {
  title: `${getRenderingMode("csr").title} — Rendering Strategies`,
};

export default function CsrPage() {
  return <RenderingPageBody modeId="csr" />;
}
