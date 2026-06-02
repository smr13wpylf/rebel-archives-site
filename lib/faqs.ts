/**
 * FAQ content for the Work With Me page.
 * Edit or extend freely; rendered as an accessible accordion.
 */
export type FAQ = {
  question: string;
  answer: string;
};

export const workFaqs: FAQ[] = [
  {
    question: "Is this therapy?",
    answer:
      "No. This is interpretive and advisory work — closer to working with a thoughtful editor or a well-read advisor than a clinician. If you're navigating acute mental-health concerns, therapy is the right room, and I'm glad to work alongside it rather than in place of it.",
  },
  {
    question: "Do I need to know anything about astrology or human design?",
    answer:
      "Not at all. These are tools I read so you don't have to. You'll get the substance translated into plain language — patterns, tensions, and tendencies you can recognize in your own life — without the jargon.",
  },
  {
    question: "How is this different from coaching?",
    answer:
      "Most coaching is oriented toward goals and accountability. This work is oriented toward clarity and meaning. I'm less interested in helping you optimize and more interested in helping you understand what's actually happening, so the choices you make are yours.",
  },
  {
    question: "What if I'm not sure I'm a fit?",
    answer:
      "Then say so. Discernment runs both ways. Every engagement begins with a short inquiry, and if I think someone else would serve you better, I'll tell you. Good work depends on the right room.",
  },
  {
    question: "What do I actually leave with?",
    answer:
      "Usually a sharper question, a recording, and a written summary you can return to. Sometimes a decision feels closer; sometimes the relief is simply having accurate language for what you're living. I don't promise transformation — I offer attention, structure, and honesty.",
  },
];
