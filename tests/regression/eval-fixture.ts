#!/usr/bin/env tsx
// ── Evaluate saved fixture against live AI outputs ──────────────────────────
// Usage: tsx tests/regression/eval-fixture.ts
// Reads: tests/regression/fixtures/saved-outputs.json (from live-runner)
// Uses: tests/regression/output-evaluator.ts (evaluateAllOutputs)

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TEST_CASES } from "./cases";
import { evaluateAllOutputs, type ReviewRecord } from "./output-evaluator";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fixturePath = path.join(__dirname, "fixtures", "saved-outputs.json");

if (!fs.existsSync(fixturePath)) {
  console.error("✗ Fixture not found:", fixturePath);
  console.error("  Run the live runner first: tsx tests/regression/live-runner.ts");
  process.exit(1);
}

const raw = fs.readFileSync(fixturePath, "utf-8");
const records: ReviewRecord[] = JSON.parse(raw);

console.log("=".repeat(70));
console.log(`LIVE AI OUTPUT EVALUATION — ${records.length} cases`);
console.log("=".repeat(70));
console.log("");

const result = evaluateAllOutputs(records);

let anyHardFailure = false;
let anyWarning = false;

for (const r of result.results) {
  const tc = TEST_CASES.find((c) => c.id === r.caseId);
  console.log(`${r.caseId} ${r.caseName} (${tc?.rating}★, ${tc?.visitType})`);
  console.log(`  Source: ${r.verificationLevel}`);
  console.log(`  Passed hard checks: ${r.passed}`);

  const errors = r.checks.filter((c) => c.severity === "error" && !c.passed);
  const warnings = r.checks.filter((c) => c.severity === "warning" && !c.passed);

  if (errors.length) {
    anyHardFailure = true;
    console.log(`  ✗ ${errors.length} HARD FAILURE(IES):`);
    for (const c of errors) console.log(`    ✗ ${c.name}${c.detail ? " — " + c.detail : ""}`);
  }
  if (warnings.length) {
    anyWarning = true;
    console.log(`  ⚠ ${warnings.length} WARNING(S):`);
    for (const c of warnings) console.log(`    ⚠ ${c.name}${c.detail ? " — " + c.detail : ""}`);
  }

  if (r.issues.length) {
    console.log(`  Issues to review:`);
    for (const iss of r.issues) console.log(`    - ${iss}`);
  }

  const out = r.output && typeof r.output === "object" ? r.output : null;
  if (out && typeof out.short === "string" && out.short.length > 0) {
    console.log("");
    console.log(`  ── AI OUTPUT (for qualitative review) ──`);
    console.log(`  SHORT: ${out.short}`);
    console.log(`  DETAILED: ${out.detailed}`);
    console.log("");
    console.log("-".repeat(70));
    console.log("");
  }
}

console.log("=".repeat(70));
console.log("AGGREGATE SUMMARY");
console.log("=".repeat(70));
console.log(`Total cases:            ${result.totalCases}`);
console.log(`Outputs available:      ${result.outputsAvailable}`);
console.log(`Hard failures:          ${result.hardFailures}`);
console.log(`Warnings:               ${result.warnings}`);
console.log(`Automated pass (clean): ${result.automatedPass}`);
console.log("");

if (result.hardFailures > 0) {
  console.log(`✗ ${result.hardFailures} case(s) with HARD FAILURES — AI behavior problems confirmed`);
  console.log(`  These are AUTOMATED findings. Manual review required for each.`);
  process.exit(1);
}

if (result.warnings > 0) {
  console.log(`⚠ ${result.warnings} case(s) with WARNINGS — review before trusting`);
  console.log(`  Warnings may indicate issues that need manual review.`);
}

console.log(`✓ ${result.automatedPass}/${result.outputsAvailable} outputs passed all automated checks`);
console.log("");
console.log("IMPORTANT: Automated checks passing ≠ AI is reliable.");
console.log("The outputs above require manual/qualitative review for factual faithfulness.");
process.exit(result.hardFailures > 0 ? 1 : 0);
