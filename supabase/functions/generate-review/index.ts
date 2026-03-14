import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { visitType, tone, persona, reason, liked, impact, staffName, notes } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("API key not configured");

    const staffMention = staffName ? `The stylist/staff name is ${staffName}.` : "";
    const notesMention = notes ? `Additional personal note: "${notes}".` : "";

    const systemPrompt = `You are an assistant helping a real customer of Lakme Salon For Him And Her in Goregaon East, Mumbai write an authentic Google review.

Use the user's selections to produce naturally worded reviews that mention service type, experience tone, specific likes, and impact.

Keep it honest, India-friendly, and concise. Avoid exaggeration, avoid promises, and never invent details.
Use simple English, polite tone, culturally neutral, 5-star tone but not fake.
Vary structure and wording. Avoid repetitive openings—rotate intros like "I visited…", "Tried…", "Booked…", "Had a great time at…".
No false claims, no superlatives stacking, avoid hype.

Return EXACTLY this JSON format (no markdown, no code blocks):
{"short":"<1-2 sentence review>","detailed":"<3-5 sentence review>"}`;

    const userPrompt = `Customer details:
- Visit type: ${visitType}
- Experience tone: ${tone}
- Who they are: ${persona}
- Why they chose Lakme: ${reason}
- What they liked most: ${liked}
- Impact/outcome: ${impact}
${staffMention}
${notesMention}

Generate two authentic Google reviews.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tool_choice: { type: "function", function: { name: "return_reviews" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Service credits exhausted. Please try later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("AI error:", status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const reviews = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(reviews), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: try parsing content directly
    const content = data.choices?.[0]?.message?.content || "";
    const cleaned = content.replace(/```json\n?|\n?```/g, "").trim();
    const reviews = JSON.parse(cleaned);
    
    return new Response(JSON.stringify(reviews), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Couldn't generate right now. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
