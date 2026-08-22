import type { InterviewQuestion } from "./types";

// Amazon Connect gets its own file and topic — deliberately separate from
// general AWS — since it's a distinct product surface (contact-center
// specific: contact flows, queues, routing profiles, telephony) rather than
// general cloud infrastructure, and deserves depth proportional to real
// hands-on experience rather than being one entry among many AWS services.
export const amazonConnectQuestions: InterviewQuestion[] = [
  {
    slug: "amazon-connect-fundamentals",
    question: "Explain Amazon Connect's core building blocks — contact flows, queues, routing profiles, and agents.",
    category: "Amazon Connect",
    round: "general",
    summary:
      "A contact flow is the actual call/chat logic (a visual flowchart, or JSON under the hood); a queue holds waiting contacts; a routing profile decides which agent can pull from which queues, in what priority — four distinct concepts that together define how a contact reaches an agent.",
    intro: "The strongest answers connect these four pieces as a PIPELINE — contact flow decides where a contact goes, a queue holds it, a routing profile decides who can take it from there — rather than describing each in isolation.",
    sections: [
      {
        heading: "Contact flows — the logic",
        points: [
          {
            title: "A visual (or JSON) flowchart handling the contact from the moment it arrives",
            detail:
              "A contact flow is the actual decision logic for an inbound (or outbound) contact — play a prompt, check business hours, invoke a Lambda for dynamic logic, transfer to a queue, or disconnect. Built visually in the Connect console, but backed by an underlying JSON definition that can be exported/versioned/deployed like any other infrastructure artifact.",
          },
        ],
      },
      {
        heading: "Queues and routing profiles — who actually gets the contact",
        points: [
          {
            title: "A queue holds waiting contacts; a routing profile decides which agent can pull from it",
            detail:
              "A queue is where a contact waits once the flow routes it there, with its own hold-music, wait-time announcements, and overflow behavior if wait time gets too long. A routing profile is attached to an AGENT, not a queue — it defines which queue(s) that agent can receive contacts from, in what priority/delay order, and across which channels (voice, chat, task) simultaneously. This indirection — agents don't belong to queues directly, they belong to routing profiles that reference queues — is what lets one agent serve multiple queues with a defined priority.",
          },
        ],
      },
      {
        heading: "The full path, end to end",
        points: [
          {
            title: "Contact arrives → contact flow logic runs → routed to a queue → an available agent (per their routing profile) picks it up",
            detail:
              "State this as the pipeline explicitly when asked to design a new use case — it's the mental model that makes every other Connect concept (dynamic routing, priority queuing, overflow) make sense as a variation on one of these four stages, not a new unrelated mechanism.",
          },
        ],
      },
    ],
    closingTip: "Describe the four pieces as a pipeline, in order, rather than as a glossary — 'flow decides where, queue holds it, routing profile decides who' is the sentence that shows you've actually configured a contact center, not just read the docs once.",
  },
  {
    slug: "amazon-connect-dynamic-routing-lambda",
    question: "How do you build dynamic, data-driven routing logic in a Connect contact flow?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "A contact flow invokes a Lambda function synchronously mid-flow, passing contact attributes in and getting decision data back — this is how routing decisions that depend on external data (customer tier, account status, current business context) get made, since the flow itself has no direct database access.",
    intro: "This is the single most common real-world Connect integration pattern — the strongest answer walks through the actual data contract (what goes in, what comes back) rather than describing it abstractly.",
    sections: [
      {
        heading: "Why a contact flow needs Lambda for anything beyond static logic",
        points: [
          {
            title: "Contact flows can't query a database or call an arbitrary API directly",
            detail:
              "A contact flow's built-in blocks handle static branching (business hours, DTMF menu selection, simple attribute checks) but have no way to, say, look up a customer's account tier in your own database to decide priority routing. An 'Invoke AWS Lambda function' block is the escape hatch — it calls a Lambda synchronously mid-flow and can branch on what it returns.",
          },
        ],
      },
      {
        heading: "The data contract",
        points: [
          {
            title: "Contact attributes in, a JSON response back, branched on inside the flow",
            detail:
              "The Lambda receives the contact's attributes (phone number, any attributes set earlier in the flow, a customer id looked up from a prior CRM-lookup step) as its event payload, does whatever lookup/logic is needed, and returns a JSON object. Back in the flow, a 'Check contact attributes' or similar block branches based on specific keys in that returned JSON — e.g. routing VIP customers to a priority queue, or skipping straight past a menu for a returning caller already identified by phone number.",
            code: `// Lambda invoked from a Connect contact flow
exports.handler = async (event) => {
  const phoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
  const customer = await lookupCustomerByPhone(phoneNumber);

  return {
    customerTier: customer?.tier ?? "standard",
    isReturningCustomer: customer ? "true" : "false",
  };
  // the flow's "Check contact attributes" block branches on customerTier next
};`,
            codeLanguage: "javascript",
          },
        ],
      },
      {
        heading: "The operational constraint worth knowing",
        points: [
          {
            title: "An 8-second timeout, by default, on the invocation",
            detail:
              "The Lambda invocation from within a flow has a short timeout — a slow downstream dependency (an overloaded database, a flaky third-party API) can cause the flow's Lambda step to fail, which needs an explicit error-branch in the flow (falling back to standard routing, not leaving the caller stuck) rather than assuming the call always succeeds.",
          },
        ],
      },
    ],
    closingTip: "Naming the timeout and the need for an explicit error branch is the detail that shows you've actually operated this in production — a caller silently stuck because an unhandled Lambda timeout wasn't given a fallback path is a real, common Connect incident.",
  },
  {
    slug: "amazon-connect-ivr-self-service",
    question: "How would you build a self-service IVR in Connect — DTMF menus vs a natural-language bot?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "DTMF (press-1-for-X) menus are simple, fast to build, and predictable; an Amazon Lex-powered natural-language IVR lets a caller speak or type their intent freely, at the cost of real conversation-design and intent-training effort — the right choice depends on how many paths the self-service flow actually needs.",
    intro: "The strongest answers frame this as a real tradeoff (build effort and predictability vs a better caller experience for complex needs), not 'Lex is more advanced so it's always better'.",
    sections: [
      {
        heading: "DTMF menus — simple, predictable, fast to build",
        points: [
          {
            title: "'Press 1 for billing, press 2 for support'",
            detail:
              "A 'Get customer input' block collects a keypress and branches accordingly. Fast to build, completely predictable (no ambiguity to handle), but scales poorly past a handful of options — a menu with 8 nested sub-menus is a genuinely bad caller experience, and every new option means editing the flow's branching logic directly.",
          },
        ],
      },
      {
        heading: "Lex-powered natural language — flexible, but real design effort",
        points: [
          {
            title: "A caller says what they want; Lex resolves it to an intent",
            detail:
              "Amazon Lex (the same engine behind Alexa) integrates directly into a contact flow, letting a caller speak or type naturally ('I need to check my order status') instead of navigating a menu tree — Lex resolves that to a defined intent, which the flow then branches on, the same way it would branch on a DTMF digit. This scales much better to many self-service paths, but requires real conversation design (defining intents, sample utterances, handling misrecognition and fallback) — genuinely more upfront effort than a DTMF menu, not a drop-in upgrade.",
          },
        ],
      },
      {
        heading: "The actual decision factor",
        points: [
          {
            title: "How many paths, and how variable is the caller's phrasing likely to be",
            detail:
              "A simple 3-4 option routing decision is usually still better served by DTMF — fast, unambiguous, no training data needed. A genuinely open-ended self-service need (account questions, order status, troubleshooting with many possible phrasings) is where Lex's flexibility earns its added design cost. Many production IVRs use both: DTMF for a first-level simple split, Lex for a more open-ended sub-flow within one of those branches.",
          },
        ],
      },
    ],
    closingTip: "Naming that many real IVRs combine both — DTMF for the simple top-level split, Lex for open-ended sub-flows — shows practical judgment over a purist 'always use the more advanced option' answer.",
  },
  {
    slug: "amazon-connect-reporting-ctr-kinesis",
    question: "How do Contact Trace Records work, and how would you build real-time reporting on top of Connect?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "A Contact Trace Record (CTR) is generated per contact after it ends — Connect's built-in historical metrics/reports are good for standard reporting, but real-time or custom dashboards need CTRs streamed out via Kinesis, since CTRs themselves arrive after the fact, not live.",
    intro: "The distinction between 'built-in historical reporting' and 'real-time custom dashboards needing Kinesis' is the detail that shows real operational Connect experience.",
    sections: [
      {
        heading: "Contact Trace Records — the record of what happened, per contact",
        points: [
          {
            title: "Generated once a contact ends, with the full detail of what happened",
            detail:
              "A CTR captures queue time, talk time, hold time, which agent handled it, disposition/wrap-up code, and (if configured) which contact flow blocks it passed through — the complete record of one contact's lifecycle, generated after that contact concludes, not streamed live during it.",
          },
        ],
      },
      {
        heading: "Built-in reporting vs streaming for real-time/custom needs",
        points: [
          {
            title: "Connect's own historical reports cover standard cases well",
            detail:
              "Connect ships built-in historical metrics and reports (queue performance, agent performance) sufficient for a lot of standard reporting needs without any custom pipeline at all.",
          },
          {
            title: "Real-time dashboards or custom analytics need CTRs streamed via Kinesis",
            detail:
              "For anything beyond the built-in reports — a live ops dashboard, feeding CTRs into a data warehouse, custom cross-referencing with your own CRM data — Connect streams CTRs (and, separately, real-time agent/contact events) to a Kinesis Data Stream, which downstream consumers (a Lambda, Kinesis Data Firehose into S3/Redshift, a real-time processing app) pick up and process. This is the standard pattern for anything Connect's native reporting doesn't cover directly.",
            code: `// a Lambda consuming CTRs from the Kinesis stream Connect writes to
exports.handler = async (kinesisEvent) => {
  for (const record of kinesisEvent.Records) {
    const ctr = JSON.parse(Buffer.from(record.kinesis.data, "base64").toString());
    await pushToAnalyticsPipeline({
      queueTime: ctr.Agent?.AfterContactWorkDuration,
      disposition: ctr.Attributes?.dispositionCode,
      agentId: ctr.Agent?.Username,
    });
  }
};`,
            codeLanguage: "javascript",
          },
        ],
      },
    ],
    closingTip: "Frame it as a decision, not a mandatory step: 'built-in reports for standard needs, Kinesis-streamed CTRs specifically when you need real-time or custom cross-system analytics the built-in reports don't cover.'",
  },
  {
    slug: "amazon-connect-omnichannel-routing",
    question: "How does Connect handle omnichannel routing — voice, chat, and tasks — through one system?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "Voice, chat, and tasks all flow through the same contact-flow/queue/routing-profile mechanism — a routing profile can grant an agent capacity across multiple channels simultaneously, with per-channel concurrency limits controlling exactly how many of each an agent handles at once.",
    intro: "The strongest answer names that this ISN'T three separate systems bolted together — voice, chat, and tasks share the same underlying routing mechanism, which is the actual design insight worth stating.",
    sections: [
      {
        heading: "One routing mechanism, three channel types",
        points: [
          {
            title: "Chat and tasks use the same contact-flow/queue/routing-profile model as voice",
            detail:
              "A chat contact flow and a voice contact flow are built with the same tool, route through queues the same way, and reach agents through the same routing-profile mechanism — the channel type is a property of the contact, not a separate parallel system. 'Tasks' extend this further to asynchronous, non-real-time work items (e.g. 'follow up on this customer email') routed through the identical queue/routing-profile pipeline.",
          },
        ],
      },
      {
        heading: "Concurrency — what actually makes it 'omnichannel' rather than just multi-channel",
        points: [
          {
            title: "Per-channel concurrency limits on a routing profile",
            detail:
              "A routing profile defines how many concurrent contacts of EACH channel type an agent can handle at once — e.g. 1 voice call at a time (since voice is synchronous and exclusive), but up to 3 concurrent chats (since a human can reasonably type across a few chat windows). This per-channel concurrency configuration is what actually makes an agent 'omnichannel capable' rather than just 'available for one channel at a time' — the routing engine respects these limits when deciding whether an agent can receive a new contact.",
          },
        ],
      },
    ],
    closingTip: "Name the shared mechanism explicitly: 'voice, chat, and tasks aren't three systems — they're the same contact-flow/queue/routing-profile pipeline, with per-channel concurrency limits on the routing profile controlling how many of each an agent juggles at once.'",
  },
  {
    slug: "amazon-connect-security-compliance",
    question: "What security and compliance considerations come up specifically in an Amazon Connect deployment?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "Call recordings and chat transcripts are sensitive data at rest (encrypted via KMS by default, but the key strategy is a real decision) — and a contact center that ever collects payment info over the phone has PCI DSS scope to actively manage, not just encryption to enable.",
    intro: "This is where the general security/encryption content and Connect-specific operational reality actually meet — the strongest answer connects them explicitly rather than treating Connect security as a separate topic.",
    sections: [
      {
        heading: "Recordings and transcripts — sensitive data at rest",
        points: [
          {
            title: "Encrypted via KMS, with a real key-management decision to make",
            detail:
              "Call recordings and chat transcripts are stored in S3, encrypted at rest via KMS — the actual decision is which key: an AWS-managed key (simplest, least control) or a customer-managed CMK (full control over rotation and access policy, required in some compliance contexts). This is the exact envelope-encryption pattern covered generally elsewhere in this app, applied specifically to call recording storage.",
            relatedLink: { href: "/interview/aws-kms-encryption", label: "The CMK/data-key mechanism this relies on" },
          },
        ],
      },
      {
        heading: "PCI DSS — an active scope-management problem, not a checkbox",
        points: [
          {
            title: "Any flow that collects card data over the phone puts that call in PCI scope",
            detail:
              "If a contact flow ever collects payment card data (a caller reading their card number aloud, or entering it via DTMF), that call — and everything touching it, including the recording — falls under PCI DSS scope. Connect supports 'secure input' / pause-and-resume-recording specifically to keep card data OUT of the actual recording and out of what agents can see/hear, which is the standard mitigation for keeping the compliance scope as narrow as possible rather than expanding it to the entire contact center.",
          },
        ],
      },
      {
        heading: "Access control on Connect instance data",
        points: [
          {
            title: "Least-privilege access to recordings/transcripts/CTRs, the same discipline as anywhere else",
            detail:
              "Who can access stored recordings and transcripts should be scoped narrowly and audited — the same least-privilege discipline covered generally for IAM applies directly here, since a call recording is exactly the kind of sensitive data that shouldn't be broadly readable by default.",
            relatedLink: { href: "/interview/aws-iam-least-privilege", label: "The general least-privilege discipline this applies" },
          },
        ],
      },
    ],
    closingTip: "Naming PCI scope-narrowing (secure input / pause-resume recording) specifically, not just 'we encrypt everything', is the detail that shows real compliance-aware Connect experience rather than a generic security answer.",
  },
  {
    slug: "amazon-connect-scaling-availability",
    question: "What do you actually need to think about for Connect's scale and availability under real call volume?",
    category: "Amazon Connect",
    round: "general",
    summary:
      "Connect itself is a managed, multi-AZ service — the real scaling concerns that fall to you are concurrent call/API quotas, contact-flow Lambda invocation limits under burst load, and (for genuinely business-critical contact centers) a cross-region failover strategy, since a Connect instance itself is region-scoped.",
    intro: "This is a lead-level operational question — the strongest answer separates what AWS already handles (the managed service's own HA) from what's actually your responsibility to plan for.",
    sections: [
      {
        heading: "What Connect handles for you",
        points: [
          {
            title: "Multi-AZ availability within a region, out of the box",
            detail:
              "A Connect instance is a managed service with built-in multi-AZ resilience within its region — you don't provision or manage the underlying telephony infrastructure yourself the way you would with a self-hosted PBX. This removes a large class of infrastructure-availability concerns entirely.",
          },
        ],
      },
      {
        heading: "What's still your responsibility",
        points: [
          {
            title: "Service quotas — concurrent calls, API rate limits — need to be checked against real peak volume",
            detail:
              "Connect has account-level service quotas (concurrent active calls, API request rates) that can be increased via a support request, but need to be sized against actual expected peak volume BEFORE a real traffic spike hits them, not discovered during one.",
          },
          {
            title: "Lambda invocation limits under a contact flow's own burst",
            detail:
              "If a contact flow invokes a Lambda (for dynamic routing, as covered elsewhere) and call volume spikes sharply, that Lambda's own concurrency limits and downstream dependency capacity (a database it queries) need to hold up under the same burst — a Lambda getting throttled mid-flow is a caller-facing failure, not just a backend metric.",
            relatedLink: { href: "/interview/aws-lambda-execution-model", label: "Lambda concurrency limits, in depth" },
          },
          {
            title: "Cross-region failover — genuinely your architecture decision, for business-critical centers",
            detail:
              "A Connect instance itself is region-scoped — a full regional outage affecting Connect means that instance is unavailable. For a genuinely business-critical contact center, a cross-region failover strategy (a standby Connect instance in a second region, with phone number failover via Route 53 or a telephony provider's own routing) is a real architecture decision you have to design and test, not something Connect provides automatically.",
          },
        ],
      },
    ],
    closingTip: "Draw the line explicitly: 'multi-AZ within a region is handled for you — quota sizing for real peak volume, your own Lambda/dependency capacity under burst, and cross-region failover for business-critical availability are still your responsibility to design.'",
  },
  {
    slug: "amazon-connect-scenario-contact-center-migration",
    question: "Scenario: you're leading the migration of a large, legacy on-premises call center to Amazon Connect. Walk through your approach.",
    category: "Amazon Connect",
    round: "general",
    summary:
      "A phased, parallel-run migration — not a single cutover — with number porting sequenced last, agent training and contact-flow parity validated before any real traffic moves, and a defined rollback path at every phase.",
    intro: "Lead/architect scenario — the strongest answer treats this as a genuine organizational + technical migration (numbers, agents, historical data, integrations), not just 'stand up Connect and switch over'.",
    sections: [
      {
        heading: "Phase 1 — parallel build, zero live traffic",
        points: [
          {
            title: "Build contact flows, queues, and routing profiles matching current behavior — validated, not assumed",
            detail:
              "Recreate the legacy system's actual call-handling logic in Connect contact flows — business hours, menu structure, priority routing rules — and validate it matches real current behavior with the people who run the legacy system today, not just against documentation that may be stale. Integrate the same downstream systems (CRM lookups, the same dynamic-routing logic) via Lambda during this phase, fully testable with zero live customer traffic at risk.",
          },
        ],
      },
      {
        heading: "Phase 2 — a small, reversible pilot",
        points: [
          {
            title: "Port a small number range or route a narrow slice of traffic first",
            detail:
              "Move a small, low-risk slice of real traffic first — a single non-critical phone number, or a small percentage of one queue's traffic — with the legacy system still fully operational as a fallback. This surfaces real gaps (a contact-flow edge case, an agent workflow difference, a reporting gap) against real traffic, at contained blast radius, before committing further.",
          },
        ],
      },
      {
        heading: "Phase 3 — agent readiness, in parallel with the technical rollout",
        points: [
          {
            title: "Training and the Connect agent workspace, not just the backend routing",
            detail:
              "Agents need real training on the Connect agent workspace (different from whatever legacy softphone/CRM integration they used before) well before their queue's traffic actually moves — this is as much a change-management effort as a technical one, and rushing it independent of the technical readiness is a common real migration failure mode.",
          },
        ],
      },
      {
        heading: "Phase 4 — full cutover, numbers ported last, with a rollback path",
        points: [
          {
            title: "Number porting is the actual point of no easy return — sequence everything else before it",
            detail:
              "Everything else (flows, queues, routing, agent training, reporting/analytics pipeline) should be fully validated BEFORE porting real production phone numbers, since number porting is the step that's genuinely hard to reverse quickly. Even then, have an explicit rollback plan (the legacy system kept warm for a defined window) rather than treating the cutover as irreversible from the moment numbers move.",
          },
        ],
      },
    ],
    closingTip: "The sequencing itself is the answer's core signal: parallel build → small reversible pilot → agent readiness in parallel → full cutover with numbers ported last and a real rollback window. Naming that number porting specifically is the hard-to-reverse step is the detail that shows you've actually run a migration like this, not designed one in the abstract.",
  },
];
