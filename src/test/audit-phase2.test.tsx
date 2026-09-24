import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewForm from "../components/ReviewForm";
import ResultsScreen from "../components/ResultsScreen";
import Header from "../components/Header";

// ── ReviewForm ─────────────────────────────────────────────────────────────

describe("ReviewForm", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it("renders all required fields", () => {
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    expect(screen.getByText(/Your Rating/i)).toBeInTheDocument();
    expect(screen.getByText(/Visit Type/i)).toBeInTheDocument();
    expect(screen.getByText(/What stood out to you\?/i)).toBeInTheDocument();
    expect(
      screen.getByText(/What would you want another customer to know\?/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Staff \/ Stylist Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Additional Context/i)).toBeInTheDocument();
  });

  it("submit button is disabled until all required fields filled", () => {
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    const submitBtn = screen.getByRole("button", { name: /Draft My Review/i });
    expect(submitBtn).toBeDisabled();

    // rating 5
    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[4]);

    // visit type
    const combobox = screen.getAllByRole("combobox")[0];
    fireEvent.click(combobox);
    fireEvent.click(screen.getByText("Haircut"));

    // stoodOut
    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Great service" } });

    // tellOthers
    fireEvent.change(textboxes[1], { target: { value: "Highly recommend" } });

    expect(submitBtn).toBeEnabled();
  });

  it("calls onSubmit with correct FormData when valid", async () => {
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[3]); // rating 4

    const combobox = screen.getAllByRole("combobox")[0];
    fireEvent.click(combobox);
    fireEvent.click(screen.getByText("Hair Color"));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], {
      target: { value: "The color was even and lasted" },
    });
    fireEvent.change(textboxes[1], { target: { value: "Book on weekdays" } });

    fireEvent.click(screen.getByRole("button", { name: /Draft My Review/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 4,
          visitType: "Hair Color",
          stoodOut: "The color was even and lasted",
          tellOthers: "Book on weekdays",
          staffName: "",
          context: "",
        })
      );
    });
  });

  it("optional fields don't block submit", async () => {
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    const stars = screen.getAllByRole("radio");
    fireEvent.click(stars[1]); // rating 2

    const combobox = screen.getAllByRole("combobox")[0];
    fireEvent.click(combobox);
    fireEvent.click(screen.getByText("Manicure / Pedicure"));

    const textboxes = screen.getAllByRole("textbox");
    fireEvent.change(textboxes[0], { target: { value: "Quick and clean" } });
    fireEvent.change(textboxes[1], { target: { value: "Good for a quick fix" } });

    fireEvent.click(screen.getByRole("button", { name: /Draft My Review/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: 2,
          staffName: "",
          context: "",
        })
      );
    });
  });

  it("rating radiogroup has correct ARIA attributes", () => {
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    const radiogroup = screen.getByRole("radiogroup");
    expect(radiogroup).toBeInTheDocument();
    expect(radiogroup).toHaveAttribute(
      "aria-label",
      "Your rating, 1 to 5 stars"
    );

    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);

    stars.forEach((s) => {
      expect(s).not.toHaveAttribute("aria-checked", "true");
    });

    fireEvent.click(stars[2]);
    expect(stars[2]).toHaveAttribute("aria-checked", "true");
    expect(stars[2]).toHaveAccessibleName("3 stars");
  });
});

// ── ResultsScreen ──────────────────────────────────────────────────────────

describe("ResultsScreen — honesty and UI", () => {
  it("shows trust banner, rating display, and honest Google CTA", () => {
    render(
      <ResultsScreen
        formData={{
          rating: 3,
          visitType: "Haircut",
          stoodOut: "ok",
          tellOthers: "info",
          staffName: "",
          context: "",
        }}
        shortReview="Short draft review text."
        detailedReview="Detailed draft review text."
        onRegenerate={vi.fn()}
      />
    );

    expect(screen.getByText(/AI helped draft this/i)).toBeInTheDocument();
    expect(
      screen.getByText(/edit anything that doesn't match/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/You control the final review/i)).toBeInTheDocument();

    const starDisplay = screen.getByRole("img", {
      name: /3 out of 5 stars/i,
    });
    expect(starDisplay).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Short" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Detailed" })).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /Copy & Open Google Reviews/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Post on Google/i })
    ).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Draft Again with Same Answers/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByText(/What this draft was based on/i)).toBeInTheDocument();
  });

  it("edits the review text inline", async () => {
    render(
      <ResultsScreen
        formData={{
          rating: 4,
          visitType: "Haircut",
          stoodOut: "x",
          tellOthers: "y",
          staffName: "",
          context: "",
        }}
        shortReview="Original short text."
        detailedReview="Detailed text."
        onRegenerate={vi.fn()}
      />
    );

    const editBtns = screen.getAllByRole("button", { name: /Edit/i });
    fireEvent.click(editBtns[0]);

    const textarea = screen.getByRole("textbox", {
      name: /Short review — edit as you like/i,
    });
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: "Edited text." } });

    const doneBtns = screen.getAllByRole("button", { name: /Done editing/i });
    fireEvent.click(doneBtns[0]);

    expect(textarea).not.toBeInTheDocument();
    expect(screen.getByText("Edited text.")).toBeInTheDocument();
  });

  it("1-star review shows 1 star and not marketing-speak", () => {
    render(
      <ResultsScreen
        formData={{
          rating: 1,
          visitType: "Hair Color",
          stoodOut: "faded quickly",
          tellOthers: "not recommended",
          staffName: "Meena",
          context: "",
        }}
        shortReview="The color faded quickly and looked uneven."
        detailedReview="Detailed 1-star review."
        onRegenerate={vi.fn()}
      />
    );

    const starDisplay = screen.getByRole("img", {
      name: /1 out of 5 stars/i,
    });
    expect(starDisplay).toBeInTheDocument();

    const shortText = screen.getByText(/The color faded/).textContent;
    expect(shortText).not.toContain("wonderful");
    expect(shortText).not.toContain("amazing");
    expect(shortText).not.toContain("best in");
  });
});

// ── Header ──────────────────────────────────────────────────────────────────

describe("Header — no fabricated badges", () => {
  it("does not show Powered by AI badge", () => {
    render(<Header />);

    expect(screen.queryByText(/Powered by AI/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /Lakme Salon Review Assistant/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText(/Draft an honest review/i)).toBeInTheDocument();
  });
});
