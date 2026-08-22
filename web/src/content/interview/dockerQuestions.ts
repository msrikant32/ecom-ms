import type { InterviewQuestion } from "./types";

// Docker/containers, basic through architecture level. Grounded in this
// repo's own real docker-compose.yml (mongo + redis services) wherever
// possible, rather than generic examples.
export const dockerQuestions: InterviewQuestion[] = [
  {
    slug: "docker-container-vs-vm",
    question: "What is a container, actually — and how is it different from a virtual machine?",
    category: "Docker",
    round: "general",
    summary:
      "A container shares the host OS kernel and is isolated via namespaces and cgroups — a VM virtualizes hardware and runs a full separate OS. That's why containers start in milliseconds and VMs take much longer, and why a container is fundamentally lighter weight.",
    intro: "The kernel-sharing detail is the actual mechanism behind every other difference in this answer — the strongest answers lead with it rather than just contrasting 'lightweight' vs 'heavyweight' as an unexplained fact.",
    sections: [
      {
        heading: "The actual mechanism",
        points: [
          {
            title: "Namespaces and cgroups, not a hypervisor",
            detail:
              "A container is a process (or group of processes) on the HOST machine, isolated from other processes using Linux namespaces (separate view of the filesystem, network, process IDs) and resource-limited using cgroups (CPU/memory limits) — but it shares the host's kernel. A VM instead virtualizes hardware via a hypervisor and boots an entire separate operating system, kernel included.",
          },
          {
            title: "The consequence: startup time and density",
            detail:
              "A container starts in milliseconds (it's just starting a process) — a VM takes much longer since it's booting a whole OS. This is also why you can run far more containers than VMs on the same hardware: containers share one kernel's overhead, VMs each carry their own.",
          },
        ],
      },
      {
        heading: "The tradeoff this implies",
        points: [
          {
            title: "Weaker isolation boundary than a VM",
            detail:
              "Because containers share the host kernel, the isolation boundary is genuinely weaker than a VM's (a kernel-level vulnerability can potentially be exploited across container boundaries in a way that's much harder across VM boundaries). This is why genuinely untrusted, multi-tenant workloads sometimes still reach for VM-level isolation, or a hybrid (gVisor, Firecracker microVMs) rather than assuming containers alone are an equivalent security boundary.",
          },
        ],
      },
    ],
    closingTip: "Lead with the mechanism, not just the adjectives: 'a container shares the host kernel and is isolated via namespaces/cgroups; a VM virtualizes hardware and runs its own kernel — that's why containers are lighter and faster, and also why their isolation boundary is weaker.'",
  },
  {
    slug: "docker-image-layers-and-build-cache",
    question: "How do Docker image layers and the build cache actually work, and why does instruction order matter?",
    category: "Docker",
    round: "general",
    summary:
      "Each Dockerfile instruction creates a cached layer — Docker reuses cached layers for any instruction that hasn't changed, up until the first instruction that HAS changed, after which every subsequent layer rebuilds. Ordering instructions from least-to-most likely to change is what makes builds fast.",
    intro: "The strongest answers state the actual caching rule precisely — 'reuse up to the first change, everything after rebuilds' — since that's exactly what determines correct instruction ordering.",
    sections: [
      {
        heading: "Layers and the cache invalidation rule",
        points: [
          {
            title: "One layer per instruction, cached and reused until something changes",
            detail:
              "Each RUN/COPY/ADD instruction produces a filesystem layer, cached by content. On a rebuild, Docker compares each instruction against its cached layer — as long as nothing has changed (the instruction itself, or the files it copies), the cached layer is reused instantly. The moment one instruction's inputs change, that layer AND every layer after it rebuild from scratch, even if they wouldn't have changed on their own — cache reuse only extends up to the first invalidated layer.",
          },
        ],
      },
      {
        heading: "Why instruction order is a real performance decision",
        points: [
          {
            title: "Put what changes least often first",
            detail:
              "Installing dependencies rarely changes; application source code changes on nearly every commit. Copying package.json and running the install BEFORE copying the rest of the source code means dependency installation stays cached across most rebuilds — only the (usually fast) final COPY of source code invalidates on a typical code change, instead of reinstalling every dependency on every single build.",
            code: `# Good — dependency install cached separately from source changes
COPY package.json package-lock.json ./
RUN npm ci
COPY . .          # only this layer invalidates on a normal code change

# Bad — any source change invalidates the dependency install too
COPY . .
RUN npm ci        # reinstalls from scratch on every single code change`,
            codeLanguage: "dockerfile",
          },
        ],
      },
    ],
    closingTip: "State the caching rule precisely, then apply it: 'layers cache up to the first change, everything after rebuilds — so order instructions from least-likely-to-change to most-likely-to-change, which is exactly why dependency installation goes before copying source code.'",
  },
  {
    slug: "docker-multi-stage-builds",
    question: "What are multi-stage builds for, and why do they matter for production images?",
    category: "Docker",
    round: "general",
    summary:
      "A multi-stage build uses one stage with all the build tooling (compilers, dev dependencies) to produce build output, then copies ONLY that output into a clean, minimal final stage — the build tooling never ships in the production image at all.",
    intro: "The strongest answers name the specific thing this fixes — a production image bloated with build-only tooling it never needs at runtime.",
    sections: [
      {
        heading: "The problem without multi-stage builds",
        points: [
          {
            title: "The final image ends up carrying everything used to BUILD it, not just what's needed to RUN it",
            detail:
              "A naive single-stage Dockerfile that installs dev dependencies, compiles TypeScript, builds frontend assets, etc. in the same image that runs in production means shipping compilers, dev dependencies, and build tooling that serve zero purpose at runtime — larger image, slower pulls/deploys, and a larger attack surface (more installed software = more potential vulnerabilities).",
          },
        ],
      },
      {
        heading: "The fix — separate build and runtime stages",
        points: [
          {
            title: "COPY --from another stage, keep only the output",
            detail:
              "One stage (with the full toolchain) builds the artifact. A second, separate stage starts from a minimal base image and copies ONLY the built output from the first stage — everything else from the build stage (source code, dev dependencies, compilers) is discarded, never part of the final image at all.",
            code: `# Stage 1 — has the full toolchain, discarded after this stage
FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2 — minimal runtime image, only the build OUTPUT is copied in
FROM node:22-slim
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/server.js"]`,
            codeLanguage: "dockerfile",
          },
        ],
      },
      {
        heading: "The reason isn't always a compiler — this repo's own Dockerfile is a different real case",
        points: [
          {
            title: "Separating native-module BUILD TOOLING from the runtime image, not a TypeScript build step",
            detail:
              "express-production-api has no compile step at all — but bcrypt is a native module that can need python3/make/g++ to compile from source if no prebuilt binary matches the target platform. The deps stage installs that toolchain and runs npm ci there; the runtime stage is a clean node:22-slim with no build tools at all, just the already-compiled node_modules copied over. Same multi-stage mechanism, different reason: keeping a ~200MB C++ toolchain out of production, not keeping a compiler out.",
            sourceRef: "express-production-api/Dockerfile — the real, running file",
          },
        ],
      },
    ],
    closingTip: "The one-sentence version: 'multi-stage builds let the build environment be as heavy as it needs to be, while the final image only ever contains what's actually needed to run — smaller, faster to deploy, and a smaller attack surface.' That's just as true for keeping a native-module build toolchain out as it is for keeping a compiler out.",
  },
  {
    slug: "docker-compose-fundamentals",
    question: "What does docker-compose actually do, and how does service-to-service networking work inside it?",
    category: "Docker",
    round: "general",
    summary:
      "docker-compose defines and runs multiple related containers together as one unit, on a shared network where each service can reach the others BY SERVICE NAME — this repo's own compose file (mongo + redis) is a real, running example.",
    intro: "This app has a real, running docker-compose.yml — walking through it concretely is stronger than describing compose in the abstract.",
    sections: [
      {
        heading: "What compose actually manages",
        points: [
          {
            title: "Multiple containers, defined declaratively, run and networked together",
            detail:
              "A docker-compose.yml declares a set of services (each backed by an image), their ports, volumes, and configuration — 'docker compose up' starts all of them together, on a shared Docker network created automatically for that compose project.",
            code: `services:
  mongo:
    image: mongo:7
    ports: ["27017:27017"]
    volumes: ["mongo-data:/data/db"]
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: ["redis-data:/data"]

volumes:
  mongo-data:
  redis-data:`,
            codeLanguage: "yaml",
            sourceRef: "express-production-api/docker-compose.yml — the real, running file",
          },
        ],
      },
      {
        heading: "Service-name networking — the actual mechanism worth knowing",
        points: [
          {
            title: "Containers reach each other by SERVICE NAME, not localhost or a hardcoded IP",
            detail:
              "Every service in a compose file joins a shared network where Docker's built-in DNS resolves each service's NAME to its container's IP automatically. This repo's own app service connects to Mongo via mongodb://mongo:27017, not mongodb://localhost:27017 — 'mongo' resolves via that internal DNS. This only matters when the app itself also runs inside the compose network (as it now does here); connecting from the host machine instead still uses localhost/a mapped port.",
            code: `  app:
    build: .
    environment:
      - MONGODB_URI=mongodb://mongo:27017/express-production-api
      - REDIS_URL=redis://redis:6379
    depends_on:
      mongo: { condition: service_healthy }
      redis: { condition: service_healthy }`,
            codeLanguage: "yaml",
            sourceRef: "express-production-api/docker-compose.yml — the app service, now real",
          },
        ],
      },
      {
        heading: "Healthchecks — why they matter more in compose than they look",
        points: [
          {
            title: "A container can be 'running' before the thing inside it is actually ready",
            detail:
              "Mongo's container process can be running while MongoDB itself is still initializing and not yet accepting connections. The healthcheck (running mongosh ping repeatedly) is what lets depends_on: condition: service_healthy know the difference between 'container started' and 'service actually ready' — this repo's app service won't even start until both Mongo's and Redis's healthchecks pass, specifically to avoid the kind of startup race this app dealt with earlier when Redis wasn't actually available yet.",
          },
        ],
      },
    ],
    closingTip: "Ground the answer in the real file: 'this repo's own docker-compose.yml runs the app, Mongo, and Redis together — the app waits on both datastores' healthchecks via depends_on: condition: service_healthy, and reaches them at mongo:27017/redis:6379 via Docker's internal DNS, not localhost.'",
  },
  {
    slug: "docker-volumes-vs-bind-mounts",
    question: "Volumes vs bind mounts — why are containers ephemeral by default, and how do you persist data?",
    category: "Docker",
    round: "general",
    summary:
      "A container's own filesystem is thrown away when it's removed — a named volume (Docker-managed) or a bind mount (a host directory mapped in) are the two ways to persist data beyond a container's lifecycle, with different tradeoffs for portability and host-machine dependency.",
    intro: "The strongest answers state WHY containers are ephemeral by design first, since that's what explains why volumes exist at all.",
    sections: [
      {
        heading: "Why containers are ephemeral by default",
        points: [
          {
            title: "A container's writable layer is deleted with the container",
            detail:
              "A running container has a thin writable layer on top of its (read-only) image layers. Anything written there — a database's data files, a log — is deleted when the container is removed. This is deliberate: it's what makes containers disposable and easily replaceable/scalable (any container instance is interchangeable, none of them are precious). A database's actual data needs to survive that disposability, which is exactly what a volume is for.",
          },
        ],
      },
      {
        heading: "Named volumes vs bind mounts",
        points: [
          {
            title: "A named volume — Docker-managed, portable across environments",
            detail:
              "A named volume (mongo-data: in this repo's own compose file) is managed entirely by Docker, stored in a location Docker controls — portable across machines/environments without depending on a specific host filesystem path. The right default for real persistent data like a database's files.",
          },
          {
            title: "A bind mount — a specific host directory, mapped directly in",
            detail:
              "A bind mount maps a specific path on the HOST machine directly into the container — useful for local development (mapping your source code directory in, so edits on the host are immediately visible inside the running container without a rebuild), but ties the setup to that specific host path, making it a poor choice for production persistence.",
          },
        ],
      },
    ],
    closingTip: "The decision rule: 'named volumes for real persistent data you want portable across environments (a database's files); bind mounts for local development convenience (live-mounting source code) — not the other way around.'",
  },
  {
    slug: "docker-image-size-optimization",
    question: "How do you actually reduce a Docker image's size, and why does it matter?",
    category: "Docker",
    round: "general",
    summary:
      "A minimal base image, multi-stage builds, a .dockerignore file, and combining RUN instructions to avoid leaving intermediate layer bloat — smaller images pull faster (matters directly for deploy speed and Auto Scaling responsiveness) and carry a smaller attack surface.",
    intro: "The strongest answers connect image size to a concrete operational consequence (deploy/scale speed, attack surface) rather than treating it as an abstract 'best practice'.",
    sections: [
      {
        heading: "Why it actually matters operationally",
        points: [
          {
            title: "Pull time affects deploy speed and Auto Scaling responsiveness",
            detail:
              "A new container instance has to pull the image before it can start — a smaller image pulls faster, which directly matters for how quickly a deploy rolls out or how fast Auto Scaling can respond to a traffic spike by launching new capacity. This is the same responsiveness concern covered generally in the Auto Scaling content elsewhere in this app, just tied specifically to image size here.",
            relatedLink: { href: "/interview/aws-autoscaling-policies", label: "Auto Scaling responsiveness, in general" },
          },
        ],
      },
      {
        heading: "The concrete techniques",
        points: [
          {
            title: "A minimal base image, multi-stage builds, and a .dockerignore",
            detail:
              "Start from a minimal base (an -alpine or -slim variant) instead of a full OS image when the app's dependencies allow it. Use multi-stage builds so build tooling never reaches the final image at all. Add a .dockerignore (the same idea as .gitignore) so node_modules, .git, and local build artifacts on the host never get copied into the image in the first place via a broad COPY . . instruction.",
          },
          {
            title: "Combine RUN instructions to avoid leaving intermediate bloat in a layer",
            detail:
              "RUN apt-get update && apt-get install -y X && rm -rf /var/lib/apt/lists/* in ONE instruction cleans up apt's cache within the same layer it was created in. Splitting this across multiple RUN instructions means the cleanup happens in a LATER layer — the earlier layer still contains the uncleaned cache, so the image doesn't actually shrink even though the files were 'deleted' afterward.",
          },
        ],
      },
    ],
    closingTip: "Name the specific attack-surface angle too, not just size: 'a minimal base image also means fewer installed packages that could have a vulnerability — smaller is both faster to deploy and a smaller thing to have to patch.'",
  },
  {
    slug: "docker-secrets-management",
    question: "How should secrets get into a running container — and what's wrong with baking them into the image?",
    category: "Docker",
    round: "general",
    summary:
      "Baking a secret into an image (via ENV, a COPY'd file, or a build ARG) means it's permanently embedded in a layer, extractable by anyone with the image — secrets belong injected at RUNTIME instead, the same discipline as the general secrets-management content applied specifically to containers.",
    intro: "This connects directly to the general key-management discipline already covered — the strongest answer names the container-specific version of the same mistake: secrets baked into a layer are effectively as exposed as if they were committed to source control.",
    sections: [
      {
        heading: "Why baking a secret into the image is a real, common mistake",
        points: [
          {
            title: "A layer is (effectively) permanent and extractable, even if a LATER layer 'removes' the secret",
            detail:
              "ENV DATABASE_PASSWORD=hunter2 in a Dockerfile, or COPYing a file containing a secret, embeds it into that layer — and layers are cached/stored individually. Even if a later instruction deletes the file, the EARLIER layer containing it still exists in the image and can be extracted by anyone with access to the image (docker history, or just inspecting the layers directly). A build ARG containing a secret has the same problem if it ends up baked into a layer rather than only used transiently.",
          },
        ],
      },
      {
        heading: "The fix — inject at runtime, never at build time",
        points: [
          {
            title: "Environment variables set at container start, or a mounted secrets file/orchestrator secret",
            detail:
              "Pass secrets via environment variables set when the container STARTS (docker run -e, or an orchestrator's secret-injection mechanism), or mount a secrets file at runtime that's never part of any image layer — the image itself, if leaked or pushed somewhere it shouldn't be, contains no secrets at all, only the application code and its dependencies.",
            relatedLink: { href: "/interview/key-management-at-scale", label: "The general secrets-management discipline this applies specifically to containers" },
          },
        ],
      },
    ],
    closingTip: "State the equivalence directly: 'a secret baked into an image layer is functionally as exposed as one committed to source control — it belongs injected at container start time, never present in any layer of the image itself.'",
  },
  {
    slug: "docker-orchestration-why-kubernetes",
    question: "When does a team actually need Kubernetes (or similar orchestration) instead of just docker-compose?",
    category: "Docker",
    round: "general",
    summary:
      "docker-compose runs a fixed set of containers on ONE machine — it has no concept of scheduling across multiple machines, no self-healing (restarting a failed container elsewhere), and no rolling-update/scaling automation. Orchestration becomes necessary once you need multiple machines and self-healing, not before.",
    intro: "Lead-level framing — the strongest answer avoids 'Kubernetes is just what production uses' and instead names the SPECIFIC capabilities compose lacks that actually necessitate it.",
    sections: [
      {
        heading: "What docker-compose genuinely doesn't do",
        points: [
          {
            title: "Single-machine only, no self-healing, no automated scaling",
            detail:
              "docker-compose orchestrates containers on ONE host — it has no concept of a cluster of machines to schedule across. If the host machine dies, everything on it is down; compose doesn't reschedule a failed container onto a different, healthy machine, because there isn't another machine in its model at all. Scaling a service means manually running more instances yourself; there's no automatic scaling based on load.",
          },
        ],
      },
      {
        heading: "What Kubernetes (or similar) actually adds",
        points: [
          {
            title: "A cluster of machines, self-healing scheduling, rolling updates, and declarative scaling",
            detail:
              "Kubernetes schedules containers (in Pods) across a CLUSTER of machines, automatically reschedules a Pod elsewhere if its node fails (self-healing), supports rolling updates and automated horizontal scaling based on load, and provides built-in service discovery/load balancing across many replicas — the operational concerns that actually require a cluster-aware system, not just a multi-container-on-one-host tool.",
          },
        ],
      },
      {
        heading: "The honest threshold",
        points: [
          {
            title: "Multiple machines and a real need for self-healing/automated scaling — not team size or company prestige",
            detail:
              "A single-machine deployment (or a small, low-traffic service where manual intervention on rare failure is genuinely acceptable) doesn't need Kubernetes's complexity — docker-compose (or a single managed container service) is the right-sized tool. The real threshold is needing multiple machines with automated failure recovery and scaling, not 'we're a real company now so we need Kubernetes'.",
          },
        ],
      },
    ],
    closingTip: "Close with the honest threshold explicitly: 'the jump to Kubernetes is justified by needing a multi-machine cluster with self-healing and automated scaling — not by team size or by assuming production always requires it. A lot of real production systems run happily on much simpler container deployment.'",
  },
];
