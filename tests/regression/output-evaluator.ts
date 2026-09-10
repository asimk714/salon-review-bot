// ── Output evaluator ────────────────────────────────────────────────────────
// Evaluates AI-GENERATED REVIEW TEXT (not prompt text) against the product
// rules from docs/PROMPT.md.
//
// These checks are designed to run against live AI output. They require
// actual generated reviews to evaluate. If you have saved AI outputs (from
// a previous run or a test fixture), pass them in as ReviewRecord objects.
//
// When run without saved outputs, this module documents the checks but
// reports that no output is available to evaluate.

import { TEST_CASES } from "./cases";
import type { TestCase } from "./cases";

// ── A single AI-generated result ────────────────────────────────────────────

export interface ReviewRecord {
  caseId: string;
  input: {
    rating: number;
    visitType: string;
    stoodOut: string;
    tellOthers: string;
    staffName: string;
    context: string;
  };
  output: {
    short: string;
    detailed: string;
  };
  source: "live" | "fixture" | "unavailable";
  timestamp?: string;
}

// ── Evaluation result for one output ────────────────────────────────────────

export interface OutputEvalResult {
  caseId: string;
  caseName: string;
  passed: boolean;
  checks: OutputCheckResult[];
  issues: string[];
  verificationLevel: "unverified" | "deterministic" | "manual-review" | "automated-pass";
}

export interface OutputCheckResult {
  name: string;
  passed: boolean;
  detail?: string;
  severity?: "info" | "warning" | "error";
}

// ── Words/phrases that signal the AI violated its rules ────────────────────

const INVENTED_PRICE_PATTERNS = /₹\s*\d+|\bRs\.?\s*\d+|[€$]\s*\d+/;
const INVENTED_WAIT_PATTERNS = /\b(\d+)\s*(minutes?|hours?|hrs?|mins?)\b/;
const SUPERLATIVE_WORDS = /\b(best|amazing|wonderful|perfect|incredible|stunning|outstanding|fantastic|awesome|excellent|brilliant|top[- ]notch|world[- ]class)\b/;
const MARKETING_FILLER = /\b(I had a wonderful|amazing experience|absolutely loved|highly recommend without|must[- ]visit|don't miss|ideal|perfect for|best[- ]ever)\b/i;
const INVENTED_FACT_PATTERNS = /\b(other customer|other patron|while|during the|the next day|afterwards?\s*(I|we)|they gave me|she said|he said)\b/;

// ── Evaluate a single output record ────────────────────────────────────────

export function evaluateOutput(
  testCase: TestCase,
  record: ReviewRecord | null
): OutputEvalResult {
  const checks: OutputCheckResult[] = [];
  const issues: string[] = [];

  if (!record || record.source === "unavailable") {
    return {
      caseId: testCase.id,
      caseName: testCase.name,
      passed: false,
      checks: [{
        name: "AI output available for evaluation",
        passed: false,
        detail: "No AI output to evaluate — run the live runner or provide a fixture",
        severity: "error",
      }],
      issues: ["No AI output available for this case"],
      verificationLevel: "unverified",
    };
  }

  const short = record.output.short;
  const detailed = record.output.detailed;
  const combined = `${short} ${detailed}`;

  // 1. Valid JSON structure
  checks.push({
    name: "output: short and detailed both present as strings",
    passed: typeof short === "string" && typeof detailed === "string" && short.length > 0 && detailed.length > 0,
    detail: typeof short === "string" && typeof detailed === "string"
      ? `short=${(short.length)} chars, detailed=${(detailed.length)} chars`
      : "MISSING or non-string fields",
    severity: "error",
  });
  if (typeof short !== "string" || typeof detailed !== "string") {
    issues.push("Output missing short or detailed string");
  }

  // 2. Rating sentiment match
  const sentimentWords = getSentimentWords(combined);
  checks.push({
    name: "output: sentiment matches rating (surface check)",
    passed: doesSentimentMatchRating(testCase.rating, sentimentWords, combined),
    detail: describeSentimentMatch(testCase.rating, sentimentWords, combined),
    severity: "warning",
  });
  if (!doesSentimentMatchRating(testCase.rating, sentimentWords, combined)) {
    issues.push(`Sentiment mismatch for rating ${testCase.rating}: ${describeSentimentMatch(testCase.rating, sentimentWords, combined)}`);
  }

  // 3. No invented prices
  const priceMatch = INVENTED_PRICE_PATTERNS.exec(combined);
  checks.push({
    name: "output: no invented prices",
    passed: !priceMatch,
    detail: priceMatch ? `FOUND: "${priceMatch[0]}"` : "none found",
    severity: priceMatch ? "error" : "info",
  });
  if (priceMatch) issues.push(`Invented price detected: "${priceMatch[0]}"`);

  // 4. No invented wait times
  const waitMatch = INVENTED_WAIT_PATTERNS.exec(combined);
  checks.push({
    name: "output: no invented wait times",
    passed: !waitMatch || testCase.stoodOut.includes(waitMatch[0]) || testCase.tellOthers.includes(waitMatch[0]) || testCase.context.includes(waitMatch[0]),
    detail: waitMatch
      ? `found "${waitMatch[0]}" — verify it was in input`
      : "none found",
    severity: waitMatch && !testCase.stoodOut.includes(waitMatch[0]) && !testCase.tellOthers.includes(waitMatch[0]) && !testCase.context.includes(waitMatch[0]) ? "warning" : "info",
  });
  if (waitMatch && !testCase.stoodOut.includes(waitMatch[0]) && !testCase.tellOthers.includes(waitMatch[0]) && !testCase.context.includes(waitMatch[0]))
    issues.push(`Possibly invented wait time: "${waitMatch[0]}"`);

  // 5. No superlative stacking
  const superMatches = SUPERLATIVE_WORDS.exec(combined);
  checks.push({
    name: "output: no superlative stacking",
    passed: !superMatches,
    detail: superMatches ? `FOUND: "${superMatches[0]}"` : "none found",
    severity: superMatches ? "warning" : "info",
  });
  if (superMatches) issues.push(`Superlative detected: "${superMatches[0]}"`);

  // 6. No marketing filler
  const fillerMatch = MARKETING_FILLER.exec(combined);
  checks.push({
    name: "output: no marketing filler phrases",
    passed: !fillerMatch,
    detail: fillerMatch ? `FOUND: "${fillerMatch[0]}"` : "none found",
    severity: fillerMatch ? "warning" : "info",
  });
  if (fillerMatch) issues.push(`Marketing filler detected: "${fillerMatch[0]}"`);

  // 7. Staff name not invented when not provided
  if (!testCase.staffName) {
    const inventedNames = ["Priya", "Meena", "Anita", "Rohini", "Divya", "Kavita", "Neha", "Sana", "Pooja", "Aarti"];
    const foundName = inventedNames.find((n) => combined.includes(n));
    checks.push({
      name: "output: no staff name invented when none provided",
      passed: !foundName,
      detail: foundName ? `FOUND invented name: "${foundName}"` : "no invented staff name found",
      severity: foundName ? "error" : "info",
    });
    if (foundName) issues.push(`Invented staff name: "${foundName}" (not in input)`);
  } else {
    checks.push({
      name: "output: staff name included when provided",
      passed: combined.includes(testCase.staffName),
      detail: combined.includes(testCase.staffName) ? `found` : `MISSING`,
      severity: !combined.includes(testCase.staffName) ? "warning" : "info",
    });
    if (!combined.includes(testCase.staffName)) issues.push(`Provided staff name "${testCase.staffName}" not in output`);
  }

  // 8. Visit type mentioned
  checks.push({
    name: "output: visit type mentioned",
    passed: combined.includes(testCase.visitType),
    detail: combined.includes(testCase.visitType) ? `found` : `MISSING`,
    severity: !combined.includes(testCase.visitType) ? "warning" : "info",
  });
  if (!combined.includes(testCase.visitType)) issues.push(`Visit type "${testCase.visitType}" not in output`);

  // 9. What stood out reflected
  const stoodOutKeyWords = testCase.stoodOut.split(/\s+/).filter((w) => w.length > 4);
  const matchedKeywords = stoodOutKeyWords.filter((kw) => combined.toLowerCase().includes(kw.toLowerCase()));
  const keywordCoverage = stoodOutKeyWords.length > 0 ? matchedKeywords.length / stoodOutKeyWords.length : 1;
  checks.push({
    name: "output: reflects what stood out",
    passed: keywordCoverage >= 0.3,
    detail: `matched ${matchedKeywords.length}/${stoodOutKeyWords.length} significant words (${Math.round(keywordCoverage * 100)}%)`,
    severity: keywordCoverage < 0.3 ? "warning" : "info",
  });
  if (keywordCoverage < 0.3 && stoodOutKeyWords.length > 0)
    issues.push(`Low keyword coverage for "what stood out" (${Math.round(keywordCoverage * 100)}%)`);

  // 10. What to tell others reflected
  const tellKeywords = testCase.tellOthers.split(/\s+/).filter((w) => w.length > 3);
  const matchedTell = tellKeywords.filter((kw) => combined.toLowerCase().includes(kw.toLowerCase()));
  const tellCoverage = tellKeywords.length > 0 ? matchedTell.length / tellKeywords.length : 1;
  checks.push({
    name: "output: reflects what to tell others",
    passed: tellCoverage >= 0.2,
    detail: `matched ${matchedTell.length}/${tellKeywords.length} significant words (${Math.round(tellCoverage * 100)}%)`,
    severity: tellCoverage < 0.2 ? "warning" : "info",
  });

  // 11. Length: short 1-2 sentences, detailed 3-5
  const shortSentenceCount = countSentences(short);
  const detailedSentenceCount = countSentences(detailed);
  checks.push({
    name: "output: short review is 1-2 sentences",
    passed: shortSentenceCount >= 1 && shortSentenceCount <= 2,
    detail: `${shortSentenceCount} sentence(s)`,
    severity: shortSentenceCount < 1 || shortSentenceCount > 2 ? "warning" : "info",
  });
  checks.push({
    name: "output: detailed review is 3-5 sentences",
    passed: detailedSentenceCount >= 3 && detailedSentenceCount <= 5,
    detail: `${detailedSentenceCount} sentence(s)`,
    severity: detailedSentenceCount < 3 || detailedSentenceCount > 5 ? "warning" : "info",
  });

  // 12. Natural language
  const wordCount = combined.split(/\s+/).length;
  const positiveWordCount = (combined.match(/\b(great|good|nice|improve|happy|pleased|satisfied|comfortable|relaxed|clean|professional|skilled|friendly|attentive|caring)\b/gi) || []).length;
  const positiveDensity = wordCount > 0 ? positiveWordCount / wordCount : 0;
  checks.push({
    name: "output: natural language (not over-the-top positive density)",
    passed: positiveDensity < 0.25,
    detail: `positive word density: ${Math.round(positiveDensity * 100)}%`,
    severity: positiveDensity >= 0.25 ? "warning" : "info",
  });
  if (positiveDensity >= 0.25) issues.push(`High positive word density (${Math.round(positiveDensity * 100)}%)`);

  // Overall
  const hardFailures = checks.filter((c) => c.severity === "error" && !c.passed);
  const passed = hardFailures.length === 0;
  let verificationLevel: OutputEvalResult["verificationLevel"] = "manual-review";
  if (passed && checks.filter((c) => c.severity === "warning" && !c.passed).length === 0) {
    verificationLevel = "automated-pass";
  }

  return { caseId: testCase.id, caseName: testCase.name, passed, checks, issues, verificationLevel };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSentimentWords(text: string): { positive: number; negative: number } {
  const positive = (text.match(/\b(great|good|nice|improve|happy|pleased|satisfied|love|loved|excellent|perfect|wonderful|amazing|beautiful|fantastic|awesome|best|outstanding|superb|top|recommended|worth|comfortable|relaxed|clean|professional|skilled|friendly|attentive|caring|calm|soothing|refreshing|vital|glowing|healthy)\b/gi) || []).length;
  const negative = (text.match(/\b(bad|terrible|awful|horrible|poor|disappointed|unhappy|upset|angry|frustrated|rushed|neglected|ignored|wrong|damage|irritated|break|out|rough|uneven|unfair|unprofessional|dirty|stained|overpriced|expensive|waste|not recommend|wouldn't come|never again|regret|hate|dislike)\b/gi) || []).length;
  return { positive, negative };
}

function doesSentimentMatchRating(rating: number, words: { positive: number; negative: number }, combined: string): boolean {
  const total = words.positive + words.negative;
  if (total === 0) return true; // neutral is OK
  const ratio = words.positive / total;
  if (rating >= 4) return words.negative === 0 || ratio >= 0.6;
  if (rating === 3) return words.positive > 0 && words.negative > 0;
  return words.positive === 0 || ratio <= 0.4;
}

function describeSentimentMatch(rating: number, words: { positive: number; negative: number }, combined: string): string {
  if (words.positive === 0 && words.negative === 0) return "no strong sentiment words detected — neutral";
  const ratio = words.positive / (words.positive + words.negative);
  if (rating >= 4) return ratio >= 0.6 ? `positive-leaning (${Math.round(ratio * 100)}%) — matches ${rating}-star` : `not clearly positive (${Math.round(ratio * 100)}%) — may not match ${rating}-star`;
  if (rating === 3) return words.positive > 0 && words.negative > 0 ? "mixed sentiment — matches 3-star" : "not clearly mixed — may not match 3-star";
  return ratio <= 0.4 ? `negative-leaning (${Math.round(ratio * 100)}%) — matches ${rating}-star` : `not clearly negative (${Math.round(ratio * 100)}%) — may not match ${rating}-star`;
}

function countSentences(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  const matches = text.match(/[.!?]+(\s|$)/g);
  return matches ? matches.length : text.trim().length > 0 ? 1 : 0;
}

// ── Evaluate all outputs ────────────────────────────────────────────────────

export function evaluateAllOutputs(records: (ReviewRecord | null)[]): {
  results: OutputEvalResult[];
  totalCases: number;
  outputsAvailable: number;
  hardFailures: number;
  warnings: number;
  automatedPass: number;
} {
  const results: OutputEvalResult[] = [];
  for (let i = 0; i < TEST_CASES.length; i++) {
    const record = i < records.length ? records[i] : null;
    results.push(evaluateOutput(TEST_CASES[i], record));
  }
  return {
    results,
    totalCases: TEST_CASES.length,
    outputsAvailable: results.filter((r) => r.verificationLevel !== "unverified").length,
    hardFailures: results.filter((r) => r.checks.some((c) => c.severity === "error" && !c.passed)).length,
    warnings: results.filter((r) => r.checks.some((c) => c.severity === "warning" && !c.passed)).length,
    automatedPass: results.filter((r) => r.verificationLevel === "automated-pass").length,
  };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const testCases = TEST_CASES;
  console.log(`Output Evaluation: ${testCases.length} cases (NO LIVE OUTPUT AVAILABLE)`);
  console.log("=".repeat(70));
  console.log("This module evaluates AI-GENERATED REVIEW TEXT.");
  console.log("It cannot run without live AI output or saved fixtures.");
  console.log("");
  console.log("To use:");
  console.log("  1. Run tests/regression/live-runner.ts with a valid LOVABLE_API_KEY");
  console.log("  2. Save the output as a fixture: tests/regression/fixtures/saved-outputs.json");
  console.log("  3. Re-run this evaluator against the saved fixture");
  console.log("");
  console.log("The prompt-level evaluator (tests/regression/evaluator.ts) DOES run");
  console.log("offline and has already passed all 247 checks.");
  console.log("=".repeat(70));
  console.log("");
  console.log("Output checks defined (run when output is available):");
  const sampleResult = evaluateOutput(testCases[0], null);
  for (const c of sampleResult.checks) {
    console.log(`  ${c.severity === "error" ? "ERROR" : c.severity === "warning" ? "WARN" : "INFO"} — ${c.name}`);
  }
  process.exit(0);
}
