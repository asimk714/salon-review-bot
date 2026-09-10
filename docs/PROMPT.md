# AI Prompt Design

## Product objective

Help a real customer of Lakme Salon For Him And Her (Goregaon East, Mumbai) write an honest Google review that expresses their own experience clearly.

The AI does not invent the experience. It improves how the user expresses what they already experienced. The user owns the final text and posts it manually on Google.

---

## AI's role

The AI is a drafting assistant. It takes the user's structured answers and turns them into two natural-language review drafts (short and detailed).

It is not:

- A fake review generator.
- A marketing copywriter.
- A fact-checker.
- A posting tool.

It is a translator from "what I experienced" into "how I might say it on Google."

---

## Input structure

The edge function receives a JSON body from the frontend:

```json
{
  "rating": 4,
  "visitType": "Haircut",
  "stoodOut": "The stylist listened carefully to what I wanted.",
  "tellOthers": "Book ahead on weekends — it gets busy.",
  "staffName": "Priya",
  "context": "First time visiting this branch."
}
```

| Field | Required | Purpose |
|---|---|---|
| `rating` | Yes (1–5) | Determines the tone of the review. Passed to the model so it can match sentiment. |
| `visitType` | Yes | What service the customer had. One of a predefined list. |
| `stoodOut` | Yes | What the customer liked or noticed. The core content of the review. |
| `tellOthers` | Yes | Practical advice the customer would give another customer. |
| `staffName` | No | Optional staff/stylist name. If provided, the model may mention them naturally. |
| `context` | No | Optional extra context (e.g. "first time here", "I've been coming for 2 years"). |

The frontend validates that `rating > 0`, `visitType`, `stoodOut`, and `tellOthers` are all present before submitting.

---

## Output structure

The edge function returns exactly:

```json
{
  "short": "A 1-2 sentence review.",
  "detailed": "A 3-5 sentence review."
}
```

- `short` — a concise version suitable for a quick read.
- `detailed` — a fuller version that expands on the same content.

Both are plain text. No markdown. No extra fields. The frontend passes these directly into editable review cards.

The AI is instructed to return this exact JSON shape, with no other text, via a forced tool call.

---

## Anti-hallucination rules

The system prompt contains explicit rules to prevent the AI from inventing facts:

1. **Use ONLY the information the customer provided.** No fake prices, no fake wait times, no fake staff interactions, no fake outcomes, no discounts, no other patrons, no specific products, no "best in the city" or similar superlatives.

2. **If the customer didn't mention a detail, do not add one.** This is the core guardrail. If `staffName` is absent, the model must not invent a name. If price is absent, it must not invent one.

3. **Preserve the customer's rating exactly.** The tone must match the rating the user selected.

4. **No superlative stacking.** No "best", "amazing", "wonderful", "perfect" stacking.

5. **No marketing tone.** A real person wrote this, not a salon promoting itself.

6. **Business name mention is optional.** "Lakme Salon For Him And Her in Goregaon East, Mumbai" can appear naturally if it fits; it should not be forced.

These rules exist because the product's credibility depends on the reviews being honest. A fake review generator is not a credible portfolio piece and is not a useful product.

---

## Rating handling

The user picks 1–5 stars. The AI receives the rating and adjusts its tone accordingly:

- **5 — Excellent:** Positive but natural. Not hyperbolic.
- **4 — Great:** Positive, with room for a minor note.
- **3 — Good:** Balanced, mixed-but-decent. Not a 5-star review in disguise.
- **2 — Okay:** Genuinely disappointed but fair. Specific, not ranting.
- **1 — Poor:** Disappointed, specific, honest. Not abusive.

The model is told: "If the rating is 3, the review should sound like someone who had a decent but imperfect experience. If it is 1 or 2, the review should sound genuinely disappointed but still fair and specific — not abusive, not generic ranting."

The rating is displayed on the results screen alongside the generated reviews, so the user can see that the AI respected their chosen rating.

---

## Why the guardrails exist

Without guardrails, an AI asked to "write a Google review" will:

- Invent specifics (prices, times, staff names) to make the review sound real.
- Default to 5-star marketing tone regardless of what the user experienced.
- Produce reviews that are indistinguishable from fake reviews — which is the core product risk.

The guardrails exist to make the tool genuinely useful for honest feedback, including negative feedback. A review assistant that only writes 5-star reviews is a fake-review tool, not a helpful assistant.

The guardrails are in the prompt, not enforced by code. The AI can still violate them. That's why the user can edit the draft and why the app shows what the draft was based on.

---

## Important prompt decisions

### 1. "Use ONLY the information the customer provided"

This is the single most important rule. It appears first in the rules list and is restated as "If the customer didn't mention a detail, do not add one." Everything else follows from this.

### 2. Rating passed explicitly to the model

The prompt includes `Rating: N out of 5` as a first-class field in the user details, and the system prompt has a dedicated paragraph on preserving the rating. This prevents the model from defaulting to 5-star tone.

### 3. Staff name handled conditionally

If `staffName` is provided: "Mention them only if it fits naturally." If absent: "Do not invent a staff name. If a person isn't named in the input, refer to 'the team' or 'the stylist' generically." This prevents the model from fabricating a person.

### 4. Context woven in naturally

`context` is passed as "Additional context: \"...\"." with the instruction "Weave it in naturally if it fits." This gives the user a way to add grounding detail (e.g. "first time here") without forcing the model to shoehorn it.

### 5. Short and detailed are both generated in one call

The tool call returns both `short` and `detailed` at once. This is more efficient than two separate AI calls and ensures the two versions are consistent with each other.

### 6. Tool-call forced, with content fallback

The function prefers the tool-call path (structured, schema-enforced). If the gateway doesn't return a tool call, it falls back to parsing the message content directly. The fallback is less reliable but handles edge cases.

### 7. No markdown in the output

The prompt says "Return EXACTLY this JSON (no markdown, no code blocks, no other text)". This makes parsing simpler and reduces the chance of the model wrapping the JSON in ```json fences.

---

## Prompt location

The full system prompt and user prompt are in `supabase/functions/generate-review/index.ts`. They are built at request time from the user's form data. They are not user-facing, but they are the core of the product's AI behavior and should be reviewed when the prompt is changed.
