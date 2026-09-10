import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

describe("ReviewForm minimal", () => {
  const mockSubmit = vi.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
  });

  it("renders rating stars", async () => {
    const mod = await import("../components/ReviewForm");
    const ReviewForm = mod.default;
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    const stars = screen.getAllByRole("radio");
    expect(stars).toHaveLength(5);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("submit disabled initially", async () => {
    const mod = await import("../components/ReviewForm");
    const ReviewForm = mod.default;
    render(<ReviewForm onSubmit={mockSubmit} isLoading={false} />);

    expect(
      screen.getByRole("button", { name: /Draft My Review/i })
    ).toBeDisabled();
  });
});
