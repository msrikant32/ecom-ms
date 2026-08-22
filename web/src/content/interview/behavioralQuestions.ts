import type { InterviewQuestion } from "./types";

// Behavioral, weighted toward lead-level signal specifically — conflict,
// mentoring, driving technical decisions, incident ownership, influence
// without authority. The existing single behavioral-debugging-story
// question (round3.ts) stays as-is; these are additional, broader coverage
// since lead interviews weigh this category far more heavily than IC ones.
export const behavioralQuestions: InterviewQuestion[] = [
  {
    slug: "behavioral-technical-disagreement",
    question: "Tell me about a time you strongly disagreed with a technical decision. What did you do?",
    category: "Behavioral",
    round: "general",
    summary:
      "The strongest answers show you pushed back with a specific, well-reasoned case — not just an opinion — AND that you committed fully once the decision was actually made, even though you disagreed. Both halves matter; missing either one is a red flag.",
    intro:
      "This question is really testing two things at once: can you disagree productively, and can you disagree-and-commit afterward without quietly sabotaging or relitigating the decision. A story that only shows one half is an incomplete answer.",
    sections: [
      {
        heading: "Structure the story around a real technical stake",
        points: [
          {
            title: "Ground it in a concrete tradeoff, not a personality clash",
            detail:
              "Pick a story where the disagreement was about an actual technical tradeoff (a data model choice, a build-vs-buy call, a migration timeline) with real consequences either way — not a story that's secretly about a difficult colleague. Interviewers are listening for how you reason about tradeoffs under disagreement, not for conflict drama.",
          },
          {
            title: "Show you made your case with evidence, not just conviction",
            detail:
              "The strongest version of this story includes something concrete you brought to the table — a prototype, a benchmark, a written doc walking through the tradeoff — not just repeating your opinion more forcefully. That's the detail that separates 'I pushed back' from 'I pushed back effectively'.",
          },
        ],
      },
      {
        heading: "The commit half — often the part people skip",
        points: [
          {
            title: "What you did AFTER losing the argument matters as much as the argument itself",
            detail:
              "If the decision went the other way, the strongest close is: you committed fully, executed it well, and (ideally) it either worked out fine or you were right and handled being right gracefully rather than saying 'I told you so'. An answer that ends at 'and I was right' without addressing what happened next reads as someone who relitigates decisions rather than executing them.",
          },
        ],
      },
    ],
    closingTip:
      "If you were right and it caused a real problem: don't gloat in the retelling — describe how you helped fix it and what changed afterward (a new review process, a documented decision log) so the story reads as constructive, not vindicated.",
  },
  {
    slug: "behavioral-mentoring-engineers",
    question: "Describe how you've mentored or grown a junior engineer on your team.",
    category: "Behavioral",
    round: "general",
    summary:
      "The strongest answers describe a SPECIFIC person's specific growth (not a generic mentoring philosophy), name what you actually did differently for them, and state a concrete outcome you can point to.",
    intro: "A generic 'I believe in empowering my team' answer is the weak version — the strongest answers are almost entirely concrete specifics about one real person.",
    sections: [
      {
        heading: "Make it about one specific person's specific gap",
        points: [
          {
            title: "Name the actual skill gap you identified, not a vague 'needed to grow'",
            detail:
              "'They were technically strong but avoided speaking up in design reviews' or 'they could implement well but struggled to scope ambiguous tickets' are concrete, diagnosable gaps. Starting from a specific, real observation is what makes the rest of the story credible.",
          },
          {
            title: "Describe the actual mechanism, not just 'I mentored them'",
            detail:
              "Pairing on a specific hard problem, deliberately assigning them a slightly-too-ambitious ticket with a safety net, giving them a design review to lead, structured 1:1 feedback with a specific ask each time — name the actual mechanism you used, since that's the part that shows real mentoring skill rather than good intentions.",
          },
        ],
      },
      {
        heading: "Close with a real, checkable outcome",
        points: [
          {
            title: "What changed, concretely, that you could point to later",
            detail:
              "They started leading their own design reviews, they got promoted, they now mentor someone else — a concrete, external signal is a much stronger close than 'they grew a lot,' since it shows the mentoring actually landed rather than just that you tried.",
          },
        ],
      },
    ],
    closingTip: "If asked a follow-up about a mentoring relationship that DIDN'T work, have that story ready too — being able to talk honestly about a mentoring miss (and what you learned about your own approach from it) is a strong signal at the lead level.",
  },
  {
    slug: "behavioral-production-incident-ownership",
    question: "Walk through a production incident you owned — not just debugged, but owned end to end.",
    category: "Behavioral",
    round: "general",
    summary:
      "Ownership means the postmortem and the prevention work, not just the fix — the strongest answers spend real time on what changed AFTER the incident, since that's the part that distinguishes ownership from firefighting.",
    intro: "This is a different question from the general debugging-story question elsewhere in this app — the emphasis here is specifically on OWNERSHIP: communication during the incident, and follow-through after it, not just the technical root cause.",
    sections: [
      {
        heading: "During the incident — communication is part of ownership",
        points: [
          {
            title: "Who you kept informed, and how, while still actively debugging",
            detail:
              "Owning an incident includes proactively communicating status to stakeholders (even a simple 'still investigating, next update in 15 minutes' beats silence) while the technical work continues — a strong answer names this explicitly, since 'went dark while debugging' is a common real failure mode interviewers are listening for.",
          },
        ],
      },
      {
        heading: "After the incident — this is the part that shows real ownership",
        points: [
          {
            title: "A blameless postmortem, with concrete prevention items that actually got done",
            detail:
              "Describe the postmortem process (blameless — focused on systemic causes, not individual blame) and specifically name at least one concrete follow-up item that came out of it and was actually completed afterward — a monitoring gap closed, a runbook written, a dangerous manual step automated. An incident story that ends at 'we fixed it and moved on' without this half is missing the ownership signal entirely.",
          },
        ],
      },
    ],
    closingTip: "If the incident was partly caused by a decision you made, say so directly rather than deflecting to 'the system' — owning your own contribution to root cause, not just the fix, is what this question is really probing for at a lead level.",
  },
  {
    slug: "behavioral-influence-without-authority",
    question: "Describe a time you had to drive a technical initiative across teams without formal authority over them.",
    category: "Behavioral",
    round: "general",
    summary:
      "The strongest answers show you built a case other teams actually wanted to act on (data, a clear shared win, addressing their specific concerns) rather than relying on escalation or a mandate from above.",
    intro: "A lead role frequently means getting other teams to do something without being their manager — the strongest answers show genuine persuasion and alignment-building, not 'I got my manager to tell their manager'.",
    sections: [
      {
        heading: "What actually moved other teams to act",
        points: [
          {
            title: "A concrete shared win, not just 'this is the right thing to do'",
            detail:
              "The strongest version of this story identifies something the OTHER team actually cared about and frames the initiative around that — not just 'this is architecturally correct' (true, but rarely motivating to a team with its own competing priorities). Naming a specific concern another team raised, and how you addressed it directly, is what shows real influence skill.",
          },
          {
            title: "Escalating as a last resort, not a first move",
            detail:
              "If escalation to management was eventually needed, frame it as what happened AFTER genuine peer-level persuasion didn't land — leading with 'I escalated to their manager' as the primary strategy reads as a lack of influence skill, not a demonstration of it.",
          },
        ],
      },
    ],
    closingTip: "Close with a measurable outcome the cross-team effort actually produced — a metric that improved, a system that got adopted, a migration that completed — concrete proof the influence actually worked, not just that the conversation was pleasant.",
  },
  {
    slug: "behavioral-saying-no-to-stakeholder",
    question: "Tell me about a time you had to push back on a stakeholder's request or timeline.",
    category: "Behavioral",
    round: "general",
    summary:
      "The strongest answers show you pushed back WITH an alternative (a smaller scope, a different timeline, a phased approach) rather than a flat no — and that you explained the actual tradeoff in terms the stakeholder cared about, not just engineering concerns.",
    intro: "Interviewers are checking whether you can say no constructively — a story that's just 'I refused and they backed down' misses the actual skill being tested.",
    sections: [
      {
        heading: "Pushing back with an alternative, not just a refusal",
        points: [
          {
            title: "Translate the technical constraint into the stakeholder's own terms",
            detail:
              "'We can't hit that date safely' lands very differently than 'shipping by that date means skipping load testing, which means real risk of an outage during your own launch traffic spike' — the second version translates a technical constraint into a consequence the stakeholder actually cares about, which is what makes pushback land as collaborative rather than obstructive.",
          },
          {
            title: "Offer a real alternative, not just a rejection",
            detail:
              "A phased rollout, a reduced initial scope, an extra two weeks with a clear reason — showing you tried to find a path that worked for both sides is the detail that distinguishes 'pushed back constructively' from 'said no'.",
          },
        ],
      },
    ],
    closingTip: "If the stakeholder relationship stayed strong afterward (they came back to you for the next project), say so explicitly — it's concrete evidence the pushback was handled well, not just technically correct.",
  },
  {
    slug: "behavioral-technical-decision-with-incomplete-information",
    question: "Describe a significant technical decision you had to make with incomplete information.",
    category: "Behavioral",
    round: "general",
    summary:
      "The strongest answers name what information was actually missing, how you bounded the risk of being wrong anyway (a reversible choice, a smaller bet, a defined checkpoint to revisit), and how it actually turned out.",
    intro: "This tests judgment under uncertainty specifically — a strong answer doesn't pretend the decision was obviously correct in hindsight, it shows how you managed the uncertainty itself.",
    sections: [
      {
        heading: "Name the actual uncertainty, not just 'it was a hard decision'",
        points: [
          {
            title: "What specifically was unknown, and why you couldn't just go find out",
            detail:
              "Unknown future scale, an unproven third-party API's real reliability, unclear long-term product direction — naming the SPECIFIC uncertainty (and why gathering more information wasn't a realistic option given the timeline) grounds the story in something real rather than vague difficulty.",
          },
        ],
      },
      {
        heading: "How you bounded the risk of being wrong",
        points: [
          {
            title: "Reversibility, a smaller initial bet, or an explicit revisit point",
            detail:
              "The strongest answers show a deliberate strategy for being wrong safely — choosing the more easily reversible of two options, shipping a smaller version first to get real signal, or setting an explicit date/metric to revisit the decision rather than treating it as permanent. This is the part that shows judgment, not just decisiveness.",
          },
        ],
      },
    ],
    closingTip: "Being honest that a decision turned out to be wrong (and what you learned about managing that class of uncertainty going forward) is often a STRONGER answer than a story where everything worked out — it shows real reflection, not just a lucky outcome retold as skill.",
  },
];
