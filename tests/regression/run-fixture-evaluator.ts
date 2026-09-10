#!/usr/bin/env tsx
// ── Load saved fixture and run output evaluator against it ──────────────────
// Usage: tsx tests/regression/run-fixture-evaluator.ts
//
// Reads tests/regression/fixtures/saved-outputs.json (produced by the live
// runner) and evaluates each record with the output evaluator.

import fs from "fs";
import path from "path";
import { TEST_CASES } from "./cases";
import { evaluateOutput, evaluateAllOutputs, type ReviewRecord } from "./output-evaluator";

const fixturesDir = path.join(__dirname, "fixtures");
const fixtureFile = path.join(fixturesDir, "saved-outputs.json");

function loadFixture(): ReviewRecord[] {
  if (!fs.existsSync(fixtureFile)) {
    console.error(`✗ Fixture not found: ${fixtureFile}`);
    console.error("  Run the live runner first: tsx tests/regression/live-runner.ts");
    process.exit(1);
  }
  const raw = fs.readFileSync(fixtureFile, "utf-8");
  try {
    return JSON.parse(raw) as ReviewRecord[];
  } catch (err) {
    console.error(`✗ Fixture is not valid JSON: ${fixtureFile}`);
    process.exit(1);
  }
}

function main() {
  const records = loadFixture();
  console.log(`Loaded ${records.length} records from fixture`);

  // Evaluate each record
  console.log("");
  console.log("=".repeat(70));
  console.log("OUTPUT EVALUATION (from saved fixture)");
  console.log("=".repeat(70));

  const result = evaluateAllOutputs(records);

  for (const r of result.results) {
    console.log(`\n${r.caseId} ${r.caseName}`);
    console.log(`  Verification level: ${r.verificationLevel}`);
    console.log(`  Passed hard checks: ${r.passed}`);

    if (r.verificationLevel === "unverified") {
      console.log("  ⚠ No output to evaluate");
      continue;
    }

    const errors = r.checks.filter((c) => c.severity === "error" && !c.passed);
    const warnings = r.checks.filter((c) => c.severity === "warning" && !c.passed);

    if (errors.length === 0 && warnings.length === 0) {
      console.log("  ✓ All checks passed");
    } else {
      if (errors.length) {
        console.log(`  ✗ ${errors.length} hard failure(s):`);
        for (const c of errors) console.log(`    ✗ ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
      }
      if (warnings.length) {
        console.log(`  ⚠ ${warnings.length} warning(s):`);
        for (const c of warnings) console.log(`    ⚠ ${c.name}${c.detail ? ` — ${c.detail}` : ""}`);
      }
    }

    if (r.issues.length) {
      console.log("  Issues to review:");
      for (const iss of r.issues) console.log(`    - ${iss}`);
    }
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("AGGREGATE SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total cases:            ${result.totalCases}`);
  console.log(`Outputs available:      ${result.outputsAvailable}`);
  console.log(`Hard failures:          ${result.hardFailures}`);
  console.log(`Warnings:               ${result.warnings}`);
  console.log(`Automated pass (clean): ${result.automatedPass}`);
  console.log("");

  if (result.outputsAvailable === 0) {
    console.log("⚠ No live outputs in this fixture. Run the live runner first.");
    console.log("  tsx tests/regression/live-runner.ts");
    process.exit(0);
  }

  if (result.hardFailures > 0) {
    console.log(`✗ ${result.hardFailures} case(s) with hard failures — AI behavior problems detected`);
    process.exit(1);
  }

  if (result.warnings > 0) {
    console.log(`⚠ ${result.warnings} case(s) with warnings — review before trusting`);
    process.exit(0);
  }

  console.log(`✓ ${result.automatedPass}/${result.outputsAvailable} outputs passed all automated checks`);
  process.exit(0);
}

main();
