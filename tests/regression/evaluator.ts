// ── Deterministic prompt evaluator ──────────────────────────────────────────
// Evaluates the PROMPT TEXT (not AI output) against the product rules.
// This answers: "Does the prompt that would be sent to the AI gateway
// actually encode the rules we claim in docs/PROMPT.md?"
//
// These checks are fully deterministic and runnable offline.

import { TEST_CASES, type TestCase } from "./cases";
import { buildPromptPair } from "./prompt";

// ── Evaluation result ───────────────────────────────────────────────────────

export interface EvalResult {
  caseId: string;
  caseName: string;
  passed: boolean;
  checks: CheckResult[];
  issues: string[];
}

export interface CheckResult {
  name: string;
  passed: boolean;
  detail?: string;
}

// ── Per-case evaluation ─────────────────────────────────────────────────────

function evaluateCase(testCase: TestCase): EvalResult {
  const { system, user } = buildPromptPair({
    rating: testCase.rating,
    visitType: testCase.visitType,
    stoodOut: testCase.stoodOut,
    tellOthers: testCase.tellOthers,
    staffName: testCase.staffName,
    context: testCase.context,
  });

  const checks: CheckResult[] = [];
  const issues: string[] = [];

  // 1. System prompt contains the anti-hallucination rule
  checks.push({
    name: "system prompt contains 'Use ONLY the information' anti-hallucination rule",
    passed: system.includes("Use ONLY the information the customer provided"),
    detail: system.includes("Use ONLY the information the customer provided")
      ? "present"
      : "MISSING — prompt may allow invented details",
  });
  if (!system.includes("Use ONLY the information the customer provided")) {
    issues.push("Anti-hallucination root rule missing from system prompt");
  }

  // 2. System prompt forbids fake prices
  checks.push({
    name: "system prompt forbids fake prices",
    passed: system.toLowerCase().includes("no fake prices"),
    detail: system.toLowerCase().includes("no fake prices") ? "present" : "MISSING",
  });
  if (!system.toLowerCase().includes("no fake prices")) {
    issues.push("No fake-price prohibition in system prompt");
  }

  // 3. System prompt forbids fake wait times
  checks.push({
    name: "system prompt forbids fake wait times",
    passed: system.toLowerCase().includes("no fake wait times"),
    detail: system.toLowerCase().includes("no fake wait times") ? "present" : "MISSING",
  });
  if (!system.toLowerCase().includes("no fake wait times")) {
    issues.push("No fake-wait-time prohibition in system prompt");
  }

  // 4. System prompt forbids fake staff interactions
  checks.push({
    name: "system prompt forbids fake staff interactions",
    passed: system.toLowerCase().includes("no fake staff interactions"),
    detail: system.toLowerCase().includes("no fake staff interactions") ? "present" : "MISSING",
  });

  // 5. System prompt forbids fake outcomes
  checks.push({
    name: "system prompt forbids fake outcomes",
    passed: system.toLowerCase().includes("no fake outcomes"),
    detail: system.toLowerCase().includes("no fake outcomes") ? "present" : "MISSING",
  });

  // 6. System prompt forbids discounts
  checks.push({
    name: "system prompt forbids fake discounts",
    passed: system.toLowerCase().includes("no discounts"),
    detail: system.toLowerCase().includes("no discounts") ? "present" : "MISSING",
  });

  // 7. System prompt contains rating preservation rule
  checks.push({
    name: "system prompt preserves rating",
    passed: system.toLowerCase().includes("preserve the customer's rating"),
    detail: system.toLowerCase().includes("preserve the customer's rating") ? "present" : "MISSING",
  });
  if (!system.toLowerCase().includes("preserve the customer's rating")) {
    issues.push("Rating preservation rule missing from system prompt");
  }

  // 8. System prompt contains no-invent-details rule
  checks.push({
    name: "system prompt: do not add unmentioned details",
    passed: system.includes("do not add one"),
    detail: system.includes("do not add one") ? "present" : "MISSING",
  });
  if (!system.includes("do not add one")) {
    issues.push("No-unmentioned-detail rule missing from system prompt");
  }

  // 9. Rating is present in user prompt
  checks.push({
    name: "user prompt includes rating",
    passed: user.includes(`Rating: ${testCase.rating}`),
    detail: user.includes(`Rating: ${testCase.rating}`) ? `found "Rating: ${testCase.rating}"` : "MISSING",
  });
  if (!user.includes(`Rating: ${testCase.rating}`)) {
    issues.push(`Rating ${testCase.rating} not in user prompt for case ${testCase.id}`);
  }

  // 10. Visit type in user prompt
  checks.push({
    name: "user prompt includes visit type",
    passed: user.includes(testCase.visitType),
    detail: user.includes(testCase.visitType) ? "present" : "MISSING",
  });

  // 11. What stood out in user prompt
  checks.push({
    name: "user prompt includes what stood out",
    passed: user.includes(testCase.stoodOut),
    detail: user.includes(testCase.stoodOut) ? "present" : "MISSING",
  });

  // 12. What to tell others in user prompt
  checks.push({
    name: "user prompt includes what to tell others",
    passed: user.includes(testCase.tellOthers),
    detail: user.includes(testCase.tellOthers) ? "present" : "MISSING",
  });

  // 13. Staff name handling: if staffName empty, prompt says "do not invent"
  if (!testCase.staffName) {
    checks.push({
      name: "user prompt instructs NOT to invent staff name (no staff provided)",
      passed: user.includes("Do not invent a staff name"),
      detail: user.includes("Do not invent a staff name") ? "present" : "MISSING — prompt may invent a name",
    });
    if (!user.includes("Do not invent a staff name")) {
      issues.push(`Case ${testCase.id}: no-staff prompt missing "do not invent" instruction`);
    }
  } else {
    checks.push({
      name: "user prompt includes staff name when provided",
      passed: user.includes(testCase.staffName),
      detail: user.includes(testCase.staffName) ? `found "${testCase.staffName}"` : "MISSING",
    });
  }

  // 14. Context woven in when provided
  if (testCase.context) {
    checks.push({
      name: "user prompt includes context when provided",
      passed: user.includes(`Additional context: "${testCase.context}"`),
      detail: user.includes(`Additional context: "${testCase.context}"`) ? "present" : "MISSING",
    });
  }

  // 15. Short/detailed output structure enforced
  checks.push({
    name: "system prompt enforces short+1-2 sentences, detailed+3-5 sentences",
    passed: system.includes("1–2 sentences") && system.includes("3–5 sentences"),
    detail: system.includes("1–2 sentences") && system.includes("3–5 sentences") ? "present" : "MISSING",
  });

  // 16. JSON output format enforced
  checks.push({
    name: "system prompt enforces exact JSON output format",
    passed: system.includes('{"short":"<1-2 sentence review>","detailed":"<3-5 sentence review>"}'),
    detail: system.includes('{"short":"<1-2 sentence review>","detailed":"<3-5 sentence review>"}') ? "present" : "MISSING",
  });

  // 17. No marketing tone rule
  checks.push({
    name: "system prompt forbids marketing tone / superlative stacking",
    passed: system.toLowerCase().includes("no marketing tone") && system.toLowerCase().includes("no superlative stacking"),
    detail: system.toLowerCase().includes("no marketing tone") && system.toLowerCase().includes("no superlative stacking") ? "present" : "MISSING",
  });

  const allPassed = checks.every((c) => c.passed);

  return {
    caseId: testCase.id,
    caseName: testCase.name,
    passed: allPassed,
    checks,
    issues,
  };
}

// ── Evaluate all cases ──────────────────────────────────────────────────────

export function evaluateAll(): {
  results: EvalResult[];
  totalChecks: number;
  passedChecks: number;
  totalCases: number;
  passedCases: number;
} {
  const results = TEST_CASES.map(evaluateCase);
  const totalChecks = results.reduce((n, r) => n + r.checks.length, 0);
  const passedChecks = results.reduce((n, r) => n + r.checks.filter((c) => c.passed).length, 0);
  const passedCases = results.filter((r) => r.passed).length;

  return { results, totalChecks, passedChecks, totalCases: results.length, passedCases };
}

// ── CLI entry point ─────────────────────────────────────────────────────────
// ESM-compatible: run when executed directly (not when imported).

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const { results, totalChecks, passedChecks, totalCases, passedCases } = evaluateAll();

  console.log(`Prompt Evaluation: ${totalCases} cases, ${totalChecks} checks, ${passedChecks} passed`);
  console.log("=".repeat(70));

  let allPassed = true;
  for (const r of results) {
    if (!r.passed) allPassed = false;
    console.log(`\n${r.caseId} ${r.caseName} — ${r.passed ? "PASS" : "FAIL"}`);
    for (const c of r.checks) {
      console.log(`  ${c.passed ? "✓" : "✗"} ${c.name}`);
      if (c.detail) console.log(`    → ${c.detail}`);
    }
    if (r.issues.length) {
      console.log("  ISSUES:");
      for (const i of r.issues) console.log(`    - ${i}`);
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log(`SUMMARY: ${passedCases}/${totalCases} cases passed, ${passedChecks}/${totalChecks} checks passed`);
  console.log(allPassed ? "ALL CHECKS PASSED" : "SOME CHECKS FAILED");
  process.exit(allPassed ? 0 : 1);
}
