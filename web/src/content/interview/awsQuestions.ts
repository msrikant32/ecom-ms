import type { InterviewQuestion } from "./types";

// AWS core services, basic through lead/architect level. The 11 services
// explicitly requested (VPC, Security Groups, EC2, ELB, Route 53, API
// Gateway, Lambda, DynamoDB, KMS, CloudFront, WAF) plus the additional
// foundational/lead-level services a working AWS architect is expected to
// know (IAM, S3, RDS-vs-DynamoDB, CloudWatch, SQS/SNS, Auto Scaling, and a
// Well-Architected Framework capstone). Amazon Connect is deliberately its
// own separate file/topic — see amazonConnectQuestions.ts.
export const awsQuestions: InterviewQuestion[] = [
  {
    slug: "aws-vpc-fundamentals",
    question: "Explain VPC fundamentals — subnets, route tables, internet gateways, and NAT gateways.",
    category: "AWS",
    round: "general",
    summary:
      "A VPC is your own isolated network inside AWS — subnets carve it into pieces, route tables decide where each piece's traffic goes, and an IGW vs a NAT gateway is the actual difference between a public and a private subnet.",
    intro: "The strongest answers explain WHY a subnet is public or private (it's the route table, not a checkbox) rather than treating it as a fixed label.",
    sections: [
      {
        heading: "The building blocks",
        points: [
          {
            title: "VPC → subnets → route tables",
            detail:
              "A VPC is a private IP address range (a CIDR block) you control entirely. It's divided into subnets, each pinned to one Availability Zone. Every subnet has an associated route table deciding where its outbound traffic goes — this is the actual mechanism, not something inherent to the subnet itself.",
          },
          {
            title: "What actually makes a subnet 'public' vs 'private'",
            detail:
              "A subnet is 'public' only because its route table has a route to an Internet Gateway (IGW) for 0.0.0.0/0. A subnet is 'private' because that route doesn't exist — nothing else distinguishes them. This is a common interview trip-up: there's no special 'private subnet' flag, it's entirely about what the route table points 0.0.0.0/0 traffic at.",
          },
        ],
      },
      {
        heading: "Reaching the internet from a private subnet",
        points: [
          {
            title: "NAT Gateway — outbound only, one-directional",
            detail:
              "A NAT Gateway sits in a PUBLIC subnet and lets resources in a private subnet initiate outbound connections (pulling a package, calling an external API) while remaining unreachable from the internet inbound — the asymmetry is the entire point. It's a managed, AZ-scoped resource (deploy one per AZ for high availability, since a NAT Gateway failure takes down outbound access for every private subnet routed through it).",
          },
        ],
      },
    ],
    closingTip: "State the route-table mechanism explicitly when asked to design a VPC: 'public subnet = route table has 0.0.0.0/0 → IGW; private subnet = it doesn't, and outbound-only access goes through a NAT Gateway in a public subnet instead.'",
  },
  {
    slug: "aws-security-groups-vs-nacls",
    question: "Security Groups vs Network ACLs — what's the actual difference?",
    category: "AWS",
    round: "general",
    summary:
      "Security Groups are stateful and attached to instances/ENIs; NACLs are stateless and attached to subnets — the statefulness distinction is the one that actually trips people up in practice.",
    intro: "This is a frequently-asked, frequently-gotten-wrong question — the stateful/stateless distinction and its practical consequence (do you need an explicit return-traffic rule?) is the part worth being precise about.",
    sections: [
      {
        heading: "Security Groups — stateful, instance-level",
        points: [
          {
            title: "Return traffic is automatically allowed",
            detail:
              "A Security Group is attached to an instance/ENI (or a Lambda, RDS instance, etc.) and only supports ALLOW rules — nothing is explicitly denied, traffic just isn't allowed if no rule matches. Because it's stateful, if inbound traffic is allowed, the corresponding OUTBOUND response is automatically allowed too — you don't write a separate outbound rule for a reply.",
          },
        ],
      },
      {
        heading: "Network ACLs — stateless, subnet-level",
        points: [
          {
            title: "You must explicitly allow both directions, and rules are evaluated in order",
            detail:
              "A NACL is attached to a subnet (affecting everything in it) and supports both ALLOW and DENY rules, evaluated in numbered order until a match. Because it's stateless, allowing inbound traffic does NOT automatically allow the response — you need an explicit outbound rule too, which is the detail that catches people who assume NACLs behave like Security Groups.",
          },
        ],
      },
      {
        heading: "Why use both together",
        points: [
          {
            title: "Security Groups for fine-grained per-resource control, NACLs as a coarse subnet-wide backstop",
            detail:
              "Security Groups do most of the real work day-to-day (per-instance, allow-only, easy to reason about). NACLs are commonly used as a coarse, explicit-deny backstop at the subnet level — e.g. explicitly blocking a known-bad IP range for an entire subnet regardless of what any individual instance's Security Group allows.",
          },
        ],
      },
    ],
    closingTip: "The one sentence that nails this: 'Security Groups are stateful and instance-level — allow-only, response traffic is automatic. NACLs are stateless and subnet-level — support explicit deny, and you have to allow both directions yourself.'",
  },
  {
    slug: "aws-ec2-fundamentals",
    question: "Walk through EC2 fundamentals — instance types, purchasing options, and AMIs.",
    category: "AWS",
    round: "general",
    summary:
      "Instance families match workload shape (compute/memory/storage-optimized), purchasing options trade commitment for discount (On-Demand vs Reserved vs Spot vs Savings Plans), and an AMI is the reusable, versioned snapshot everything boots from.",
    intro: "A broad, foundational question — the strongest answers connect purchasing-option choice to a REAL workload characteristic (steady-state vs interruptible vs unpredictable) rather than just listing the options.",
    sections: [
      {
        heading: "Instance families and purchasing options",
        points: [
          {
            title: "Match the family to the bottleneck",
            detail:
              "General purpose (M-family) for balanced workloads, compute-optimized (C-family) for CPU-bound work, memory-optimized (R-family) for in-memory caches/large datasets, storage-optimized (I/D-family) for high-IOPS databases. Choosing the wrong family means paying for capacity you don't need on the dimension that isn't actually your bottleneck.",
          },
          {
            title: "On-Demand, Reserved/Savings Plans, and Spot",
            detail:
              "On-Demand: pay per second, no commitment, most expensive per-hour — right for unpredictable or short-lived workloads. Reserved Instances/Savings Plans: commit to 1-3 years for a significant discount — right for steady-state, predictable baseline capacity you know you'll run continuously. Spot: bid on spare capacity at up to ~90% off, but can be reclaimed with only a 2-minute warning — right only for fault-tolerant, interruptible workloads (batch processing, CI runners, stateless workers behind an ASG that can absorb losing an instance).",
          },
        ],
      },
      {
        heading: "AMIs",
        points: [
          {
            title: "A versioned, reusable boot image",
            detail:
              "An AMI (Amazon Machine Image) is a snapshot of a configured instance — OS, installed software, config — that new instances boot from. Building a custom, hardened, pre-baked AMI (vs. bootstrapping everything via user-data scripts on every boot) trades a slower AMI-build/update pipeline for much faster, more reliable instance launches, which matters a lot for Auto Scaling responsiveness under a traffic spike.",
          },
        ],
      },
    ],
    closingTip: "If asked to justify a purchasing-option mix for a real system: 'Reserved/Savings Plans for the steady-state baseline load, On-Demand or Spot layered on top via Auto Scaling for burst capacity' is the standard, defensible answer — naming this mix unprompted signals real cost-awareness.",
  },
  {
    slug: "aws-load-balancer-types",
    question: "ALB vs NLB vs the classic ELB — how do you choose?",
    category: "AWS",
    round: "general",
    summary:
      "ALB operates at layer 7 (HTTP-aware routing, path/host-based rules), NLB at layer 4 (raw TCP/UDP, extreme performance, static IPs) — the classic ELB is legacy and shouldn't be the default choice for a new system.",
    intro: "State the OSI layer each operates at first — it's the single fact that explains every other difference between them.",
    sections: [
      {
        heading: "Application Load Balancer (ALB) — layer 7",
        points: [
          {
            title: "HTTP/HTTPS-aware routing",
            detail:
              "Understands HTTP — can route by path (/api/* to one target group, /admin/* to another), by host header (multiple domains on one ALB), inspect headers, and terminate TLS. The default choice for a typical web application or API.",
          },
        ],
      },
      {
        heading: "Network Load Balancer (NLB) — layer 4",
        points: [
          {
            title: "Raw TCP/UDP, ultra-low latency, static IPs",
            detail:
              "Operates on raw connections without inspecting HTTP content — much higher throughput and lower latency than an ALB, and (unlike ALB) supports static IP addresses per AZ, which matters when a downstream system needs to allowlist a fixed IP. Right choice for non-HTTP protocols, extreme performance requirements, or when a client needs a stable IP to connect to.",
          },
        ],
      },
      {
        heading: "The classic ELB",
        points: [
          {
            title: "Legacy — don't default to it for a new system",
            detail:
              "Predates both ALB and NLB, supports both layer 4 and a limited layer 7, but lacks the advanced routing ALB offers and the performance/static-IP profile NLB offers. Still exists for backward compatibility with older systems; not the right default for anything new.",
          },
        ],
      },
    ],
    closingTip: "The decision rule in one line: 'HTTP-aware routing needed → ALB. Raw TCP/UDP, extreme performance, or a static IP → NLB. Never default to the classic ELB for something new.'",
  },
  {
    slug: "aws-route53-dns-routing-policies",
    question: "How does Route 53 work, and what are its routing policies actually for?",
    category: "AWS",
    round: "general",
    summary:
      "Route 53 is DNS as a managed, highly available service — the routing policies (weighted, latency, failover, geolocation) are what let DNS itself make traffic-distribution decisions, not just static name resolution.",
    intro: "The strongest answers pick a routing policy for a REAL scenario rather than reciting the list — e.g. 'failover for DR, weighted for a canary rollout'.",
    sections: [
      {
        heading: "The routing policies, matched to what they're actually for",
        points: [
          {
            title: "Simple, weighted, latency, failover, geolocation",
            detail:
              "Simple: one record, one answer — the DNS default. Weighted: split traffic by percentage across multiple targets — canary releases, A/B testing at the DNS level. Latency-based: route each client to whichever region actually responds fastest to it — for a globally distributed system. Failover: an active/passive pair with health checks — DNS-level disaster recovery, automatically routing to a standby if the primary's health check fails. Geolocation: route based on the requester's actual geographic location — useful for data-residency/compliance requirements, not just performance.",
          },
        ],
      },
      {
        heading: "Health checks are what make failover and latency routing actually work",
        points: [
          {
            title: "Route 53 actively probes endpoints, not just resolving names blindly",
            detail:
              "A health check periodically probes an endpoint (HTTP, TCP, or a CloudWatch alarm) and Route 53 stops routing traffic to a target that's failing its check — this is the mechanism failover routing depends on, not something separate from it.",
          },
        ],
      },
    ],
    closingTip: "Tie a routing policy to a real scenario rather than defining them abstractly: 'weighted for gradually rolling out a new version, failover with health checks for cross-region disaster recovery' is a stronger answer than a definitions list.",
  },
  {
    slug: "aws-api-gateway-fundamentals",
    question: "REST API vs HTTP API in API Gateway — and what does an authorizer actually do?",
    category: "AWS",
    round: "general",
    summary:
      "HTTP APIs are the newer, cheaper, lower-latency option for straightforward proxying; REST APIs carry more mature features (request/response transformation, usage plans, WAF integration) — an authorizer runs BEFORE your backend code, rejecting unauthenticated requests without ever invoking your Lambda.",
    intro: "A common real decision (which API type) plus a mechanism question (authorizers) — the strongest answer treats them as two related but separate things, not one blended topic.",
    sections: [
      {
        heading: "HTTP API vs REST API",
        points: [
          {
            title: "Newer and cheaper, vs mature and feature-rich",
            detail:
              "HTTP APIs are significantly cheaper and lower-latency, built for the common case of proxying to a Lambda or HTTP backend with minimal transformation. REST APIs support request/response transformation (mapping templates), usage plans with API keys, and direct WAF attachment — features HTTP APIs either lack or only partially support. Default to HTTP API unless a specific REST API feature is actually needed.",
          },
        ],
      },
      {
        heading: "Authorizers — rejecting a request before your code ever runs",
        points: [
          {
            title: "Lambda authorizer or JWT/Cognito authorizer, evaluated first",
            detail:
              "An authorizer runs before the backend integration — a Lambda authorizer executes custom logic (validate a token, check a claim) and returns an allow/deny policy; a built-in JWT authorizer validates a token's signature and claims declaratively, no custom code needed. Either way, an unauthenticated or invalid request never reaches your actual backend Lambda/service, saving both the invocation cost and the exposure.",
          },
        ],
      },
    ],
    closingTip: "Default recommendation, stated plainly: 'HTTP API unless you specifically need a REST-API-only feature — and always put an authorizer in front, so invalid requests are rejected before they cost a backend invocation.'",
  },
  {
    slug: "aws-lambda-execution-model",
    question: "Explain the Lambda execution model — cold starts, concurrency, and when NOT to use it.",
    category: "AWS",
    round: "general",
    summary:
      "A cold start is the cost of provisioning a fresh execution environment before your code can run at all; concurrency is capped per-account/function; and Lambda is the wrong tool for long-running or highly latency-sensitive-at-p99.9 workloads.",
    intro: "The 'when NOT to use it' half is what separates a real answer from serverless marketing — name the actual limitations, not just the appeal.",
    sections: [
      {
        heading: "Cold starts and concurrency",
        points: [
          {
            title: "A cold start provisions a new execution environment before your handler even runs",
            detail:
              "A 'warm' invocation reuses an already-initialized execution environment (fast). A 'cold' one has to provision a new one first — download your code, start the runtime, run any top-level initialization — adding real latency, worse for languages with heavier runtime startup (JVM) than lighter ones (Node, Python). Provisioned Concurrency keeps a set number of environments pre-warmed, trading cost for eliminating cold starts on that reserved capacity.",
            code: `// code OUTSIDE the handler runs once per cold start, reused across warm invocations
const dbClient = createConnection(); // good — reused across warm invocations

exports.handler = async (event) => {
  // this runs on EVERY invocation, warm or cold
  return await dbClient.query(...);
};`,
            codeLanguage: "javascript",
          },
          {
            title: "Concurrency limits are real and per-account by default",
            detail:
              "Each function can scale to handle many concurrent invocations, but there's an account-level concurrency ceiling shared across all functions unless increased — a burst of traffic to one function can throttle invocations of unrelated functions in the same account if that ceiling is hit. Reserved concurrency carves out a guaranteed (and capped) slice for a specific function.",
          },
        ],
      },
      {
        heading: "When Lambda is genuinely the wrong tool",
        points: [
          {
            title: "Long-running processes, and workloads that can't tolerate cold-start-tail latency",
            detail:
              "A 15-minute maximum execution time rules it out for genuinely long-running jobs (a long batch process belongs on ECS/EC2/Batch instead). A workload with strict p99.9 latency requirements that can't tolerate an occasional cold start (even with Provisioned Concurrency mitigating most of them) may be better served by an always-on container. And a workload that's constantly, heavily loaded around the clock can end up MORE expensive on Lambda's per-invocation pricing than a reserved EC2/container fleet — serverless isn't unconditionally cheaper.",
          },
        ],
      },
    ],
    closingTip: "Naming a concrete case where you'd NOT reach for Lambda — a long-running batch job, or a constantly-hot workload where reserved EC2 capacity is actually cheaper — is the detail that shows real operational judgment, not just serverless enthusiasm.",
  },
  {
    slug: "aws-dynamodb-fundamentals",
    question: "Explain DynamoDB's data model — partition keys, GSIs/LSIs, and capacity modes.",
    category: "AWS",
    round: "general",
    summary:
      "DynamoDB scales by spreading data across partitions by hash of the partition key — access patterns have to be designed UP FRONT, since (unlike SQL) there's no ad-hoc querying across arbitrary fields without a matching index.",
    intro: "The strongest answers state the core constraint immediately — design for your access patterns FIRST, then the schema — since that's the single biggest DynamoDB mindset shift from relational modeling.",
    sections: [
      {
        heading: "Partition keys — the core scaling mechanism",
        points: [
          {
            title: "Data is physically spread across partitions by hash of the partition key",
            detail:
              "Every item's partition key is hashed to determine which physical partition stores it — a well-distributed partition key spreads load evenly; a poorly chosen one (low cardinality, or one value receiving disproportionate traffic) creates a hot partition, the exact class of problem covered in this app's own sharding/hotspot content, just DynamoDB-specific.",
            relatedLink: { href: "/databases/scaling", label: "The same hotspot problem, animated" },
          },
        ],
      },
      {
        heading: "GSIs and LSIs — querying beyond the base table's key",
        points: [
          {
            title: "Global Secondary Index vs Local Secondary Index",
            detail:
              "A GSI has its own independent partition key (and optional sort key) — effectively a separate, differently-organized copy of the data, letting you query by an attribute other than the base table's partition key. An LSI shares the base table's partition key but has a different sort key — more limited (must be created at table creation, shares the base table's capacity) but useful for alternate sort orders within the same partition.",
          },
        ],
      },
      {
        heading: "Capacity modes",
        points: [
          {
            title: "Provisioned vs On-Demand",
            detail:
              "Provisioned: specify read/write capacity units ahead of time — cheaper at steady, predictable load, but under-provisioning throttles requests. On-Demand: pay per request, scales automatically — simpler operationally and better for unpredictable/spiky traffic, at a higher per-request cost than well-tuned provisioned capacity.",
          },
        ],
      },
    ],
    closingTip: "The mindset shift to state explicitly: 'in DynamoDB you design the table around your known access patterns first, unlike SQL where you normalize the data model and query it flexibly afterward — that's the single biggest adjustment moving from relational to DynamoDB.'",
  },
  {
    slug: "aws-kms-encryption",
    question: "How does AWS KMS work, and what's the difference between a CMK and a data key?",
    category: "AWS",
    round: "general",
    summary:
      "KMS is envelope encryption as a managed service — a Customer Master Key never leaves KMS and is used only to encrypt/decrypt small data keys, which are what actually encrypt your data, exactly the pattern covered in the general key-management question.",
    intro: "This is the AWS-specific, concrete version of the envelope-encryption concept already covered generically — the strongest answer names that connection directly.",
    sections: [
      {
        heading: "CMK vs data key",
        points: [
          {
            title: "The CMK never leaves KMS; the data key does the actual encrypting",
            detail:
              "A Customer Master Key (CMK) lives entirely inside KMS and is never exposed in plaintext outside it. To encrypt actual data, you ask KMS to generate a data key — KMS returns both a plaintext data key (used immediately, then discarded from memory) and that same data key encrypted under the CMK (stored alongside your encrypted data). To decrypt later, you send the encrypted data key back to KMS, which decrypts it using the CMK, giving you the plaintext data key back to decrypt your actual data.",
            relatedLink: { href: "/interview/key-management-at-scale", label: "The general envelope-encryption pattern this implements" },
          },
        ],
      },
      {
        heading: "Why this matters operationally",
        points: [
          {
            title: "Rotating the CMK doesn't mean re-encrypting all your data",
            detail:
              "Because the CMK only ever encrypts small data keys (not your actual bulk data), rotating it means re-encrypting those small data keys, not your entire dataset — the exact benefit envelope encryption is designed to provide. KMS also integrates directly with most AWS services (S3, EBS, RDS) so 'encrypt at rest' is often a checkbox backed by exactly this mechanism under the hood.",
          },
        ],
      },
    ],
    closingTip: "Connect this directly to the general concept: 'this is envelope encryption — the CMK encrypts data keys, data keys encrypt the actual data, so rotating the master key stays cheap regardless of how much data you have.'",
  },
  {
    slug: "aws-cloudfront-cdn",
    question: "How does CloudFront work, and what are cache behaviors actually for?",
    category: "AWS",
    round: "general",
    summary:
      "CloudFront caches content at edge locations close to users, and cache behaviors let a single distribution route different URL patterns to different origins with different caching rules — a static asset and a dynamic API can sit behind the same distribution.",
    intro: "A common trap: assuming CloudFront is only for static assets — the strongest answer names that a single distribution can front both static and dynamic origins via different cache behaviors.",
    sections: [
      {
        heading: "The core mechanism",
        points: [
          {
            title: "Edge caching, close to the user, in front of an origin",
            detail:
              "CloudFront caches responses at edge locations physically distributed worldwide, so a repeat request is served from a nearby edge instead of round-tripping to the origin (an S3 bucket, an ALB, any HTTP origin) every time — dramatically cutting latency for cacheable content and reducing load on the origin itself.",
          },
        ],
      },
      {
        heading: "Cache behaviors — different rules per path pattern",
        points: [
          {
            title: "One distribution, multiple origins, routed and cached differently by path",
            detail:
              "A cache behavior matches a URL path pattern (e.g. /static/* vs /api/*) and routes it to a specific origin with its own caching rules — /static/* might cache aggressively at the edge (long TTL, cache based on nothing but the path), while /api/* might forward straight to an origin with caching disabled entirely (or cache based on specific headers/query strings). This is what lets a single CloudFront distribution front an entire application, not just its static assets.",
          },
        ],
      },
      {
        heading: "Signed URLs/cookies — restricting access to cached content",
        points: [
          {
            title: "For content that shouldn't be publicly cacheable-and-fetchable by anyone",
            detail:
              "A signed URL/cookie (time-limited, cryptographically signed) restricts who can actually retrieve a cached object — used for paid content, private media, or anything that shouldn't be fetchable just by knowing the URL, while still getting CDN caching benefits for authorized requests.",
          },
        ],
      },
    ],
    closingTip: "Naming that a single distribution can serve both static AND dynamic content via different cache behaviors per path — not 'CloudFront is just for static files' — is the detail that separates real CDN experience from a surface-level answer.",
  },
  {
    slug: "aws-waf-rules",
    question: "What does AWS WAF actually protect against, and where does it sit in the request path?",
    category: "AWS",
    round: "general",
    summary:
      "WAF filters HTTP requests based on rules (managed rule groups for common attack patterns, rate-based rules for abuse, custom rules for app-specific logic) — and it attaches to CloudFront, ALB, or API Gateway, inspecting traffic before it reaches your application.",
    intro: "The strongest answers name where WAF sits relative to the rest of the stack, since that's what determines what it can and can't see/block.",
    sections: [
      {
        heading: "What it filters, and how",
        points: [
          {
            title: "Managed rule groups, rate-based rules, and custom rules",
            detail:
              "AWS-managed rule groups cover common attack patterns (SQL injection signatures, known bad IP reputation lists, the OWASP Top 10 broadly) without writing your own rules. Rate-based rules block a specific client IP that exceeds a request threshold in a time window — a coarse, edge-level companion to the application-level rate limiting covered elsewhere in this app, not a replacement for it. Custom rules let you write app-specific logic (block a specific header pattern, a known-bad user agent, a geographic restriction).",
            relatedLink: { href: "/rate-limiting", label: "Application-level rate limiting, running for real in this app" },
          },
        ],
      },
      {
        heading: "Where it sits — in front of CloudFront, ALB, or API Gateway",
        points: [
          {
            title: "Filters traffic BEFORE it reaches your application at all",
            detail:
              "WAF attaches to a CloudFront distribution, an Application Load Balancer, or an API Gateway — inspecting and potentially blocking requests before they ever reach your backend code. This is a genuinely different layer than application-level input validation: WAF is the edge-level filter that stops obviously malicious traffic from consuming any backend resources at all, while application-level validation still matters for everything WAF's generic rules don't catch.",
          },
        ],
      },
    ],
    closingTip: "The framing that shows real understanding: 'WAF is edge-level filtering for known-bad patterns and abusive rates — it doesn't replace application-level validation and rate limiting, it's a first line of defense in front of it.'",
  },
  {
    slug: "aws-iam-least-privilege",
    question: "Explain IAM — roles vs users vs policies, and what 'least privilege' actually means in practice.",
    category: "AWS",
    round: "general",
    summary:
      "A role is a set of permissions ASSUMED temporarily (by a service, another account, or federated identity) — not tied to a fixed credential the way a user's long-lived access keys are. Least privilege means starting from zero permissions and adding only what's proven necessary, not starting broad and trimming later.",
    intro: "Foundational — every other AWS service question assumes IAM correctness underneath it, and 'why roles over long-lived user access keys' is the detail worth being precise about.",
    sections: [
      {
        heading: "Users, roles, and policies",
        points: [
          {
            title: "A user has long-lived credentials; a role is assumed temporarily",
            detail:
              "An IAM user has persistent credentials (a password, or access keys) tied to a specific identity — appropriate for a human who logs in, risky for a workload (a leaked long-lived key is a standing liability). A role has NO credentials of its own — it's assumed temporarily, producing short-lived, auto-expiring credentials, by an EC2 instance, a Lambda function, another AWS account, or a federated identity. A policy (attached to either) is the actual JSON document defining what's allowed.",
            code: `{
  "Effect": "Allow",
  "Action": ["dynamodb:GetItem", "dynamodb:Query"],
  "Resource": "arn:aws:dynamodb:us-east-1:123456789012:table/Orders"
  // narrow: one table, read-only actions — not "dynamodb:*" on "*"
}`,
            codeLanguage: "json",
          },
        ],
      },
      {
        heading: "Least privilege as a discipline, not a one-time setup",
        points: [
          {
            title: "Start at zero, add only what's proven necessary — and revisit as usage changes",
            detail:
              "The common failure mode is granting broad permissions 'to get it working' and never narrowing them afterward. Real least-privilege practice means starting from no permissions, adding exactly what a role needs (scoped to specific resources and actions, not wildcards), and periodically reviewing actual usage (via IAM Access Analyzer or CloudTrail) to find and remove permissions that were granted but never actually used.",
          },
          {
            title: "Instance/execution roles over embedded long-lived credentials",
            detail:
              "An EC2 instance or Lambda function should use an attached IAM role (auto-rotating temporary credentials) rather than ever having a long-lived access key hardcoded or stored in its environment — this is the AWS-specific instance of the general 'secrets never live in source control' discipline.",
            relatedLink: { href: "/interview/key-management-at-scale", label: "The general secrets/key-management discipline this follows" },
          },
        ],
      },
    ],
    closingTip: "State it as a discipline, not a config: 'least privilege is something you continuously review, not something you set once at creation — and any workload identity should use a role with temporary credentials, never a long-lived embedded key.'",
  },
  {
    slug: "aws-s3-storage-classes",
    question: "Walk through S3 storage classes, versioning, and lifecycle policies.",
    category: "AWS",
    round: "general",
    summary:
      "Storage classes trade retrieval speed/cost for storage cost based on how often data is actually accessed; versioning protects against accidental overwrite/delete; lifecycle policies automate moving data down that cost curve as it ages, without manual intervention.",
    intro: "The strongest answers frame storage-class choice around actual ACCESS PATTERN (how often is this read?), not just picking the cheapest option blindly.",
    sections: [
      {
        heading: "Storage classes — matched to access frequency",
        points: [
          {
            title: "Standard, Infrequent Access, Glacier — a spectrum, not a binary choice",
            detail:
              "S3 Standard: frequently accessed data, higher storage cost, no retrieval fee, instant access. S3 Standard-IA/One Zone-IA: cheaper storage, but a per-GB retrieval fee — right for data accessed infrequently but needed instantly when it is. Glacier (and Glacier Deep Archive): dramatically cheaper storage, but retrieval takes minutes to hours and costs more per retrieval — right for long-term archives (compliance retention, backups) rarely or never expected to be read.",
          },
        ],
      },
      {
        heading: "Versioning and lifecycle policies",
        points: [
          {
            title: "Versioning protects against accidental overwrite/delete",
            detail:
              "With versioning enabled, an overwrite or delete creates a new version rather than destroying the old one — recoverable, at the cost of storing every version (which is exactly what a lifecycle policy manages, e.g. expiring old versions after N days).",
          },
          {
            title: "Lifecycle policies automate the storage-class transition over time",
            detail:
              "A lifecycle policy automatically moves objects to a cheaper storage class (or deletes them) after a defined age — e.g. move to IA after 30 days, Glacier after 90, delete after 7 years for compliance retention. This turns 'pick the right storage class' from a one-time manual decision into an automated policy that tracks data as it actually ages.",
          },
        ],
      },
    ],
    closingTip: "Frame storage-class selection around access pattern explicitly: 'how often is this actually going to be read, and how fast does it need to be available when it is' — that question alone determines the right class far more reliably than optimizing for storage cost in isolation.",
  },
  {
    slug: "aws-rds-vs-dynamodb",
    question: "RDS vs DynamoDB — how do you actually decide, on AWS specifically?",
    category: "AWS",
    round: "general",
    summary:
      "This is the AWS-specific instance of the general SQL-vs-NoSQL architecture decision — RDS for relational integrity and ad-hoc querying, DynamoDB for access-pattern-driven scale with a known query shape up front.",
    intro: "The strongest answer connects this directly to the general SQL-vs-NoSQL decision framework already covered, rather than re-deriving it as if it were AWS-specific reasoning.",
    sections: [
      {
        heading: "The same decision, on managed AWS services specifically",
        points: [
          {
            title: "RDS — managed relational (Postgres/MySQL/etc.), ACID transactions, flexible querying",
            detail:
              "Choose RDS when multiple entities need transactional consistency together, or the query patterns aren't fully known upfront and ad-hoc SQL flexibility matters — exactly the general 'choose SQL' case, running on managed AWS infrastructure with automated backups/Multi-AZ failover handled for you.",
            relatedLink: { href: "/interview/nosql-when-to-choose-over-sql", label: "The general SQL-vs-NoSQL decision framework this maps onto" },
          },
          {
            title: "DynamoDB — access-pattern-driven, near-unlimited horizontal scale",
            detail:
              "Choose DynamoDB when access patterns are well-understood up front and the workload needs to scale horizontally to a degree that would strain a single RDS primary — at the cost of needing to design the table around those access patterns from day one rather than querying flexibly later.",
          },
        ],
      },
      {
        heading: "Aurora — worth naming as the middle ground",
        points: [
          {
            title: "Aurora — relational, but built for cloud-native scale",
            detail:
              "Aurora is AWS's own MySQL/Postgres-compatible engine, re-architected for the cloud — separates compute from a distributed, self-healing storage layer, giving relational semantics (SQL, ACID, joins) with significantly better scaling and failover characteristics than standard RDS. Worth naming as the option that narrows the gap between 'needs SQL' and 'needs to scale', without switching data models entirely.",
          },
        ],
      },
    ],
    closingTip: "Explicitly name that this is not a new decision framework — 'this is the same SQL-vs-NoSQL tradeoff, just mapped onto AWS's specific managed services, with Aurora as the middle ground worth knowing exists.'",
  },
  {
    slug: "aws-cloudwatch-observability",
    question: "How do CloudWatch metrics, logs, alarms, and X-Ray fit together for observability?",
    category: "AWS",
    round: "general",
    summary:
      "Metrics answer 'what's the trend', logs answer 'what exactly happened', alarms turn a metric threshold into an action, and X-Ray answers 'where did the time actually go across services' — four different questions, not four names for the same thing.",
    intro: "The strongest answers connect each tool to the SPECIFIC question it answers, rather than treating 'observability' as one undifferentiated bucket.",
    sections: [
      {
        heading: "Metrics, logs, and alarms",
        points: [
          {
            title: "Different signals for different questions",
            detail:
              "CloudWatch Metrics: numeric time-series (CPU utilization, request count, latency) — good for trends and dashboards, not for understanding a specific failure's detail. CloudWatch Logs: the actual detailed record of what happened — what you actually read to debug a specific incident. Alarms: a threshold on a metric that triggers an action (a notification, an Auto Scaling action, a Lambda) — the mechanism that turns 'we're monitoring this' into 'something actually happens when it crosses a line'.",
          },
        ],
      },
      {
        heading: "X-Ray — distributed tracing across services",
        points: [
          {
            title: "Answers 'where did the time go' across a request spanning multiple services",
            detail:
              "In a system where one request touches API Gateway → Lambda → DynamoDB → another service, X-Ray traces that single request across every hop, showing exactly which segment consumed how much time — the AWS-native version of the distributed tracing concept referenced in the API-spike root-causing question elsewhere in this app.",
            relatedLink: { href: "/interview/root-causing-api-spike", label: "The general 'trace the request waterfall' diagnostic step this implements" },
          },
        ],
      },
    ],
    closingTip: "Map each tool to its question explicitly: 'metrics for trend, logs for detail, alarms for action, X-Ray for where-did-the-time-go across services' — that mapping is a stronger answer than describing each tool in isolation.",
  },
  {
    slug: "aws-sqs-sns-decoupling",
    question: "SQS vs SNS — how do they decouple a system, and how do you combine them?",
    category: "AWS",
    round: "general",
    summary:
      "SQS is a queue — one message, consumed by one worker, pull-based. SNS is a pub/sub topic — one message, fanned out to every subscriber, push-based. Combined (SNS fanning out to multiple SQS queues), you get both parallel independent consumers AND per-consumer durability/retry.",
    intro: "The strongest answers name the fan-out pattern (SNS → multiple SQS) explicitly, since that's the detail that shows you've actually combined them, not just used one in isolation.",
    sections: [
      {
        heading: "SQS — a queue, one consumer per message",
        points: [
          {
            title: "Pull-based, durable, decouples producer from consumer speed",
            detail:
              "A producer sends a message to a queue; a worker pulls and processes it, deleting it once done (or it reappears for retry if not deleted in time). This decouples the producer from needing the consumer to be immediately available or fast enough to keep up — the queue absorbs the mismatch, and a dead-letter queue catches messages that repeatedly fail processing instead of retrying forever.",
          },
        ],
      },
      {
        heading: "SNS — pub/sub, every subscriber gets a copy",
        points: [
          {
            title: "Push-based fan-out to multiple independent subscribers",
            detail:
              "A publisher sends one message to a topic; EVERY subscriber (which could be multiple SQS queues, Lambda functions, HTTP endpoints, email) receives its own copy — the fan-out pattern, useful when one event needs to trigger several independent downstream reactions.",
          },
        ],
      },
      {
        heading: "Combining them — the standard fan-out-with-durability pattern",
        points: [
          {
            title: "SNS topic fanning out to multiple SQS queues",
            detail:
              "Publish once to an SNS topic, with several SQS queues subscribed to it — each downstream consumer gets its own durable, independently-retryable queue instead of racing to process the same shared queue, while the publisher only ever had to know about one topic. This is the standard AWS pattern for 'one event, several independent reactions, each with its own retry/durability guarantees'.",
          },
        ],
      },
    ],
    closingTip: "Naming the SNS-fanning-out-to-multiple-SQS-queues pattern unprompted is the strongest signal in this question — it shows you've combined the two for a real architecture, not just learned two service definitions in isolation.",
  },
  {
    slug: "aws-autoscaling-policies",
    question: "How does Auto Scaling actually decide when to add or remove instances?",
    category: "AWS",
    round: "general",
    summary:
      "An Auto Scaling Group scales based on a policy reacting to a metric (target tracking is the simplest and most common), with a cooldown period preventing it from thrashing — and it only works well when paired with a Load Balancer routing traffic to whatever instances currently exist.",
    intro: "Naming the thrashing/cooldown problem specifically is what separates a real operational answer from 'it adds instances when load is high'.",
    sections: [
      {
        heading: "Scaling policy types",
        points: [
          {
            title: "Target tracking is the common default",
            detail:
              "Target tracking: pick a metric (e.g. average CPU at 60%) and the ASG automatically adds/removes instances to hold that target — simplest to reason about, the common default. Step scaling: define explicit steps (add 2 instances if CPU > 70%, add 5 if > 90%) for more control over the response curve. Scheduled scaling: pre-scale ahead of a known traffic pattern (a daily peak, a planned event) rather than reacting after the fact.",
          },
        ],
      },
      {
        heading: "Cooldown — preventing scale-thrashing",
        points: [
          {
            title: "A pause after a scaling action, before the next one is evaluated",
            detail:
              "Without a cooldown, a metric bouncing around a threshold could trigger a rapid add-remove-add cycle — wasteful and destabilizing (new instances take time to actually become useful, e.g. warming a cache or completing a health check, so scaling again before that finishes doesn't help). A cooldown period after each scaling action gives the system time to actually reflect the previous action's effect before deciding whether another is needed.",
          },
        ],
      },
      {
        heading: "This only works paired with a Load Balancer",
        points: [
          {
            title: "The ASG changes WHICH instances exist; the LB changes WHERE traffic goes",
            detail:
              "An ASG on its own doesn't route traffic — it manages the instance FLEET (launching healthy ones, terminating unhealthy ones per its health checks, respecting min/max/desired capacity). Registering the ASG with a Load Balancer's target group is what actually gets traffic routed to whatever instances currently exist, and stops routing to ones the ASG has terminated.",
          },
        ],
      },
    ],
    closingTip: "Naming the cooldown/thrashing consideration is the operational detail that distinguishes real Auto Scaling experience from a surface-level 'it scales based on load' answer.",
  },
  {
    slug: "aws-well-architected-framework",
    question: "Walk through the AWS Well-Architected Framework's pillars, and how you'd actually apply them to a system review.",
    category: "AWS",
    round: "general",
    summary:
      "Six pillars — Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability — used as a structured review checklist, not a one-time design exercise; the strongest answers describe running an actual review against a real system, not reciting the pillar names.",
    intro: "Lead/architect capstone — this question is really asking whether you've RUN a Well-Architected-style review, not whether you can name six words.",
    sections: [
      {
        heading: "The six pillars, briefly",
        points: [
          {
            title: "Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability",
            detail:
              "Operational Excellence: can you operate and evolve this system safely (deploys, monitoring, runbooks)? Security: is access, data, and infrastructure protected appropriately — least privilege, encryption, incident response? Reliability: does it recover from failure and meet its availability target — this is where the distributed-scaling and failover content elsewhere in this app lives conceptually. Performance Efficiency: is the right resource type/size being used for the workload, and does it stay efficient as it evolves? Cost Optimization: is spend matched to actual need, not just working spend? Sustainability: is resource usage minimized for its actual environmental impact.",
            relatedLink: { href: "/interview/distributed-database-scaling-methodology", label: "The Reliability/scaling pillar, in concrete depth" },
          },
        ],
      },
      {
        heading: "How this actually gets applied — a review, not a one-time design pass",
        points: [
          {
            title: "A structured periodic review against a real running system",
            detail:
              "In practice, a Well-Architected review means walking a real system's architecture against each pillar's specific questions with the people who operate it, identifying concrete gaps (no runbook for a specific failure mode, an over-provisioned instance type, a security group that's wider than necessary), and prioritizing fixes by actual risk/impact — not a one-time checkbox exercise done once at launch and never revisited.",
          },
        ],
      },
    ],
    closingTip: "If asked to demonstrate this concretely, walk through ONE pillar applied to a real system you've worked on — 'here's a Reliability gap we found and fixed' is a far stronger answer than reciting all six pillar names accurately.",
  },
];
