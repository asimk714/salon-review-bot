// ── Regression test dataset ─────────────────────────────────────────────────
// 15 cases covering the full range of ratings, visit types, with/without
// staff name, minimal/detailed context, positive/negative/mixed experiences.
//
// Each case documents what a CORRECT AI response should look like.
// These expectations are used by the evaluator (evaluator.ts) for deterministic
// checks, and by the live runner (live-runner.ts) when live AI output is available.

export interface TestCase {
  id: string;
  name: string;
  rating: number;
  visitType: string;
  stoodOut: string;
  tellOthers: string;
  staffName: string;
  context: string;
  // What a faithful response should do
  expectedSentiment: "strongly positive" | "positive" | "mixed" | "negative" | "strongly negative";
  mustNotContain: string[]; // substrings the response must NOT include
  shouldMention: string[]; // substrings the response SHOULD include
  description: string;
}

export const TEST_CASES: TestCase[] = [
  // ── 5-star: positive, with staff, detailed context ──────────────────────
  {
    id: "c01",
    name: "5-star haircut, named stylist, returning customer",
    rating: 5,
    visitType: "Haircut",
    stoodOut: "Priya listened carefully to the look I wanted and nailed it on the first try. The finish looked natural, not over-styled.",
    tellOthers: "If you're going, book ahead and ask for Priya. Worth the time.",
    staffName: "Priya",
    context: "I've been coming to this salon for two years.",
    expectedSentiment: "strongly positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Priya", "Haircut"],
    description: "Positive experience, named staff, long-term context. Review should mention Priya naturally and never invent a price or wait time.",
  },

  // ── 5-star: positive, no staff name ──────────────────────────────────────
  {
    id: "c02",
    name: "5-star hair color, no staff name",
    rating: 5,
    visitType: "Hair Color",
    stoodOut: "The color came out exactly as shown in the consultation. My hair felt healthy afterwards, not damaged.",
    tellOthers: "Great for color that needs to look natural. They take time with the consultation.",
    staffName: "",
    context: "",
    expectedSentiment: "strongly positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "Priya", "Meena",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Hair Color"],
    description: "No staff name provided — the AI must NOT invent one. Should refer to 'the team' or 'the stylist' generically if a person is mentioned.",
  },

  // ── 4-star: positive, minimal context ───────────────────────────────────
  {
    id: "c03",
    name: "4-star facial, minimal input",
    rating: 4,
    visitType: "Facial / Cleanup",
    stoodOut: "My skin felt clean and calm afterwards. The aesthetician was gentle.",
    tellOthers: "Good for a basic cleanup. Book on a weekday if you can.",
    staffName: "",
    context: "",
    expectedSentiment: "positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Facial"],
    description: "Positive but not 5-star. No staff name, no context. Minimal input — AI should not pad with invented details.",
  },

  // ── 3-star: mixed, with context ──────────────────────────────────────────
  {
    id: "c04",
    name: "3-star manicure, mixed experience, with context",
    rating: 3,
    visitType: "Manicure / Pedicure",
    stoodOut: "The polish looked nice at first, but the cuticles were a bit rough and it lasted only a week.",
    tellOthers: "The look is fine but the finish isn't consistent. Manage your expectations.",
    staffName: "Meena",
    context: "First time visiting this branch.",
    expectedSentiment: "mixed",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "other customer",
    ],
    shouldMention: ["Meena", "Manicure"],
    description: "Mixed experience — some good, some not. AI should sound balanced, not like a disguised 5-star or 1-star. Must preserve the rating.",
  },

  // ── 2-star: negative, no staff ───────────────────────────────────────────
  {
    id: "c05",
    name: "2-star keratin smoothing, disappointed, no staff",
    rating: 2,
    visitType: "Keratin / Smoothing",
    stoodOut: "The treatment didn't last more than a few days and my hair felt dry afterwards.",
    tellOthers: "I wouldn't recommend this service here. Ask to see results on other clients first.",
    staffName: "",
    context: "",
    expectedSentiment: "negative",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "great experience", "loved it",
    ],
    shouldMention: ["Keratin"],
    description: "Disappointing experience. AI should sound genuinely disappointed but fair — not abusive, not fixed to sound positive.",
  },

  // ── 1-star: strongly negative, with staff ────────────────────────────────
  {
    id: "c06",
    name: "1-star styling/makeover, strongly negative, named staff",
    rating: 1,
    visitType: "Styling / Makeover",
    stoodOut: "The stylist ignored what I asked for and gave me a cut I didn't want. I left unhappy.",
    tellOthers: "Be very specific about what you want and consider a second opinion. Not the right place for a makeover if you have a clear idea.",
    staffName: "Anita",
    context: "I booked specifically for a makeover for an event.",
    expectedSentiment: "strongly negative",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "great", "loved", "excellent",
    ],
    shouldMention: ["Anita", "Styling"],
    description: "Strongly negative. AI must preserve the 1-star rating and not soften it. Must mention Anita naturally but not invent extras.",
  },

  // ── 4-star: positive, makeup, detailed context ───────────────────────────
  {
    id: "c07",
    name: "4-star makeup, detailed context, no staff",
    rating: 4,
    visitType: "Makeup",
    stoodOut: "The makeup lasted through a full day of events and looked natural in photos. The artist paid attention to the occasion.",
    tellOthers: "Good for event makeup. Let them know the occasion and how long it needs to last.",
    staffName: "",
    context: "I needed it for a wedding where I'd be photographed all day.",
    expectedSentiment: "positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Makeup", "wedding"],
    description: "Positive, detailed context about the occasion. AI should weave in the wedding context naturally.",
  },

  // ── 3-star: mixed, hair color, with staff ────────────────────────────────
  {
    id: "c08",
    name: "3-star hair color, mixed, named staff",
    rating: 3,
    visitType: "Hair Color",
    stoodOut: "The color shade was right but the process took much longer than I expected and my scalp felt irritated for a day.",
    tellOthers: "The color itself is good but the experience was uncomfortable. Ask about the timeline before booking.",
    staffName: "Rohini",
    context: "",
    expectedSentiment: "mixed",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "other customer",
    ],
    shouldMention: ["Rohini", "Hair Color"],
    description: "Mixed: color was right, but the process was long and uncomfortable. AI should reflect both sides.",
  },

  // ── 5-star: positive, pedicure, minimal ──────────────────────────────────
  {
    id: "c09",
    name: "5-star pedicure, minimal, no staff",
    rating: 5,
    visitType: "Manicure / Pedicure",
    stoodOut: "Clean, relaxing, and the nails looked great. Felt like a proper break.",
    tellOthers: "Simple and effective. Worth it for a reset.",
    staffName: "",
    context: "",
    expectedSentiment: "strongly positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Pedicure"],
    description: "Short, positive, minimal input. AI should not pad with invented specifics.",
  },

  // ── 2-star: negative, facial, with staff, context ────────────────────────
  {
    id: "c10",
    name: "2-star facial, negative, named staff, with context",
    rating: 2,
    visitType: "Facial / Cleanup",
    stoodOut: "My skin broke out badly a day after the facial and the products used felt too strong for my skin type.",
    tellOthers: "Not suitable if you have sensitive skin. Ask what products they'll use first.",
    staffName: "Divya",
    context: "I have sensitive skin and didn't mention it clearly.",
    expectedSentiment: "negative",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "great", "loved",
    ],
    shouldMention: ["Divya", "Facial", "sensitive skin"],
    description: "Negative experience with a named staff member and context about sensitive skin. AI should reflect the issue honestly.",
  },

  // ── 4-star: positive, haircut, minimal ───────────────────────────────────
  {
    id: "c11",
    name: "4-star haircut, positive, minimal, no staff",
    rating: 4,
    visitType: "Haircut",
    stoodOut: "Clean cut, good shape, and the stylist didn't push extra services.",
    tellOthers: "Straightforward and honest. Good for a basic haircut.",
    staffName: "",
    context: "",
    expectedSentiment: "positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "other customer",
    ],
    shouldMention: ["Haircut"],
    description: "Positive but not over-the-top. No invented prices or extras.",
  },

  // ── 1-star: strongly negative, hair color, no staff ──────────────────────
  {
    id: "c12",
    name: "1-star hair color, strongly negative, no staff",
    rating: 1,
    visitType: "Hair Color",
    stoodOut: "The color turned out completely wrong — nothing like what we discussed. I had to correct it myself.",
    tellOthers: "Don't trust the consultation blindly. Agree on a clear reference and check before they start.",
    staffName: "",
    context: "",
    expectedSentiment: "strongly negative",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "great", "loved", "excellent",
    ],
    shouldMention: ["Hair Color"],
    description: "Strongly negative, no staff name. AI must not invent a person and must preserve the 1-star sentiment.",
  },

  // ── 3-star: mixed, styling/makeover, with staff, detailed context ───────
  {
    id: "c13",
    name: "3-star styling/makeover, mixed, named staff, detailed context",
    rating: 3,
    visitType: "Styling / Makeover",
    stoodOut: "The look they created was actually good, but it wasn't what I asked for and I felt rushed at the end.",
    tellOthers: "The team can do good work, but be clear about what you want and how much time you have.",
    staffName: "Kavita",
    context: "I had a tight deadline for an event and didn't feel heard on the style.",
    expectedSentiment: "mixed",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "other customer",
    ],
    shouldMention: ["Kavita", "Styling", "event"],
    description: "Mixed: good result but poor communication and rushed. AI should balance both.",
  },

  // ── 5-star: positive, keratin, with staff, context ───────────────────────
  {
    id: "c14",
    name: "5-star keratin, positive, named staff, with context",
    rating: 5,
    visitType: "Keratin / Smoothing",
    stoodOut: "My hair stayed smooth for weeks and looked healthy. Kavita explained the aftercare clearly.",
    tellOthers: "Good results if you follow the aftercare. Worth the time and the cost.",
    staffName: "Kavita",
    context: "I have frizzy hair and this was my first keratin treatment.",
    expectedSentiment: "strongly positive",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "cheap", "free", "other customer",
    ],
    shouldMention: ["Kavita", "Keratin", "frizzy"],
    description: "Positive with named staff and context about first-time keratin. AI should mention the aftercare naturally.",
  },

  // ── 2-star: negative, manicure/pedicure, no staff, minimal ──────────────
  {
    id: "c15",
    name: "2-star manicure, negative, minimal, no staff",
    rating: 2,
    visitType: "Manicure / Pedicure",
    stoodOut: "The nail polish chipped within two days and the edges were uneven.",
    tellOthers: "The finish isn't reliable. Check the edges before you leave.",
    staffName: "",
    context: "",
    expectedSentiment: "negative",
    mustNotContain: [
      "Rs.", "₹", "price", "cost", "wait", "minute", "discount",
      "best in", "best salon", "amazing", "wonderful", "perfect",
      "great", "loved",
    ],
    shouldMention: ["Manicure"],
    description: "Negative, minimal input, no staff. AI should not pad or soften the disappointment.",
  },
];
