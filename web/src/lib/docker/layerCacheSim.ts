export interface DockerfileLine {
  id: string;
  instruction: string;
  /** Simulated seconds this layer takes to execute if it has to rebuild. */
  costSeconds: number;
}

export type ChangeScenario = "source" | "deps";

export interface DockerfileOrder {
  id: "bad" | "good";
  label: string;
  lines: DockerfileLine[];
  /** Which line's content is affected first, per scenario — the real cache rule cascades from here downward. */
  firstChangedLineId: Record<ChangeScenario, string>;
}

// The exact contrast from the docker-image-layers-and-build-cache interview
// question, made interactive: the SAME two changes (a source edit vs a
// dependency change), against two different instruction orders.
export const BAD_ORDER: DockerfileOrder = {
  id: "bad",
  label: "Bad order — COPY everything before installing",
  lines: [
    { id: "from", instruction: "FROM node:22-slim", costSeconds: 0 },
    { id: "workdir", instruction: "WORKDIR /app", costSeconds: 0.1 },
    { id: "copy-all", instruction: "COPY . .", costSeconds: 2 },
    { id: "npm-ci", instruction: "RUN npm ci", costSeconds: 45 },
    { id: "cmd", instruction: 'CMD ["node", "server.js"]', costSeconds: 0.1 },
  ],
  firstChangedLineId: {
    // COPY . . bundles source AND package.json together — either change invalidates the SAME layer.
    source: "copy-all",
    deps: "copy-all",
  },
};

export const GOOD_ORDER: DockerfileOrder = {
  id: "good",
  label: "Good order — install dependencies before copying source",
  lines: [
    { id: "from", instruction: "FROM node:22-slim", costSeconds: 0 },
    { id: "workdir", instruction: "WORKDIR /app", costSeconds: 0.1 },
    { id: "copy-pkg", instruction: "COPY package.json package-lock.json ./", costSeconds: 0.5 },
    { id: "npm-ci", instruction: "RUN npm ci", costSeconds: 45 },
    { id: "copy-src", instruction: "COPY . .", costSeconds: 2 },
    { id: "cmd", instruction: 'CMD ["node", "server.js"]', costSeconds: 0.1 },
  ],
  firstChangedLineId: {
    // Only the final COPY (source) is affected by a source-only change — deps layer stays untouched.
    source: "copy-src",
    // A dependency change legitimately affects the package.json COPY layer — correctly still expensive.
    deps: "copy-pkg",
  },
};

export interface LayerResult {
  id: string;
  instruction: string;
  cached: boolean;
  costSeconds: number;
}

export interface BuildSimulationResult {
  layers: LayerResult[];
  totalSeconds: number;
}

/**
 * The real Docker cache rule: every layer up to (and NOT including) the
 * first invalidated one is reused from cache; that layer and every layer
 * after it rebuild — regardless of whether THEIR OWN content changed.
 */
export function simulateBuild(order: DockerfileOrder, scenario: ChangeScenario): BuildSimulationResult {
  const changedId = order.firstChangedLineId[scenario];
  const changedIndex = order.lines.findIndex((l) => l.id === changedId);

  const layers: LayerResult[] = order.lines.map((line, i) => {
    const cached = changedIndex === -1 || i < changedIndex;
    return { id: line.id, instruction: line.instruction, cached, costSeconds: cached ? 0 : line.costSeconds };
  });

  const totalSeconds = layers.reduce((sum, l) => sum + l.costSeconds, 0);
  return { layers, totalSeconds };
}
