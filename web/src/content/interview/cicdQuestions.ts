import type { InterviewQuestion } from "./types";

// Deeper CI/CD content, complementing (not duplicating) the existing
// git-workflow-cicd overview question in round3.ts, which already covers
// branching strategy and the CI/CD/continuous-deployment definitions.
// These go further: pipeline stages, deployment strategies, rollback,
// feature flags, and pipeline security/supply-chain concerns.
export const cicdQuestions: InterviewQuestion[] = [
  {
    slug: "cicd-pipeline-stages",
    question: "Walk through what actually happens at each stage of a real CI/CD pipeline.",
    category: "Process",
    round: "general",
    summary:
      "Build → test → security/dependency scan → package into an immutable artifact → deploy to a staging-like environment → promote the SAME artifact to production — the strongest answers name the ORDER and explain why each stage gates the next.",
    intro: "A common weak answer just lists stage names — the strongest answers explain why the order matters (fail fast on cheap checks before expensive ones) and what each stage is actually protecting against.",
    sections: [
      {
        heading: "The typical stage order, and why it's ordered that way",
        points: [
          {
            title: "Cheapest, fastest checks first — fail fast",
            detail:
              "Lint and unit tests run first (seconds, catch the most common mistakes cheaply). Build/compile next. Integration tests (slower, need real dependencies) after that. Security/dependency scanning (SAST, dependency vulnerability checks) before packaging. This ordering means a trivial mistake fails in 10 seconds, not after a 10-minute integration test suite has already run.",
          },
          {
            title: "Package into ONE immutable artifact, then promote it unchanged",
            detail:
              "The pipeline should build the deployable artifact (a container image, a compiled bundle) exactly once, then promote that SAME artifact through staging and production — never rebuild per environment. Rebuilding per environment reintroduces the exact risk CI is meant to eliminate: what passed staging might not be bit-for-bit what reaches production.",
          },
        ],
      },
      {
        heading: "Each gate is protecting against a specific failure mode",
        points: [
          {
            title: "Tests protect correctness, scanning protects supply chain, staging protects integration risk",
            detail:
              "Being able to name what EACH stage specifically protects against — not just that it exists — is what shows real pipeline design experience versus having copy-pasted a YAML template.",
          },
        ],
      },
    ],
    closingTip: "The one-sentence version: 'fail fast on the cheapest checks first, build the deployable artifact exactly once, and promote that unchanged artifact through every environment rather than rebuilding it.'",
  },
  {
    slug: "deployment-strategies-blue-green-canary",
    question: "Blue-green, canary, and rolling deployments — what's the actual difference, and how do you choose?",
    category: "Process",
    round: "general",
    summary:
      "Blue-green swaps 100% of traffic at once between two full environments (instant rollback, doubles infra cost); canary shifts a small percentage of traffic first and watches it (slower, catches problems before they're global); rolling replaces instances gradually with no second full environment needed.",
    intro: "The strongest answers name the actual tradeoff each strategy makes — instant-cutover-vs-cost, or blast-radius-vs-speed — rather than just defining the three terms.",
    sections: [
      {
        heading: "Blue-green — two full environments, instant cutover",
        points: [
          {
            title: "All-or-nothing traffic switch between two identical environments",
            detail:
              "Two full production environments exist simultaneously ('blue' live, 'green' idle with the new version). Traffic switches from blue to green all at once (a load balancer/router config change) — rollback is just switching back, close to instant. Costs roughly double the infrastructure while both environments exist, even briefly.",
          },
        ],
      },
      {
        heading: "Canary — gradual traffic shift, watched closely",
        points: [
          {
            title: "A small percentage first, expand only if healthy",
            detail:
              "The new version receives a small slice of real traffic (5%, say) while the old version keeps serving the rest — metrics are watched closely, and traffic only ramps up if the canary looks healthy. This catches a bad deploy while it's still affecting a small fraction of users, at the cost of a slower rollout and needing real automated health-signal monitoring to make the ramp-up decision safely.",
          },
        ],
      },
      {
        heading: "Rolling — gradual instance replacement, no second environment",
        points: [
          {
            title: "Replace instances a few at a time within the same fleet",
            detail:
              "Old and new versions run side by side briefly as instances are replaced in batches — no second full environment needed (cheaper than blue-green), but rollback means rolling the old version back out the same gradual way, slower than blue-green's instant switch. The default for many container-orchestration platforms (Kubernetes) without extra tooling.",
          },
        ],
      },
    ],
    closingTip: "The decision framework: blue-green for fastest possible rollback when infra cost isn't the constraint; canary when catching a bad deploy on a small blast radius matters more than rollout speed; rolling as the practical middle ground most orchestrators default to.",
  },
  {
    slug: "rollback-strategies-forward-fix",
    question: "When something breaks in production right after a deploy, how do you decide between rolling back and forward-fixing?",
    category: "Process",
    round: "general",
    summary:
      "Roll back when the fix isn't immediately obvious or the impact is severe — forward-fix only when the fix is small, well-understood, and faster to ship than a rollback would be. Defaulting to forward-fix under pressure is a common, real mistake.",
    intro: "This is a judgment question under pressure — the strongest answers name a clear decision rule rather than 'it depends' with no further structure.",
    sections: [
      {
        heading: "The default should be rollback, not forward-fix",
        points: [
          {
            title: "Rollback is fast, well-tested (it's just running the previous known-good version again), and low-risk",
            detail:
              "A rollback returns to a state that was ALREADY verified working — there's no new risk introduced. A forward-fix under incident pressure is a brand-new, unreviewed-under-normal-conditions change going straight to production, which carries real risk of making things worse. The default should be: roll back first to stop the bleeding, THEN calmly figure out and ship the real fix afterward.",
          },
        ],
      },
      {
        heading: "When forward-fixing is actually the right call",
        points: [
          {
            title: "Only when the fix is small, obvious, and rollback isn't clean",
            detail:
              "If the bad deploy included a database migration that a rollback can't cleanly undo, or if the actual fix is a one-line, high-confidence change and rolling back would itself be disruptive (e.g. losing data written under the new version), forward-fixing can be the better call — but that should be a deliberate exception with a clear reason, not the reflexive first move under pressure.",
          },
        ],
      },
    ],
    closingTip: "State the default explicitly: 'roll back first to stop user impact, THEN diagnose and ship the real fix without the pressure of an ongoing incident — forward-fixing live is the exception, justified by something specific like an unrollbackable migration, not the default response.'",
  },
  {
    slug: "feature-flags-decouple-deploy-release",
    question: "How do feature flags change the relationship between 'deploy' and 'release'?",
    category: "Process",
    round: "general",
    summary:
      "Deploying code and releasing a feature to users become two separate, independently-controllable events — code can sit deployed-but-dark behind a flag, which is what makes trunk-based development with frequent small merges to main actually safe.",
    intro: "This question is really asking whether you understand WHY feature flags matter architecturally, not just that they exist as an on/off switch.",
    sections: [
      {
        heading: "Deploy ≠ release, once flags exist",
        points: [
          {
            title: "Code can be live in production and still invisible to users",
            detail:
              "Without flags, merging to main and deploying effectively means releasing — anyone hitting that code path sees the new behavior immediately. With a flag wrapping the new code path, it can be deployed to production (fully live, fully tested against real infrastructure) while remaining OFF for all real users, then released separately — instantly, without a new deploy — by flipping the flag, and instantly rolled back by flipping it off, no rollback deploy needed at all.",
            code: `if (await featureFlags.isEnabled('new-checkout-flow', { userId })) {
  return renderNewCheckout();
}
return renderLegacyCheckout(); // the safe, unflagged path stays available`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "This is what makes trunk-based development safe at high merge frequency",
        points: [
          {
            title: "Incomplete work hides behind a flag instead of living on a long-lived branch",
            detail:
              "Trunk-based development (frequent small merges straight to main) only works safely because incomplete or risky work can be merged and deployed WHILE FLAGGED OFF, rather than kept on a long-lived feature branch accumulating merge conflicts. This is the direct mechanism connecting 'we deploy multiple times a day' to 'and it's still safe' — flags are what makes that combination possible.",
          },
          {
            title: "Also enables gradual rollout and instant kill-switches, not just on/off",
            detail:
              "A flag can also gate a percentage rollout (5% of users, ramping up — effectively a canary at the feature level rather than the deployment level) and act as an instant kill-switch for a misbehaving feature without needing a deploy or rollback at all — often faster than any deployment-level rollback strategy.",
          },
        ],
      },
    ],
    closingTip: "The sentence that shows real understanding: 'feature flags decouple deploying code from releasing a feature — that decoupling is what makes frequent, small, trunk-based merges safe, since risky code can go live dark and be released independently, with an instant kill-switch if it misbehaves.'",
  },
  {
    slug: "cicd-pipeline-security-supply-chain",
    question: "What security concerns are specific to a CI/CD pipeline itself, beyond the code it's testing?",
    category: "Process",
    round: "general",
    summary:
      "A pipeline with broad, long-lived credentials and unpinned dependencies is itself a high-value attack target — least-privilege, short-lived pipeline credentials and dependency/supply-chain scanning are the two concerns most often missed.",
    intro: "This connects directly to the general secrets/key-management discipline already covered — the strongest answer applies it specifically to what makes a CI/CD pipeline a uniquely attractive target.",
    sections: [
      {
        heading: "The pipeline itself holds real, high-value credentials",
        points: [
          {
            title: "Deploy credentials, cloud access, signing keys — often broader than any single engineer's own access",
            detail:
              "A CI/CD pipeline commonly holds credentials to deploy to production, push container images, and sometimes broad cloud IAM access — often MORE powerful than what any individual engineer has directly. A compromised pipeline (a malicious dependency, a compromised third-party CI action/plugin) can be a much bigger blast radius than a compromised individual account. The same least-privilege and short-lived-credential discipline covered generally applies directly here.",
            relatedLink: { href: "/interview/key-management-at-scale", label: "The general least-privilege/rotation discipline this applies to pipeline credentials specifically" },
          },
        ],
      },
      {
        heading: "Supply chain — what's actually being pulled into the build",
        points: [
          {
            title: "Dependency scanning and pinned versions, not just 'we trust npm'",
            detail:
              "Automated dependency vulnerability scanning (as part of the pipeline, not a manual occasional check) catches known-vulnerable packages before they ship. Pinning exact dependency versions (not floating ranges) means a build is reproducible and a compromised upstream package release doesn't silently flow into your next deploy. Third-party CI actions/plugins deserve the same scrutiny — pin them to a specific commit hash, not a mutable tag, since a compromised popular CI action is a real, documented attack vector.",
          },
        ],
      },
    ],
    closingTip: "Name the pipeline itself as an attack surface explicitly: 'the pipeline often holds more powerful credentials than any individual engineer — treat its access with the same least-privilege discipline as production secrets, and treat every dependency and third-party CI action it pulls in as part of the supply chain.'",
  },
  {
    slug: "immutable-artifacts-build-once-promote",
    question: "Why should you 'build once, promote the same artifact' instead of rebuilding for each environment?",
    category: "Process",
    round: "general",
    summary:
      "Rebuilding per environment reopens the exact risk CI is meant to close — a dependency could resolve differently, a flag could differ, and what passed staging is no longer provably what reaches production. One immutable, versioned artifact promoted unchanged closes that gap.",
    intro: "A subtle but real pipeline design question — the strongest answer explains the SPECIFIC risk rebuilding reintroduces, not just 'it's best practice'.",
    sections: [
      {
        heading: "What actually goes wrong when you rebuild per environment",
        points: [
          {
            title: "Non-determinism between builds, even from 'the same' source",
            detail:
              "A rebuild at a different time can resolve a floating dependency version differently, pick up a different base image update, or be built with slightly different environment variables/build flags — meaning the artifact that passed all your staging tests isn't provably the SAME bytes reaching production. This defeats a large part of what testing in staging was supposed to guarantee.",
          },
        ],
      },
      {
        heading: "The fix — build once, tag it, promote it unchanged",
        points: [
          {
            title: "A versioned, immutable artifact (e.g. a container image with a content-addressed or immutable tag)",
            detail:
              "Build exactly once, tag the resulting artifact with an immutable identifier, run it through staging, and deploy that EXACT same tagged artifact to production — no rebuild step in between. This makes 'what's running in production' a provable, traceable fact (which specific commit/build produced it) rather than an assumption.",
          },
        ],
      },
    ],
    closingTip: "State the core guarantee this buys you: 'what passed every test in staging is, byte-for-byte, what's running in production — not something rebuilt from the same source that might have resolved slightly differently.'",
  },
];
