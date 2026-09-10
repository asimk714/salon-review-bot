// ── Prompt reconstruction ───────────────────────────────────────────────────
// Rebuilds the EXACT systemPrompt + userPrompt that the edge function
// (supabase/functions/generate-review/index.ts) constructs for a given
// form input. This is extracted from the edge function source so the
// regression suite can verify the prompt encodes the rules correctly,
// without needing to call the AI gateway.
//
// This is deterministic: given the same input, it always produces the
// same prompt text. It is NOT an AI call.

import type { FormData } from "../../src/components/ReviewForm";

// ── Build the exact prompt fragments, mirroring the edge function ──────────

function buildRatingNote(rating: number | undefined): string {
  if (rating && Number.isInteger(rating) && rating >= 1 && rating <= 5) { return `The customer's rating is ${rating} out of 5.`; } return "";
}

function buildStaffMention(staffName: string): string {
  if (staffName) {
    return `The staff/stylist name is ${staffName}. Mention them only if it fits naturally.`;
  }
  return "Do not invent a staff name. If a person isn't named in the input, refer to 'the team' or 'the stylist' generically.";
}

function buildContextMention(context: string): string {
  return context ? `Additional context: "${context}". Weave it in naturally if it fits.` : "";
}

// ── The exact system prompt from the edge function (lines 63-75) ───────────
const SYSTEM_PROMPT = `You are helping a real customer of Lakme Salon For Him And Her in Goregaon East, Mumbai write an honest Google review.

Rules:
- Use ONLY the information the customer provided below. Do NOT invent details that weren't given: no fake prices, no fake wait times, no fake staff interactions, no fake outcomes, no discounts, no other patrons, no specific products, no claims about "best in the city" or similar superlatives.
- Preserve the customer's rating exactly. If the rating is 3, the review should sound like someone who had a decent but imperfect experience. If it is 1 or 2, the review should sound genuinely disappointed but still fair and specific — not abusive, not generic ranting.
- Write in simple, natural English. A real person wrote it. No marketing tone, no "I had a wonderful experience" filler, no superlative stacking.
- Keep the short version to 1–2 sentences. Keep the detailed version to 3–5 sentences.
- Vary the opening wording so different reviews don't all start the same way.
- The business name is "Lakme Salon For Him And Her" in Goregaon East, Mumbai. Mention it naturally if it fits; don't force it.
- If the customer didn't mention a detail (price, time, staff name, etc.), do not add one.

Return EXACTLY this JSON (no markdown, no code blocks, no other text):
{"short":"<1-2 sentence review>","detailed":"<3-5 sentence review>"}`;

// ── Build the user prompt from form data ────────────────────────────────────

export function buildUserPrompt(form: FormData): string {
  const ratingNote = buildRatingNote(form.rating);
  const staffMention = buildStaffMention(form.staffName);
  const contextMention = buildContextMention(form.context);

  return `Customer details:
- Rating: ${form.rating ?? "not specified"}
- Visit type: ${form.visitType}
- What stood out: ${form.stoodOut}
- What to tell other customers: ${form.tellOthers}
${ratingNote}
${staffMention}
${contextMention}

Generate two honest Google reviews using only the above information.`;
}

// ── Build the full message pair (system + user) ────────────────────────────

export function buildPromptPair(form: FormData): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(form),
  };
}

// ── Build the exact JSON body that would be POSTed to the AI gateway ───────
// (for documentation / debugging — not used for live calls in this environment)

export function buildGatewayBody(form: FormData): object {
  const { system, user } = buildPromptPair(form);
  return {
    model: "google/gemini-2.5-flash",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "return_reviews",
          description: "Return short and detailed review versions",
          parameters: {
            type: "object",
            properties: {
              short: { type: "string", description: "1-2 sentence short review" },
              detailed: { type: "string", description: "3-5 sentence detailed review" },
            },
            required: ["short", "detailed"],
            additionalProperties: false,
          },
        },
      },
    ],
    tool_choice: {
      type: "function",
      function: { name: "return_reviews" },
    },
  };
}
