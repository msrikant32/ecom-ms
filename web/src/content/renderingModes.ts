export type RenderingModeId = "csr" | "ssr" | "ssg" | "isr";

export interface RenderingModeMeta {
  id: RenderingModeId;
  title: string;
  blurb: string;
  intro: string;
}

export const renderingModes: RenderingModeMeta[] = [
  {
    id: "csr",
    title: "CSR — Client-Side Rendering",
    blurb: "The server sends an empty shell; the browser fills it in after JS loads.",
    intro:
      "This page's HTML ships with no timestamp at all — view the raw page source (not devtools) and you'll see a loading placeholder, not a value. The timestamp only appears after React hydrates in the browser and a client-side effect runs. Reload: the timestamp is always freshly computed on YOUR machine, not the server's.",
  },
  {
    id: "ssr",
    title: "SSR — Server-Side Rendering",
    blurb: "Rendered fresh on the server for every single request.",
    intro:
      "This page sets export const dynamic = 'force-dynamic'. The timestamp is computed on the server at request time and is already present in the initial HTML — view source and it's right there, no client JS needed to see it. Reload: a new timestamp every time, because the server genuinely re-renders this page on every request.",
  },
  {
    id: "ssg",
    title: "SSG — Static Site Generation",
    blurb: "Rendered once, at build time — every visitor gets the same frozen HTML.",
    intro:
      "This page sets export const dynamic = 'force-static'. The timestamp below was computed once, when next build ran, and baked into static HTML served to every visitor since. Reload as many times as you like — it will not change until the app is rebuilt.",
  },
  {
    id: "isr",
    title: "ISR — Incremental Static Regeneration",
    blurb: "Static like SSG, but automatically regenerated in the background on a timer.",
    intro:
      "This page sets export const revalidate = 10. Like SSG, the timestamp is frozen and shared by every visitor — but only for a 10 second window. The first request after that window triggers regeneration in the background (that request, and some after it, still get the old cached page instantly); once regeneration finishes, subsequent requests see the new frozen timestamp.",
  },
];

export function getRenderingMode(id: RenderingModeId): RenderingModeMeta {
  const mode = renderingModes.find((m) => m.id === id);
  if (!mode) throw new Error(`Unknown rendering mode id: ${id}`);
  return mode;
}

export function getAdjacentRenderingModes(id: RenderingModeId): {
  prev?: RenderingModeMeta;
  next?: RenderingModeMeta;
} {
  const index = renderingModes.findIndex((m) => m.id === id);
  return { prev: renderingModes[index - 1], next: renderingModes[index + 1] };
}
