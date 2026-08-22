export interface RelatedLink {
  href: string;
  label: string;
}

export interface AnswerPoint {
  title: string;
  detail: string;
  /** Rendered with syntax highlighting when present. */
  code?: string;
  codeLanguage?: string;
  /** Clickable link to a real page within this app. */
  relatedLink?: RelatedLink;
  /** Plain-text pointer to a source file in this repo — not a hyperlink. */
  sourceRef?: string;
}

export interface AnswerSection {
  heading: string;
  points: AnswerPoint[];
}

export interface InterviewQuestion {
  slug: string;
  question: string;
  category: string;
  /** Groups the question under a round on the list/home pages. Omit for ungrouped/general questions. */
  round?: string;
  summary: string;
  intro: string;
  sections: AnswerSection[];
  closingTip: string;
}
