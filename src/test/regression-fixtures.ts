// Regression test dataset for the salon review AI.
//
// Each case is a realistic user input. The expected fields describe what
// a correct AI response MUST do. These are checked by the deterministic
// tests below AND can be used to evaluate live AI output when a key is
// available.

export interface TestCase {
  id: string;
  input: Record<string, string | number>;
  expect: {
    ratingPreserved: boolean;
    sentimentMustMatch: "positive" | "mixed" | "negative" | "disappointed";
    mustNotInvent: string[];
    mustIncludeVisitType: boolean;
    mustBeValidJson: true;
    shortLength: { minSentences: number; maxSentences: number };
    detailedLength: { minSentences: number; maxSentences: number };
  };
  description: string;
}

export const TEST_CASES: TestCase[] = [
  // ── 5-star, positive ────────────────────────────────────────────────────
  {
    id: "five-star-haircut-with-staff",
    input: {
      rating: 5,
      visitType: "Haircut",
      stoodOut: "The stylist listened carefully to what I wanted and the finish looked natural.",
      tellOthers: "Worth the price for the quality. Good if you want a clean, polished look.",
      staffName: "Priya",
      context: "First time visiting this branch.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific product name", "other staff members", "duration"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "5-star haircut, staff named, minimal context.",
  },
  {
    id: "five-star-hair-color-no-staff",
    input: {
      rating: 5,
      visitType: "Hair Color",
      stoodOut: "The color turned out exactly as shown in the consultation photos.",
      tellOthers: "Book a consultation first — it makes a big difference.",
      staffName: "",
      context: "I've been coming here for 2 years.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "other staff members"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "5-star hair color, no staff name, customer has history.",
  },
  {
    id: "five-star-facial-optional-fields-empty",
    input: {
      rating: 5,
      visitType: "Facial / Cleanup",
      stoodOut: "My skin felt noticeably better immediately after.",
      tellOthers: "Good for a quick reset before an event.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "product used", "duration", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "5-star facial, only required fields filled.",
  },
  // ── 4-star ───────────────────────────────────────────────────────────────
  {
    id: "four-star-manicure",
    input: {
      rating: 4,
      visitType: "Manicure / Pedicure",
      stoodOut: "The finish was neat and the ambiance was calm.",
      tellOthers: "Good spot for a relaxing break. Slightly busy on weekends.",
      staffName: "Anjali",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific product", "duration", "other staff"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "4-star manicure, staff named, no extra context.",
  },
  // ── 3-star, mixed ────────────────────────────────────────────────────────
  {
    id: "three-star-haircut-mixed",
    input: {
      rating: 3,
      visitType: "Haircut",
      stoodOut: "The cut itself was decent but the finishing was rushed.",
      tellOthers: "Fine for a basic haircut. Not the place for a detailed style.",
      staffName: "",
      context: "Went on a Saturday afternoon.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "mixed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "3-star haircut, mixed — decent cut, rushed finish.",
  },
  {
    id: "three-star-hair-color-disappointed-but-fair",
    input: {
      rating: 3,
      visitType: "Hair Color",
      stoodOut: "The color faded faster than expected.",
      tellOthers: "Ask how long the color is supposed to last before booking.",
      staffName: "Meena",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "mixed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "product used", "duration"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "3-star color, named staff, color faded too fast.",
  },
  {
    id: "three-star-facial-meh",
    input: {
      rating: 3,
      visitType: "Facial / Cleanup",
      stoodOut: "It was okay but nothing special. My skin felt clean afterward.",
      tellOthers: "Not bad, not great. Fine if you just want a basic cleanup.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "mixed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "product used", "duration", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "3-star facial, lukewarm, no frills.",
  },
  {
    id: "three-star-mixed-with-staff",
    input: {
      rating: 3,
      visitType: "Hair Color",
      stoodOut: "The color looked good at first but faded unevenly after a week.",
      tellOthers: "The color doesn't last as long as they said it would.",
      staffName: "Pooja",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "mixed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "product used", "duration", "what they said"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "3-star color, uneven fade, staff named.",
  },
  // ── 2-star, disappointed ─────────────────────────────────────────────────
  {
    id: "two-star-haircut-disappointed",
    input: {
      rating: 2,
      visitType: "Haircut",
      stoodOut: "The shape didn't match what I asked for and had to be fixed.",
      tellOthers: "Be very specific with photos if you want a particular style.",
      staffName: "",
      context: "First time here.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services", "manager"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "2-star haircut, disappointed, no staff name.",
  },
  {
    id: "two-star-coloring-issues",
    input: {
      rating: 2,
      visitType: "Hair Color",
      stoodOut: "The result was uneven and looked nothing like the reference image.",
      tellOthers: "Bring your own reference photo and double-check the tone.",
      staffName: "Ritu",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "product used", "duration", "complaint resolution"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "2-star coloring, uneven result, staff named.",
  },
  {
    id: "two-star-awkward-experience",
    input: {
      rating: 2,
      visitType: "Haircut",
      stoodOut: "The atmosphere felt uncomfortable and the service felt rushed.",
      tellOthers: "I wouldn't rush here. There are better options nearby.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "2-star haircut, uncomfortable atmosphere, rushed.",
  },
  // ── 1-star, poor ─────────────────────────────────────────────────────────
  {
    id: "one-star-bad-experience",
    input: {
      rating: 1,
      visitType: "Haircut",
      stoodOut: "The stylist didn't listen and cut it far shorter than asked.",
      tellOthers: "Not the place if you want a specific length or style.",
      staffName: "",
      context: "I was very clear about what I wanted.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services", "manager", "refund", "complaint outcome"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "1-star haircut, poor, very clear about what went wrong.",
  },
  {
    id: "one-star-color-disaster",
    input: {
      rating: 1,
      visitType: "Hair Color",
      stoodOut: "The color came out unevenly with visible patches.",
      tellOthers: "Avoid if you need an all-over color that looks even.",
      staffName: "Kavya",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "product used", "duration", "remedy offered"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "1-star color, patches, staff named.",
  },
  {
    id: "one-star-strong-dissatisfaction",
    input: {
      rating: 1,
      visitType: "Hair Color",
      stoodOut: "I was not happy with the result at all and felt ignored.",
      tellOthers: "Go elsewhere. I would not recommend this service.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services", "manager", "refund", "complaint outcome"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "1-star color, strong dissatisfaction, felt ignored.",
  },
  {
    id: "one-star-no-detail-given",
    input: {
      rating: 1,
      visitType: "Haircut",
      stoodOut: "I was not happy with the service.",
      tellOthers: "I would not recommend this place.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "disappointed",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "duration", "other services", "manager", "refund", "complaint outcome", "product", "reason"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "1-star haircut, bare minimum input — AI should not invent a reason.",
  },
  // ── Additional coverage ───────────────────────────────────────────────────
  {
    id: "five-star-keratin",
    input: {
      rating: 5,
      visitType: "Keratin / Smoothing",
      stoodOut: "My hair felt much smoother and easier to manage afterward.",
      tellOthers: "Good if you struggle with frizz. Results lasted a while.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "product used", "duration", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "5-star keratin treatment, no staff, no context.",
  },
  {
    id: "four-star-makeover",
    input: {
      rating: 4,
      visitType: "Styling / Makeover",
      stoodOut: "They gave me a look I felt confident in immediately.",
      tellOthers: "Great for someone trying a new style. Ask for a consultation.",
      staffName: "Sneha",
      context: "It was for a family event.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "duration", "specific products", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "4-star styling/makeover, staff named, event context.",
  },
  {
    id: "five-star-pedicure-relaxed",
    input: {
      rating: 5,
      visitType: "Manicure / Pedicure",
      stoodOut: "Very relaxing and the result looked neat.",
      tellOthers: "Nice way to spend an hour. Worth it for the relaxation alone.",
      staffName: "",
      context: "",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "specific staff name", "product used", "duration", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "5-star pedicure, relaxed, minimal input.",
  },
  {
    id: "four-star-makeup-event",
    input: {
      rating: 4,
      visitType: "Makeup",
      stoodOut: "My makeup looked great for the wedding and lasted all day.",
      tellOthers: "Good for special occasions. Book early.",
      staffName: "Divya",
      context: "It was for my sister's wedding.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "duration", "specific products", "other patrons"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "4-star makeup for wedding, staff named, event context.",
  },
  {
    id: "four-star-detailed-context",
    input: {
      rating: 4,
      visitType: "Haircut",
      stoodOut: "The stylist gave great advice on how to maintain the style at home.",
      tellOthers: "Good if you want a low-maintenance style that still looks polished.",
      staffName: "Riya",
      context: "I've been a customer for 3 years and have always had good experiences here.",
    },
    expect: {
      ratingPreserved: true,
      sentimentMustMatch: "positive",
      mustNotInvent: ["price", "wait time", "discount", "other customers", "other staff", "duration", "specific products", "other patrons", "specific year", "other visits"],
      mustIncludeVisitType: true,
      mustBeValidJson: true,
      shortLength: { minSentences: 1, maxSentences: 2 },
      detailedLength: { minSentences: 3, maxSentences: 5 },
    },
    description: "4-star haircut, detailed context, long-term customer.",
  },
];

// ── Scoring helpers ──────────────────────────────────────────────────────────

export function countSentences(text: string): number {
  if (!text.trim()) return 0;
  const s = text.trim().replace(/\s+/g, " ");
  const parts = s.split(/(?<=[.!?])\s+/);
  return parts.filter((p) => p.trim().length > 0).length;
}

export function scoreResponse(
  tc: TestCase,
  response: { short: string; detailed: string }
): {
  caseId: string;
  passed: boolean;
  checks: { name: string; passed: boolean; detail: string }[];
  shortSentences: number;
  detailedSentences: number;
} {
  const checks: { name: string; passed: boolean; detail: string }[] = [];
  const shortSentences = countSentences(response.short);
  const detailedSentences = countSentences(response.detailed);

  // 1. Valid JSON
  checks.push({ name: "validJSON", passed: true, detail: "Caller parsed before scoring." });

  // 2. Short length
  const shortLen = shortSentences >= tc.expect.shortLength.minSentences &&
    shortSentences <= tc.expect.shortLength.maxSentences;
  checks.push({
    name: "shortLength",
    passed: shortLen,
    detail: `${shortSentences} sentences (expected ${tc.expect.shortLength.minSentences}-${tc.expect.shortLength.maxSentences})`,
  });

  // 3. Detailed length
  const detailedLen = detailedSentences >= tc.expect.detailedLength.minSentences &&
    detailedSentences <= tc.expect.detailedLength.maxSentences;
  checks.push({
    name: "detailedLength",
    passed: detailedLen,
    detail: `${detailedSentences} sentences (expected ${tc.expect.detailedLength.minSentences}-${tc.expect.detailedLength.maxSentences})`,
  });

  // 4. Rating consistency
  const combined = (response.short + " " + response.detailed).toLowerCase();
  const ratingOk = checkRatingConsistency(tc, combined);
  checks.push({ name: "ratingConsistent", passed: ratingOk.passed, detail: ratingOk.detail });

  // 5. No invented facts
  const invented = findInventedFacts(tc, response);
  checks.push({
    name: "noInventedFacts",
    passed: invented.length === 0,
    detail: invented.length === 0 ? "No invented facts detected" : `Possible inventions: ${invented.join(", ")}`,
  });

  // 6. Visit type included
  const visitTypeLower = tc.input.visitType.toLowerCase();
  const vtInShort = response.short.toLowerCase().includes(visitTypeLower);
  const vtInDetailed = response.detailed.toLowerCase().includes(visitTypeLower);
  const vtOk = tc.expect.mustIncludeVisitType ? (vtInShort || vtInDetailed) : true;
  checks.push({
    name: "visitTypeReferenced",
    passed: vtOk,
    detail: vtInShort ? "mentioned in short" : vtInDetailed ? "mentioned in detailed" : "NOT mentioned (required)",
  });

  // 7. Not promotional
  const promotional = isPromotional(combined);
  checks.push({ name: "notPromotional", passed: !promotional.passed, detail: promotional.detail });

  // 8. Staff name checks
  const staffName = tc.input.staffName;
  if (!staffName || staffName.trim() === "") {
    const inventedStaff = detectInventedStaff({ short: response.short, detailed: response.detailed });
    checks.push({ name: "noInventedStaff", passed: inventedStaff.passed, detail: inventedStaff.detail });
  } else {
    const extraStaff = detectExtraStaff(tc, response);
    checks.push({ name: "noExtraStaffInvented", passed: extraStaff.passed, detail: extraStaff.detail });
  }

  const allPassed = checks.every((c) => c.passed);
  return { caseId: tc.id, passed: allPassed, checks, shortSentences, detailedSentences };
}

// ── Internal heuristics ──────────────────────────────────────────────────────

function checkRatingConsistency(tc: TestCase, text: string): { passed: boolean; detail: string } {
  const r = tc.input.rating as number;

  if (r >= 4) {
    const positiveWords = ["great", "good", "nice", "happy", "satisfied", " pleased",
      "love", "liked", "excellent", "wonderful", "amazing", "fantastic", "recommend", "worth"];
    if (!positiveWords.some((w) => text.includes(w))) {
      return { passed: false, detail: "5/4-star review lacks positive sentiment words" };
    }
    const strongNegatives = ["terrible", "awful", "horrible", "worst", "disaster", "hate", "angry", "furious"];
    if (strongNegatives.some((w) => text.includes(w))) {
      return { passed: false, detail: `Positive rating but contains strong negative language: ${strongNegatives.filter((w) => text.includes(w)).join(", ")}` };
    }
    return { passed: true, detail: "Positive rating matches positive sentiment" };
  }

  if (r === 3) {
    const neutralWords = ["okay", "fine", "decent", "average", "not bad", "not great",
      "expected", "acceptable", "fair", "mixed", "meh"];
    const hasNeutral = neutralWords.some((w) => text.includes(w));
    const hasBut = text.includes("but");
    if (!hasNeutral && !hasBut) {
      return { passed: false, detail: "3-star review should sound mixed/neutral, not purely positive" };
    }
    const strongNegatives = ["terrible", "awful", "horrible", "worst", "disaster"];
    if (strongNegatives.some((w) => text.includes(w))) {
      return { passed: false, detail: "3-star review contains language too negative for a 3" };
    }
    return { passed: true, detail: "3-star review has mixed/neutral tone" };
  }

  if (r <= 2) {
    const strongPositives = ["amazing", "fantastic", "perfect", "wonderful", "excellent",
      "great experience", "best", "love it"];
    if (strongPositives.some((w) => text.includes(w))) {
      return { passed: false, detail: `Negative rating (${r}) but contains positive language: ${strongPositives.filter((w) => text.includes(w)).join(", ")}` };
    }
    const negWords = ["disappointed", " unhappy", "not happy", "didn't like",
      "unfortunately", "problem", "issue", "not as expected", "worse",
      "poor", "bad", "wrong", "unacceptable", "not recommend"];
    if (!negWords.some((w) => text.includes(w))) {
      return { passed: false, detail: `Rating ${r} but review doesn't express disappointment — may have been sanitized to positive` };
    }
    return { passed: true, detail: `Rating ${r} matches negative/disappointed tone` };
  }

  return { passed: true, detail: "Rating consistency check passed" };
}

function findInventedFacts(tc: TestCase, response: { short: string; detailed: string }) {
  const combined = (response.short + " " + response.detailed).toLowerCase();
  const inventions: string[] = [];

  if (/₹|\$|€|rs\.?\s*\d+|[0-9]+\s*(rupee| inr)/i.test(combined)) {
    inventions.push("price/currency mentioned");
  }

  if (/\b\d+\s*(minute|minutes|hour|hours|hr|hrs|min|mins)\b/i.test(combined)) {
    inventions.push("wait time/duration mentioned");
  }

  if (/\b(discount|offer|deal|coupon|free|save|savings|percent|% off)\b/i.test(combined)) {
    inventions.push("discount/offer mentioned");
  }

  if (/\b(other customer|other patron|another person|people around|everyone there|the place was full|crowded|waiting area|queue)\b/i.test(combined)) {
    inventions.push("other people/customers mentioned");
  }

  if (/\b(kerastase|olaplex|redken|l'oreal|nyx|maybelline|revlon|clinic|spa treatment|aroma|herbals|organic|ayurvedic|ayurveda)\b/i.test(combined)) {
    inventions.push("specific product/brand mentioned");
  }

  if (!tc.input.staffName || tc.input.staffName.trim() === "") {
    const inventedStaff = detectInventedStaff({ short: response.short, detailed: response.detailed });
    if (!inventedStaff.passed) inventions.push("staff name may be invented");
  }

  return inventions;
}

const COMMON_INDIAN_NAMES = new Set([
  "priya", "anjali", "meena", "ritu", "kavya", "sneha", "divya",
  "anju", "preeti", "nidhi", "shreya", "tanvi", "karishma", "shilpa",
  "rani", "lakshmi", "parvati", "sarita", "gita", "meera", "kiran",
  "ritika", "simran", "jasmine", "celina", "deepika",
]);

function detectInventedStaff(response: { short: string; detailed: string }): { passed: boolean; detail: string } {
  const combined = response.short + " " + response.detailed;
  const patterns = [
    /\bstylist\s+([A-Z][a-z]+)/i,
    /\bstaff\s+member\s+([A-Z][a-z]+)/i,
    /\bthe\s+([A-Z][a-z]+)\s+(stylist|staff|team)/i,
  ];

  for (const pat of patterns) {
    const m = combined.match(pat);
    if (m && COMMON_INDIAN_NAMES.has(m[1].toLowerCase())) {
      return { passed: false, detail: `Possible invented staff name: "${m[1]}" — review manually` };
    }
  }
  return { passed: true, detail: "No obvious invented staff name detected" };
}

function detectExtraStaff(tc: TestCase, response: { short: string; detailed: string }): { passed: boolean; detail: string } {
  const providedName = (tc.input.staffName || "").toLowerCase();
  const combined = response.short + " " + response.detailed;
  const allNames = detectAllNames(combined);
  const extraNames = allNames.filter((n) => n !== providedName);

  if (extraNames.length > 0) {
    return { passed: false, detail: `Additional staff names detected beyond input: ${extraNames.join(", ")}` };
  }
  return { passed: true, detail: "No extra staff names detected" };
}

function detectAllNames(text: string): string[] {
  const names: string[] = [];
  const pat = /(?:stylist|staff|member|team)\s+([A-Z][a-z]+)/gi;
  let m;
  while ((m = pat.exec(text)) !== null) {
    names.push(m[1]);
  }
  return names;
}

function isPromotional(text: string): { passed: boolean; detail: string } {
  const promotionalPhrases = [
    "best in the city", "best in town", "highly recommend", "must visit",
    "don't miss", "should definitely", "must try", "amazing experience",
    "fantastic experience", "wonderful experience", "perfect place",
    "best salon", "top rated", "top notch", "first class", "premium",
    "luxury", "five stars", "world class", "experience of a lifetime",
    "life changing", "transformative", "magical", "dream come true",
    "unforgettable", "absolutely love", "absolutely amazing",
  ];

  const found = promotionalPhrases.filter((p) => text.includes(p));
  if (found.length > 0) {
    return { passed: true, detail: `Promotional language detected: ${found.join(", ")}` };
  }

  const superlatives = ["best", "amazing", "perfect", "fantastic", "wonderful",
    "excellent", "great", "incredible", "outstanding"];
  let count = 0;
  for (const s of superlatives) {
    if (text.includes(s)) count++;
  }
  if (count >= 4) {
    return { passed: true, detail: `Superlative stacking detected: ${count} superlative words found` };
  }

  return { passed: false, detail: "No promotional language detected" };
}
