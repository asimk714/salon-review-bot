import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";

// ── Helper: fill the form and submit ───────────────────────────────────────
async function fillForm(page: Page, opts: {
  rating: number;
  visitType: string;
  stoodOut: string;
  tellOthers: string;
  staffName?: string;
  context?: string;
}) {
  // Rating: click the Nth star (1-indexed)
  const stars = page.locator('button[role="radio"][aria-label*="star"]');
  await stars.nth(opts.rating - 1).click();

  // Visit type
  await page.locator('text=Visit Type').pressTab();
  await page.locator('[role="combobox"]').first().click();
  await page.getByText(opts.visitType, { exact: true }).click();

  // What stood out
  await page.locator('textarea').first().fill(opts.stoodOut);

  // What to tell others (second textarea)
  await page.locator('textarea').nth(1).fill(opts.tellOthers);

  // Optional staff name
  if (opts.staffName) {
    await page.locator('input[placeholder="e.g. Priya"]').fill(opts.staffName);
  }

  // Optional context
  if (opts.context) {
    await page.locator('textarea[placeholder*="detail that would make"]').fill(
      opts.context
    );
  }

  // Submit
  await page.getByRole("button", { name: /Draft My Review/i }).click();
}

test("full journey: form → loading → results → edit → copy/Google", async ({
  page,
}) => {
  await page.goto("http://localhost:8080");
  await page.waitForLoadState("domcontentloaded");

  // ── Page title & header ────────────────────────────────────────────────
  await expect(page).toHaveTitle(/Lakme Salon Review Assistant/);
  await expect(page.locator("h1")).toHaveText(
    "Lakme Salon Review Assistant"
  );
  await expect(page.getByText(/Draft an honest review/i)).toBeVisible();

  // ── No fabricated stats ─────────────────────────────────────────────────
  await expect(
    page.getByText(/1000\+ Served/i)
  ).not.toBeVisible();
  await expect(page.getByText(/4\.7\/5/i)).not.toBeVisible();
  // StatsNote should be visible
  await expect(page.getByText(/Your drafts stay on this device/i)).toBeVisible();

  // ── No "Powered by AI" badge ────────────────────────────────────────────
  await expect(page.getByText(/Powered by AI/i)).not.toBeVisible();

  // ── Rating control exists ───────────────────────────────────────────────
  const starButtons = page.locator('button[role="radio"]');
  await expect(starButtons).toHaveCount(5);

  // ── Form fields present ─────────────────────────────────────────────────
  await expect(page.getByText("Your Rating")).toBeVisible();
  await expect(page.getByText("Visit Type")).toBeVisible();
  await expect(page.getByText("What stood out to you?")).toBeVisible();
  await expect(page.getByText("What would you want another customer to know?")).toBeVisible();
  await expect(page.getByText("Staff / Stylist Name")).toBeVisible();
  await expect(page.getByText("Additional Context")).toBeVisible();

  // ── Submit button disabled until rating selected ────────────────────────
  const submitBtn = page.getByRole("button", { name: /Draft My Review/i });
  await expect(submitBtn).toBeDisabled();

  // ── 1. Fill form (positive review) ─────────────────────────────────────
  await fillForm(page, {
    rating: 5,
    visitType: "Haircut",
    stoodOut:
      "The stylist listened carefully to what I wanted and didn't rush me.",
    tellOthers:
      "Book ahead on weekends — it gets busy. Worth it for the attention to detail.",
    staffName: "Priya",
    context: "First time visiting this branch.",
  });

  await expect(submitBtn).toBeEnabled();

  // ── 2. Loading state ────────────────────────────────────────────────────
  await page.waitForSelector(
    'div[role="status"] p:text("Drafting your review...")',
    { timeout: 10000 }
  );

  // ── 3. Results screen ────────────────────────────────────────────────────
  await page.waitForSelector('text=Before you post', { timeout: 20000 });

  await expect(page.getByText(/AI helped draft this/i)).toBeVisible();
  await expect(page.getByText(/edit anything that doesn't match/i)).toBeVisible();
  await expect(page.getByText(/You control the final review/i)).toBeVisible();

  // Rating stars shown in results (5 filled, 0 empty)
  const resultStars = page.locator('[role="img"][aria-label*="out of 5 stars"]');
  await expect(resultStars).toHaveCount(1);
  await expect(resultStars).toHaveAttribute("aria-label", "5 out of 5 stars");

  // Short and Detailed variant buttons
  await expect(page.getByRole("button", { name: "Short" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Detailed" })).toBeVisible();

  const activeCard = page.locator('card:has-text("Short Review")').first();
  await expect(activeCard).toBeVisible();

  // "Copy & Open Google Reviews" — honest wording
  await expect(
    page.getByRole("button", { name: /Copy & Open Google Reviews/i })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Post on Google/i })
  ).not.toBeVisible();

  // Regenerate button
  await expect(page.getByRole("button", { name: /Draft Again with Same Answers/i })).toBeVisible();

  // ── 4. Switch to detailed variant ───────────────────────────────────────
  await page.getByRole("button", { name: "Detailed" }).click();
  await expect(page.locator('card:has-text("Detailed Review")').first()).toBeVisible();

  // ── 5. Edit the short review ────────────────────────────────────────────
  await page.getByRole("button", { name: "Short" }).click();
  await page.getByRole("button", { name: /Edit/i }).first().click();

  const textarea = page.locator('textarea[aria-label*="Short review"]').first();
  await expect(textarea).toBeVisible();
  await textarea.fill("Updated: The stylist listened carefully and I left happy.");
  await page.getByRole("button", { name: /Done editing/i }).first().click();
  await expect(textarea).not.toBeVisible();

  // ── 6. Copy button copies text ──────────────────────────────────────────
  await page.getByRole("button", { name: "📋 Copy" }).first().click();
  await expect(page.getByText("Copied")).toBeVisible();

  // ── 7. Copy & Open Google ───────────────────────────────────────────────
  const googlePopup = page.waitForEvent("popup", { timeout: 5000 });
  await page.getByRole("button", { name: /Copy & Open Google Reviews/i }).click();
  const popup = await googlePopup;
  await expect(popup).toHaveURL(/search\.google\.com\/local\/writereview/);

  // ── 8. Regenerate ───────────────────────────────────────────────────────
  await page.getByRole("button", { name: /Draft Again with Same Answers/i }).click();
  await page.waitForSelector(
    'div[role="status"] p:text("Drafting your review...")',
    { timeout: 10000 }
  );
  await page.waitForSelector('text=Before you post', { timeout: 20000 });
  await expect(page.getByText(/AI helped draft this/i)).toBeVisible();

  // ── 9. Transparency details ─────────────────────────────────────────────
  await expect(page.getByText("What this draft was based on")).toBeVisible();
});

test("1-star review: rating is preserved, tone is disappointed but fair", async ({
  page,
}) => {
  await page.goto("http://localhost:8080");
  await page.waitForLoadState("domcontentloaded");

  await fillForm(page, {
    rating: 1,
    visitType: "Hair Color",
    stoodOut: "The color faded very quickly and looked uneven after a week.",
    tellOthers:
      "I wouldn't recommend for color that needs to last. Ask to see a portfolio first.",
    staffName: "Meena",
  });

  await page.waitForSelector('text=Before you post', { timeout: 20000 });

  const resultStars = page.locator('[role="img"][aria-label*="out of 5 stars"]');
  await expect(resultStars).toHaveAttribute("aria-label", "1 out of 5 stars");

  // The review text should mention the rating-appropriate tone
  const reviewText = page
    .locator('card:has-text("Short Review")')
    .locator("p")
    .first()
    .innerText();
  // Should not contain marketing-speak
  expect(reviewText).not.toContain("wonderful");
  expect(reviewText).not.toContain("amazing");
  expect(reviewText).not.toContain("best in");
});

test("form validation: submit disabled until required fields filled", async ({
  page,
}) => {
  await page.goto("http://localhost:8080");
  await page.waitForLoadState("domcontentloaded");

  const submitBtn = page.getByRole("button", { name: /Draft My Review/i });

  // Only rating selected — should still be disabled (needs visitType, stoodOut, tellOthers)
  await page.locator('button[role="radio"]').nth(2).click();
  await expect(submitBtn).toBeDisabled();

  // Rating + visit type — still disabled (needs stoodOut, tellOthers)
  await page.locator('[role="combobox"]').first().click();
  await page.getByText("Haircut", { exact: true }).click();
  await expect(submitBtn).toBeDisabled();

  // All required fields — enabled
  await page.locator('textarea').first().fill("It was a nice experience.");
  await page.locator('textarea').nth(1).fill("Come here.");
  await expect(submitBtn).toBeEnabled();
});

test("a11y: stars are keyboard navigable, form fields have labels", async ({
  page,
}) => {
  await page.goto("http://localhost:8080");
  await page.waitForLoadState("domcontentloaded");

  // Tab into the star radiogroup
  await page.keyboard.press("Tab");
  const focused = page.locator("button[role=\"radio\"]").first();
  await expect(focused).toBeFocused();

  // Arrow right moves to next star
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("button[role=\"radio\"]").nth(1)).toBeFocused();

  // All textarea and input fields have associated labels
  const textareas = page.locator("textarea");
  await expect(textareas.first()).toHaveAccessibleName(/What stood out to you/i);
  await expect(textareas.nth(1)).toHaveAccessibleName(
    /What would you want another customer to know/i
  );
});
