# Lakme Salon Review Assistant

A focused web app that helps a salon customer draft an honest Google review from their own experience. The AI improves how the user expresses themself — it does not decide what happened.

---

## The problem

Writing a review on Google after a salon visit is fiddly: you have to decide what to say, how to say it, and how to frame it — often on a phone, in a hurry, while the experience is still fresh. Many people leave without posting anything, or post a thin one-liner that doesn't capture what they actually experienced.

This tool reduces the friction. You answer a few specific questions about your visit. The AI turns your answers into a clear, honest draft. You edit it. You post it yourself on Google. The app never posts on your behalf.

---

## Core product principle

**AI can improve how you say it. It cannot decide what happened.**

The AI only uses what you tell it. It never invents services, prices, staff interactions, wait times, outcomes, or other facts. If you don't mention a detail, the review doesn't include it.

---

## Key features

- **Your rating, your voice.** Pick 1–5 stars. The AI matches its tone to your rating — a 3-star review sounds genuinely mixed, not like a 5-star review with fewer adjectives.
- **Structured input, not a blank box.** Visit type, what stood out, what you'd tell another customer, optional staff name, optional context. This keeps the AI's creative space bounded and reduces hallucination.
- **Two draft lengths.** A short version (1–2 sentences) and a detailed version (3–5 sentences). Switch between them before posting.
- **Fully editable.** Every generated review is editable in place. You own the final text.
- **Regenerate with the same answers.** Get a second draft without re-filling the form.
- **Copy + open Google Reviews.** One tap copies the text and opens Google's review page for the salon. You paste, pick your stars, and submit manually. The app does not post for you.
- **Transparency.** A collapsible section shows exactly what the draft was based on.

---

## User flow

Experience → Draft → Edit → Approve → Copy / Open Google

1. Open the app (mobile-first, works in a browser).
2. Pick your rating (1–5 stars).
3. Select visit type.
4. Describe what stood out.
5. Say what you'd want another customer to know.
6. Optionally name the staff member you saw.
7. Optionally add context (e.g. "first time here", "I've been coming for 2 years").
8. Tap **Draft My Review**.
9. Review the short and detailed drafts. Edit either one. Switch variants.
10. Tap **Copy & Open Google Reviews** — text is copied, Google review page opens.
11. Paste, pick your stars on Google, submit.

---

## Tech stack

- **Frontend:** React 18, TypeScript, Vite, shadcn/ui (Radix primitives), Tailwind CSS
- **Backend:** Supabase — client SDK for the frontend, Deno edge function for the AI call
- **AI:** Lovable AI gateway → Google Gemini 2.5 Flash, called server-side via tool-call structured output
- **Hosting:** Static frontend (Vite build → any static host); Supabase handles the edge function and the client connection

---

## Architecture overview

```
Browser (React + Vite)
  │
  │ 1. User fills form (rating, visit type, what stood out,
  │    what to tell others, optional staff name, optional context)
  │
  ▼
  │ 2. Form submits to Supabase edge function
  │    (supabase.functions.invoke("generate-review", { body: formData }))
  │
  ▼
Deno Edge Function (Supabase)
  │
  │ 3. Validates required fields (visitType, stoodOut, tellOthers)
  │ 4. Reads LOVABLE_API_KEY from Deno.env (server-side secret)
  │ 5. Builds system prompt + user prompt
  │ 6. Calls Lovable AI gateway → Gemini 2.5 Flash
  │    (tool-call forced return_reviews function → structured JSON)
  │ 7. Returns { short, detailed } or error
  │
  ▼
  │ 8. Frontend renders short + detailed drafts
  │    (editable, variant-switchable, with user's rating displayed)
  │
  ▼
  User edits, copies, opens Google Reviews page manually
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detail.

---

## Local setup

```sh
git clone <your-repo-url>
cd salon-review-bot
npm install
npm run dev
```

The app runs at `http://localhost:8080` by default.

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values.

| Variable | Where it lives | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | Frontend `.env` | Supabase project URL (from dashboard → Project Settings → API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Frontend `.env` | Supabase anon/publishable key (safe to expose in the browser) |
| `VITE_SUPABASE_PROJECT_ID` | Frontend `.env` | Supabase project identifier (optional, for some integrations) |
| `LOVABLE_API_KEY` | **Supabase edge function env** (dashboard) | Server-side secret. Set in Supabase Dashboard → Edge Functions → Environment Variables. **Never in the frontend `.env`.** |

The frontend `.env` is gitignored. The server-side key is configured in Supabase's dashboard and read by the edge function at runtime via `Deno.env.get("LOVABLE_API_KEY")`.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full secrets model.

---

## Testing

```sh
npm test          # run vitest (component tests)
npm run build     # build for production
```

The test suite covers the form, results screen, and header components. There is no Playwright E2E setup running locally — the suite is written for CI.

---

## Known limitations

- **Single salon.** The Google review URL is hardcoded to one place ID (Lakme Salon For Him And Her, Goregaon East, Mumbai). The app is built for that salon specifically.
- **No analytics.** There is no instrumentation, no event tracking, no usage metrics. The app does not track how many reviews are drafted, copied, or posted.
- **No posting automation.** "Copy & Open Google Reviews" copies text and opens a page. The user must manually paste, star, and submit on Google. There is no Google Business Profile API integration.
- **AI output is not guaranteed.** The AI can still produce a review that doesn't perfectly match what the user experienced. The app makes the draft editable and shows what it was based on so the user can verify and correct it.
- **Edge function requires Supabase + Lovable API key.** The app cannot generate reviews without both a Supabase project and a configured Lovable API key on the edge function.
- **No auth.** Anyone with the link can use it. There is no user account, no login.

---

## AI-assisted development

This project was developed with AI assistance. The codebase, architecture decisions, prompt design, and documentation were shaped in collaboration with AI coding tools. The real-world constraints — honest review drafting, anti-hallucination guardrails, user control, no fabricated metrics — are the author's product decisions.

The git history reflects AI-assisted commits. This is disclosed here rather than hidden.

---

## Current project status

Functional prototype. The core flow works: form → edge function → AI draft → editable results → copy/open Google. The product is usable for a single salon. Known limitations above are not yet addressed.

---

Built by Asim Kumar.
