import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewForm from "../components/ReviewForm";
import ResultsScreen from "../components/ResultsScreen";
import Header from "../components/Header";

describe("Audit Phase 2 — critical checks", () => {
  const noop = vi.fn();

  // ── ReviewForm: renders fields and rating ───────────────────────────────
  describe("ReviewForm", () => {
    it("renders all 6 fields + 5 rating stars", () => {
      render(<ReviewForm onSubmit={noop} isLoading={false} />);
      expect(screen.getByText(/Your Rating/i)).toBeInTheDocument();
      expect(screen.getByText(/Visit Type/i)).toBeInTheDocument();
      expect(screen.getByText(/What stood out to you\?/i)).toBeInTheDocument();
      expect(
        screen.getByText(/What would you want another customer to know\?/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Staff \/ Stylist Name/i)).toBeInTheDocument();
      expect(screen.getByText(/Additional Context/i)).toBeInTheDocument();
      expect(screen.getAllByRole("radio")).toHaveLength(5);
      expect(screen.getByRole("radiogroup")).toHaveAttribute(
        "aria-label",
        "Your rating, 1 to 5 stars"
      );
    });

    it("submit disabled until required filled", () => {
      render(<ReviewForm onSubmit={noop} isLoading={false} />);
      expect(
        screen.getByRole("button", { name: /Draft My Review/i })
      ).toBeDisabled();

      // rating 5 + visit type + stoodOut + tellOthers
      fireEvent.click(screen.getAllByRole("radio")[4]);
      const combo = screen.getAllByRole("combobox")[0];
      fireEvent.click(combo);
      fireEvent.click(screen.getByText("Haircut"));
      const tbs = screen.getAllByRole("textbox");
      fireEvent.change(tbs[0], { target: { value: "Great" } });
      fireEvent.change(tbs[1], { target: { value: "Good tip" } });

      expect(
        screen.getByRole("button", { name: /Draft My Review/i })
      ).toBeEnabled();
    });

    it("rating star aria-checked toggles", () => {
      render(<ReviewForm onSubmit={noop} isLoading={false} />);
      const stars = screen.getAllByRole("radio");
      expect(stars[2]).not.toHaveAttribute("aria-checked", "true");
      fireEvent.click(stars[2]);
      expect(stars[2]).toHaveAttribute("aria-checked", "true");
      expect(stars[2]).toHaveAccessibleName("3 stars");
    });
  });

  // ── ResultsScreen: honesty ──────────────────────────────────────────────
  describe("ResultsScreen", () => {
    const baseProps = {
      formData: {
        rating: 3,
        visitType: "Haircut",
        stoodOut: "ok",
        tellOthers: "info",
        staffName: "",
        context: "",
      },
      shortReview: "Short text.",
      detailedReview: "Detailed text.",
      onRegenerate: noop,
    };

    it("shows trust banner + honest CTA + rating + no 'Post on Google'", () => {
      render(<ResultsScreen {...baseProps} />);

      expect(screen.getByText(/AI helped draft this/i)).toBeInTheDocument();
      expect(
        screen.getByText(/edit anything that doesn't match/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/You control the final review/i)).toBeInTheDocument();
      expect(
        screen.getByRole("img", { name: /3 out of 5 stars/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Copy & Open Google Reviews/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Post on Google/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Draft Again with Same Answers/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/What this draft was based on/i)).toBeInTheDocument();
    });

    it("edits review inline", async () => {
      render(<ResultsScreen {...baseProps} shortReview="Original." />);
      fireEvent.click(screen.getAllByRole("button", { name: /Edit/i })[0]);
      const ta = screen.getByRole("textbox", {
        name: /Short review — edit as you like/i,
      });
      expect(ta).toBeInTheDocument();
      fireEvent.change(ta, { target: { value: "Edited." } });
      fireEvent.click(screen.getAllByRole("button", { name: /Done editing/i })[0]);
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.getByText("Edited.")).toBeInTheDocument();
    });

    it("1-star shows 1 star, no marketing-speak", () => {
      render(
        <ResultsScreen
          {...baseProps}
          formData={{ ...baseProps.formData, rating: 1, stoodOut: "bad" }}
          shortReview="The color faded and looked uneven."
          detailedReview="Detailed."
        />
      );
      expect(
        screen.getByRole("img", { name: /1 out of 5 stars/i })
      ).toBeInTheDocument();
      const txt = screen
        .getByText("Short Review", { selector: "card" })
        .getByText(/The color faded/)
        .textContent;
      expect(txt).not.toContain("wonderful");
      expect(txt).not.toContain("amazing");
      expect(txt).not.toContain("best in");
    });

    it("variant toggle switches cards", async () => {
      render(<ResultsScreen {...baseProps} />);
      expect(screen.getByText("Short Review")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Detailed" }));
      expect(screen.getByText("Detailed Review")).toBeInTheDocument();
    });
  });

  // ── Header ──────────────────────────────────────────────────────────────
  describe("Header", () => {
    it("no Powered by AI badge, correct title", () => {
      render(<Header />);
      expect(screen.queryByText(/Powered by AI/i)).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Lakme Salon Review Assistant/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/Draft an honest review/i)).toBeInTheDocument();
    });
  });
});
