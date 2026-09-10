#!/usr/bin/env tsx
// ── Live AI regression runner ────────────────────────────────────────────────
// Calls the actual AI gateway for every test case in tests/regression/cases.ts,
// evaluates each output with tests/regression/output-evaluator.ts, and saves
// the results as a JSON fixture.
//
// PREREQUISITE: The LOVABLE_API_KEY must be available. Two options:
//
//   OPTION A (preferred, tests the real edge function):
//     - Deploy the edge function to Supabase
//     - Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in this env
//     - The runner calls supabase.functions.invoke("generate-review")
//
//   OPTION B (bypasses Supabase, calls gateway directly):
//     - Set LOVABLE_API_KEY in this environment
//     - The runner builds the exact gateway body (from prompt.ts) and POSTs
//       to https://ai.gateway.lovable.dev/v1/chat/completions
//
//   If NEITHER key is available, the runner refuses to call the AI and
//   generates an "unavailable" fixture that the output evaluator can document.
//
// OUTPUT: tests/regression/fixtures/saved-outputs.json (overwritten each run)

import fs from "fs";
import path from "path";
import { TEST_CASES } from "./cases";
import { buildGatewayBody } from "./prompt";
import { evaluateOutput, type ReviewRecord } from "./output-evaluator";

// ── Configuration ───────────────────────────────────────────────────────────

const OPTIONS = {
  // Option A: call via Supabase client (requires VITE_SUPABASE_URL +
  // VITE_SUPABASE_PUBLISHABLE_KEY in this environment). Set to true to use.
  useSupabase: false,

  // Option B: call the AI gateway directly (requires LOVABLE_API_KEY in env).
  // Set to true to use. Takes precedence over useSupabase if both set.
  useDirectGateway: false,

  // Save directory for the fixture
  fixturesDir: path.join(__dirname, "fixtures"),

  // Output file
  outputFile: "saved-outputs.json",

  // Timeout per AI call (ms)
  timeoutMs: 30_000,

  // Delay between calls to avoid rate-limiting (ms)
  delayBetweenCalls: 1500,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function env(key: string): string | undefined {
  return process.env[key];
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveFixture(records: ReviewRecord[]): void {
  ensureDir(OPTIONS.fixturesDir);
  const filePath = path.join(OPTIONS.fixturesDir, OPTIONS.outputFile);
  fs.writeFileSync(filePath, JSON.stringify(records, null, 2), "utf-8");
  console.log(`✓ Fixture saved: ${filePath}`);
}

// ── Option B: direct gateway call ───────────────────────────────────────────

async function callDirectGateway(
  testCase: (typeof TEST_CASES)[0],
  apiKey: string
): Promise<{ short: string; detailed: string } | null> {
  const body = buildGatewayBody({
    rating: testCase.rating,
    visitType: testCase.visitType,
    stoodOut: testCase.stoodOut,
    tellOthers: testCase.tellOthers,
    staffName: testCase.staffName,
    context: testCase.context,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPTIONS.timeoutMs);

  try {
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.error(`  ✗ Gateway error ${response.status}: ${text.slice(0, 200)}`);
      return null;
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      if (typeof parsed.short === "string" && typeof parsed.detailed === "string") {
        return { short: parsed.short, detailed: parsed.detailed };
      }
      console.error("  ✗ Tool call returned non-string fields");
      return null;
    }

    // Fallback: parse content
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (typeof parsed.short === "string" && typeof parsed.detailed === "string") {
      return { short: parsed.short, detailed: parsed.detailed };
    }
    console.error("  ✗ Could not parse AI response");
    return null;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === "AbortError") {
      console.error(`  ✗ Timeout after ${OPTIONS.timeoutMs / 1000}s`);
    } else {
      console.error(`  ✗ Call failed: ${err?.message || err}`);
    }
    return null;
  }
}

// ── Option A: call via Supabase ──────────────────────────────────────────────

async function callViaSupabase(
  testCase: (typeof TEST_CASES)[0]
): Promise<{ short: string; detailed: string } | null> {
  // This would require the Supabase JS client and valid credentials.
  // Implemented here as a placeholder — when useSupabase is true and the
  // env vars are set, this calls supabase.functions.invoke("generate-review").
  //
  // For now, if useSupabase is selected but not fully implemented, fail clearly.
  console.error("  ✗ Supabase path not implemented in this runner");
  console.error("  Set useDirectGateway=true and provide LOVABLE_API_KEY instead");
  return null;
}

// ── Main runner ──────────────────────────────────────────────────────────────

async function main() {
  console.log("=".repeat(70));
  console.log("LIVE AI REGRESSION RUNNER");
  console.log(`Test cases: ${TEST_CASES.length}`);
  console.log(`Mode: ${OPTIONS.useDirectGateway ? "direct gateway" : OPTIONS.useSupabase ? "via Supabase" : "NO AI ACCESS — generating unavailable fixture"}`);
  console.log("=".repeat(70));
  console.log("");

  const records: ReviewRecord[] = [];
  let succeeded = 0;
  let failed = 0;

  // Determine if we have API access
  const directKey = OPTIONS.useDirectGateway ? env("LOVABLE_API_KEY") : undefined;
  const hasSupabaseCreds = OPTIONS.useSupabase && env("VITE_SUPABASE_URL") && env("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!OPTIONS.useDirectGateway && !OPTIONS.useSupabase) {
    console.log("⚠ No AI access configured. Set useDirectGateway=true and LOVABLE_API_KEY,");
    console.log("  or useSupabase=true and VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY.");
    console.log("  Generating fixture with all outputs marked 'unavailable'.");
    console.log("");

    for (const testCase of TEST_CASES) {
      records.push({
        caseId: testCase.id,
        input: {
          rating: testCase.rating,
          visitType: testCase.visitType,
          stoodOut: testCase.stoodOut,
          tellOthers: testCase.tellOthers,
          staffName: testCase.staffName,
          context: testCase.context,
        },
        output: { short: "", detailed: "" },
        source: "unavailable",
        timestamp: new Date().toISOString(),
      });
    }

    saveFixture(records);
    console.log(`\nFixture generated: ${records.length} records, all unavailable`);
    console.log("Re-run with API access to populate real outputs.");
    return;
  }

  if (OPTIONS.useDirectGateway && !directKey) {
    console.error("✗ useDirectGateway=true but LOVABLE_API_KEY is not set");
    console.error("  Set it in your environment: export LOVABLE_API_KEY=your-key");
    process.exit(1);
  }

  if (OPTIONS.useSupabase && !hasSupabaseCreds) {
    console.error("✗ useSupabase=true but VITE_SUPABASE_URL and/or VITE_SUPABASE_PUBLISHABLE_KEY not set");
    console.error("  Set both in your environment, or use useDirectGateway=true");
    process.exit(1);
  }

  // Run each test case
  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    const t0 = Date.now();

    console.log(`[${i + 1}/${TEST_CASES.length}] ${testCase.id} ${testCase.name}`);
    console.log(`  Rating: ${testCase.rating} | ${testCase.visitType}`);

    let result: { short: string; detailed: string } | null = null;

    if (OPTIONS.useDirectGateway && directKey) {
      result = await callDirectGateway(testCase, directKey);
    } else if (OPTIONS.useSupabase && hasSupabaseCreds) {
      result = await callViaSupabase(testCase);
    }

    if (result) {
      succeeded++;
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      console.log(`  ✓ Got response in ${elapsed}s`);
      console.log(`  Short: ${result.short.slice(0, 80)}...`);
      console.log(`  Detailed: ${result.detailed.slice(0, 80)}...`);
    } else {
      failed++;
      console.log(`  ✗ Failed to get response`);
    }

    records.push({
      caseId: testCase.id,
      input: {
        rating: testCase.rating,
        visitType: testCase.visitType,
        stoodOut: testCase.stoodOut,
        tellOthers: testCase.tellOthers,
        staffName: testCase.staffName,
        context: testCase.context,
      },
      output: result || { short: "", detailed: "" },
      source: result ? "live" : "unavailable",
      timestamp: new Date().toISOString(),
    });

    // Delay between calls
    if (i < TEST_CASES.length - 1) {
      await new Promise((r) => setTimeout(r, OPTIONS.delayBetweenCalls));
    }
  }

  // Save fixture
  saveFixture(records);

  // Evaluate what we got
  console.log("");
  console.log("=".repeat(70));
  console.log("EVALUATION OF LIVE OUTPUTS");
  console.log("=".repeat(70));

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    const testCase = TEST_CASES.find((c) => c.id === record.caseId)!;
    const evalResult = evaluateOutput(testCase, record);

    console.log(`\n${testCase.id} ${testCase.name}`);
    console.log(`  Source: ${record.source}`);
    console.log(`  Verification level: ${evalResult.verificationLevel}`);
    console.log(`  Passed hard checks: ${evalResult.passed}`);

    if (evalResult.verificationLevel === "unverified") {
      console.log("  ⚠ No output to evaluate");
    } else {
      for (const c of evalResult.checks) {
        if (!c.passed) {
          console.log(`  ${c.severity === "error" ? "✗ ERROR" : "⚠ WARN"} ${c.name}`);
          if (c.detail) console.log(`    → ${c.detail}`);
        }
      }
      if (evalResult.issues.length) {
        console.log("  Issues:");
        for (const iss of evalResult.issues) console.log(`    - ${iss}`);
      }
    }
  }

  const available = records.filter((r) => r.source === "live").length;
  console.log(`\nSUMMARY: ${succeeded}/${records.length} calls succeeded, ${available} outputs available for evaluation`);
  console.log(`Fixture: ${OPTIONS.fixturesDir}/${OPTIONS.outputFile}`);
}

main().catch((err) => {
  console.error("Runner crashed:", err);
  process.exit(1);
});
