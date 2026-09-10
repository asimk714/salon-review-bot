import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_TIMEOUT_MS = 25_000;

// ── Validate a review response from the AI ───────────────────────────────────
// Ensures the response is well-formed before it reaches the frontend.

function isValidReviewResponse(data: unknown): data is { short: string; detailed: string } {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (!("short" in obj) || !("detailed" in obj)) return false;
  if (typeof obj.short !== "string" || typeof obj.detailed !== "string") return false;
  if (obj.short.trim().length === 0 || obj.detailed.trim().length === 0) return false;
  // Disallow extra properties (matches the gateway's additionalProperties: false)
  const keys = Object.keys(obj);
  return keys.length === 2;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid request body. Please try again." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const {
      rating,
      visitType,
      stoodOut,
      tellOthers,
      staffName,
      context,
    } = body;

    // ── Input validation ────────────────────────────────────────────────────
    if (
      !visitType ||
      typeof visitType !== "string" ||
      !stoodOut ||
      typeof stoodOut !== "string" ||
      !tellOthers ||
      typeof tellOthers !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: visitType, stoodOut, and tellOthers must be non-empty text.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (visitType.trim().length === 0 || stoodOut.trim().length === 0 || tellOthers.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Required fields must not be empty: visitType, stoodOut, and tellOthers.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Rating must be 1–5 if provided
    if (
      rating !== undefined &&
      (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5)
    ) {
      return new Response(
        JSON.stringify({ error: "Rating must be a whole number from 1 to 5." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Optional fields: must be strings if present
    if (staffName !== undefined && typeof staffName !== "string") {
      return new Response(
        JSON.stringify({ error: "staffName must be text if provided." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (context !== undefined && typeof context !== "string") {
      return new Response(
        JSON.stringify({ error: "context must be text if provided." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured in edge function environment");
      return new Response(
        JSON.stringify({ error: "Service not configured. Please try later." }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Build prompt ──────────────────────────────────────────────────────
    const ratingNote = rating
      ? `The customer's rating is ${rating} out of 5.`
      : "";

    const staffMention = staffName
      ? `The staff/stylist name is ${staffName}. Mention them only if it fits naturally.`
      : "Do not invent a staff name. If a person isn't named in the input, refer to 'the team' or 'the stylist' generically.";

    const contextMention = context
      ? `Additional context: "${context}". Weave it in naturally if it fits.`
      : "";

    const systemPrompt = `You are helping a real customer of Lakme Salon For Him And Her in Goregaon East, Mumbai write an honest Google review.

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

    const userPrompt = `Customer details:
- Rating: ${rating ?? "not specified"}
- Visit type: ${visitType}
- What stood out: ${stoodOut}
- What to tell other customers: ${tellOthers}
${ratingNote}
${staffMention}
${contextMention}

Generate two honest Google reviews using only the above information.`;

    // ── Call the AI gateway with timeout ─────────────────────────────────────
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
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
          }),
          signal: controller.signal,
        }
      );
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr && (fetchErr as any).name === "AbortError") {
        return new Response(
          JSON.stringify({ error: "The request timed out. Please try again." }),
          {
            status: 504,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.error("AI gateway fetch failed:", fetchErr);
      return new Response(
        JSON.stringify({ error: "Couldn't reach the review service. Please try again." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Service credits exhausted. Please try later." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      const text = await response.text().catch(() => "");
      console.error("AI error:", status, text.slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Couldn't generate right now. Please try again." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json().catch(() => null);
    if (!data || typeof data !== "object") {
      return new Response(
        JSON.stringify({ error: "Received an invalid response from the review service." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Primary path: tool call ───────────────────────────────────────────────
    const toolCall = (data as any).choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(toolCall.function.arguments);
      } catch {
        return new Response(
          JSON.stringify({ error: "Received an invalid response from the review service." }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (isValidReviewResponse(parsed)) {
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI tool call returned invalid review shape:", JSON.stringify(parsed).slice(0, 300));
      return new Response(
        JSON.stringify({ error: "Received an invalid response from the review service." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Fallback: parse content directly ──────────────────────────────────────
    const content = (data as any).choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\s*\n?|\n?```/g, "").trim();
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return new Response(
        JSON.stringify({ error: "Received an invalid response from the review service." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    if (isValidReviewResponse(parsed)) {
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.error("AI content fallback returned invalid review shape:", JSON.stringify(parsed).slice(0, 300));
    return new Response(
      JSON.stringify({ error: "Received an invalid response from the review service." }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("Unhandled edge function error:", e);
    return new Response(
      JSON.stringify({ error: "Something went wrong. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
