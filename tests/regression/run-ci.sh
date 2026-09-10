#!/usr/bin/env bash
# ── CI regression test script ────────────────────────────────────────────────
# Usage: bash tests/regression/run-ci.sh
#
# Runs in CI or locally. Detects whether LOVABLE_API_KEY is available.
#
# If the key IS available:
#   1. Run the live runner to call the AI gateway
#   2. Run the fixture evaluator against the saved outputs
#   3. Fail the CI if any hard failures
#
# If the key IS NOT available:
#   1. Run the prompt evaluator (always passes offline)
#   2. Run the output evaluator (documents that no live output is available)
#   3. Report that live AI testing was skipped
#   4. Do NOT fail — this is expected in environments without the key

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "=============================================="
echo "CI REGRESSION TEST — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "=============================================="
echo ""

# Detect API key availability
HAS_DIRECT_KEY="${LOVABLE_API_KEY:-}"
HAS_SUPABASE_URL="${VITE_SUPABASE_URL:-}"
HAS_SUPABASE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY:-}"

echo "API key status:"
echo "  LOVABLE_API_KEY set:        $([ -n "$HAS_DIRECT_KEY" ] && echo 'YES' || echo 'NO')"
echo "  VITE_SUPABASE_URL set:      $([ -n "$HAS_SUPABASE_URL" ] && echo 'YES' || echo 'NO')"
echo "  VITE_SUPABASE_PUBLISHABLE_KEY set: $([ -n "$HAS_SUPABASE_KEY" ] && echo 'YES' || echo 'NO')"
echo ""

# Ensure tsx is available
if ! command -v tsx &>/dev/null; then
  echo "Installing tsx..."
  npm install --save-dev tsx >/dev/null 2>&1 || true
fi

FAILED=0

# ── Always run: prompt evaluator (offline, deterministic) ───────────────────

echo "--- Prompt evaluator (offline, deterministic) ---"
echo ""
if ! npx tsx tests/regression/evaluator.ts; then
  echo "✗ PROMPT EVALUATOR FAILED"
  FAILED=1
else
  echo "✓ Prompt evaluator passed"
fi
echo ""

# ── Always run: output evaluator (documents availability) ────────────────────

echo "--- Output evaluator (documents whether live output is available) ---"
echo ""
npx tsx tests/regression/output-evaluator.ts
echo ""

# ── Conditional: live AI runner + fixture evaluator ───────────────────────────

if [ -n "$HAS_DIRECT_KEY" ]; then
  echo "--- Live AI regression runner (direct gateway) ---"
  echo ""
  export LOVABLE_API_KEY="$HAS_DIRECT_KEY"
  if ! npx tsx tests/regression/live-runner.ts; then
    echo "✗ Live runner failed"
    FAILED=1
  else
    echo ""
    echo "--- Fixture evaluator (against saved live outputs) ---"
    echo ""
    if ! npx tsx tests/regression/run-fixture-evaluator.ts; then
      echo "✗ Fixture evaluator found AI behavior problems"
      FAILED=1
    else
      echo "✓ Fixture evaluator passed"
    fi
  fi
elif [ -n "$HAS_SUPABASE_URL" ] && [ -n "$HAS_SUPABASE_KEY" ]; then
  echo "--- Live AI regression runner (via Supabase) ---"
  echo ""
  export VITE_SUPABASE_URL="$HAS_SUPABASE_URL"
  export VITE_SUPABASE_PUBLISHABLE_KEY="$HAS_SUPABASE_KEY"
  echo "⚠ Supabase path not yet implemented in the runner — skipping live AI test"
  echo "  Set LOVABLE_API_KEY for direct gateway testing instead"
else
  echo "--- Live AI testing: SKIPPED ---"
  echo ""
  echo "No LOVABLE_API_KEY available in this environment."
  echo "Live AI regression testing requires the key to be set."
  echo ""
  echo "To run live tests:"
  echo "  export LOVABLE_API_KEY=your-key"
  echo "  bash tests/regression/run-ci.sh"
  echo ""
  echo "The prompt evaluator (offline) has already verified that the prompt"
  echo "encodes all product rules correctly. Live output evaluation is pending."
fi

# ── Result ────────────────────────────────────────────────────────────────────

echo ""
echo "=============================================="
if [ "$FAILED" -eq 0 ]; then
  echo "REGRESSION TESTS PASSED"
  echo "=============================================="
  exit 0
else
  echo "REGRESSION TESTS FAILED"
  echo "=============================================="
  exit 1
fi
