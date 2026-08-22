import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { ContainerVsVmAnimation } from "@/components/docker/ContainerVsVmAnimation";
import { DockerfileLayerSimulator } from "@/components/docker/DockerfileLayerSimulator";

export const metadata: Metadata = {
  title: "Docker",
};

const CONCEPTS = [
  {
    level: "Beginner",
    color: "text-emerald-600 dark:text-emerald-400",
    points: [
      {
        title: "A container is a process, isolated — not a tiny virtual machine",
        detail:
          "A container shares the host machine's kernel and is isolated using Linux namespaces (its own view of the filesystem, network, process list) and cgroups (resource limits) — it's fundamentally a regular process with walls around it, not a separate operating system. That's the whole reason it starts in milliseconds instead of the seconds-to-minutes a VM takes to boot its own kernel.",
      },
      {
        title: "An image is a read-only template; a container is a running instance of it",
        detail:
          "The same relationship as a class and an object — one image (node:22-slim, or one you build yourself) can be used to start any number of independent running containers, each with its own writable layer on top of the same shared, read-only image layers underneath.",
      },
      {
        title: "docker run pulls an image, starts a container from it",
        detail:
          "docker run node:22 node -e \"console.log('hi')\" pulls the node:22 image if it isn't already local, starts a container from it, runs the given command, and by default removes the container's writable layer when it exits — nothing persists unless you explicitly ask for it to (see volumes, below).",
      },
    ],
  },
  {
    level: "Intermediate",
    color: "text-amber-600 dark:text-amber-400",
    points: [
      {
        title: "A Dockerfile builds an image, one layer per instruction",
        detail:
          "Each FROM/RUN/COPY instruction produces a cached, reusable layer. Docker reuses a layer from cache if nothing about that instruction (or the files it touches) has changed since the last build — the moment one layer's inputs change, that layer AND every layer after it rebuild, regardless of whether those later layers individually changed. This is exactly what the simulator below makes tangible.",
      },
      {
        title: "Volumes are how data survives a container's death",
        detail:
          "A container's own writable layer disappears when the container is removed — deliberately, since that's what makes containers disposable and interchangeable. A named volume persists data outside that lifecycle (a database's actual files, for instance), managed by Docker and reusable across container restarts/replacements.",
      },
      {
        title: "docker-compose runs several containers together, networked by service name",
        detail:
          "A compose file declares multiple services; Docker's internal DNS lets each one reach the others by service name (mongo, redis) rather than a hardcoded IP — this app's own express-production-api repo has a real, running docker-compose.yml doing exactly this for Mongo and Redis.",
      },
    ],
  },
  {
    level: "Advanced / architecture",
    color: "text-rose-600 dark:text-rose-400",
    points: [
      {
        title: "Multi-stage builds keep build tooling out of the production image",
        detail:
          "One stage has the full compiler/toolchain and produces build output; a second, minimal stage copies ONLY that output — the final image never carries the dev dependencies or compilers used to build it, which matters for both image size and attack surface.",
      },
      {
        title: "Secrets never belong baked into an image layer",
        detail:
          "Anything written into a layer — even one later 'deleted' by a subsequent instruction — is still recoverable from that earlier layer. Secrets belong injected at container start time (an env var, a mounted secret), never present in any layer of the image itself.",
      },
      {
        title: "Orchestration (Kubernetes and similar) earns its complexity at a specific threshold",
        detail:
          "docker-compose runs containers on one machine with no self-healing and no automated scaling. The jump to real orchestration is justified by needing a multi-machine cluster with automated failure recovery and scaling — not by team size or by assuming production always requires it.",
      },
    ],
  },
];

export default function DockerPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Docker" }]} />

      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
          Practical Implementation · Simulated
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Docker, from zero — visualized and simulated
        </h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          A browser can&apos;t run a real Docker daemon, so instead of faking a terminal, the two
          pieces below <em>simulate</em> Docker&apos;s actual, deterministic rules — the container
          vs VM startup-time gap, and the exact layer-cache invalidation logic a real build uses —
          computed for real, not staged, so what you see is mechanically accurate.
        </p>
      </header>

      {CONCEPTS.map((section) => (
        <section key={section.level} className="flex flex-col gap-3">
          <h2 className={`text-sm font-semibold uppercase tracking-wide ${section.color}`}>{section.level}</h2>
          <div className="flex flex-col gap-3">
            {section.points.map((p) => (
              <div key={p.title} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{p.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{p.detail}</p>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
            Watch it
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Container vs Virtual Machine — the actual time gap
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Same instance count, launched at the same moment. Containers are starting a process;
            VMs are booting an entire separate kernel — the animation timing below is scaled for
            demo purposes, but the <em>relative</em> gap (containers finish while VMs are still
            mid-boot) is the real, honest ratio.
          </p>
        </div>
        <ContainerVsVmAnimation />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium uppercase tracking-wide text-purple-600 dark:text-purple-400">
            Try it — hands-on
          </p>
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Dockerfile layer-cache simulator
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            The single most common real-world Docker mistake: copying source code before
            installing dependencies. Pick what changed, and watch the SAME two Dockerfiles rebuild
            completely differently — real cache math, not a scripted animation.
          </p>
        </div>
        <DockerfileLayerSimulator />
      </section>

      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        <Link href="/interview/topics/docker" className="text-purple-600 hover:underline dark:text-purple-400">
          Docker interview questions →
        </Link>{" "}
        — the layer-caching mechanics above, plus multi-stage builds, volumes, secrets, and when
        you actually need Kubernetes.
      </p>
    </div>
  );
}
