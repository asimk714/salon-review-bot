import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ── Rating helper ──────────────────────────────────────────────────────────
// Renders 5 selectable stars. Selected stars filled, unselected stars empty.
// The whole row is one keyboard-focusable control (tab once, arrow keys move).
const RatingField = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">Your Rating *</Label>
      <div
        role="radiogroup"
        aria-label="Your rating, 1 to 5 stars"
        className="flex gap-1.5 pt-0.5"
      >
        {stars.map((s) => (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={value === s}
            aria-label={`${s} star${s === 1 ? "" : "s"}`}
            onClick={() => onChange(s)}
            className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xl transition-colors
              ${
                value === s
                  ? "bg-secondary text-secondary-foreground shadow-sm"
                  : "bg-card text-muted-foreground hover:bg-muted/50"
              }
            `}
          >
            {s <= value ? "★" : "☆"}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground italic">
        {value === 0
          ? "Select your rating"
          : value === 5
          ? "Excellent"
          : value === 4
          ? "Great"
          : value === 3
          ? "Good"
          : value === 2
          ? "Okay"
          : "Poor"}
      </p>
    </div>
  );
};

// ── Form data shape ────────────────────────────────────────────────────────
export interface FormData {
  rating: number;
  visitType: string;
  stoodOut: string;
  tellOthers: string;
  staffName: string;
  context: string;
}

// ── Options ────────────────────────────────────────────────────────────────
const visitTypes = [
  "Haircut",
  "Hair Color",
  "Keratin / Smoothing",
  "Facial / Cleanup",
  "Manicure / Pedicure",
  "Styling / Makeover",
  "Makeup",
  "Other",
];

// ── Component ──────────────────────────────────────────────────────────────
interface ReviewFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const ReviewForm = ({ onSubmit, isLoading }: ReviewFormProps) => {
  const [form, setForm] = useState<FormData>({
    rating: 0,
    visitType: "",
    stoodOut: "",
    tellOthers: "",
    staffName: "",
    context: "",
  });

  const requiredFilled =
    form.rating > 0 &&
    form.visitType &&
    form.stoodOut.trim().length > 0 &&
    form.tellOthers.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredFilled) return;
    onSubmit(form);
  };

  const renderSelect = (label: string, field: keyof FormData, options: string[]) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label} *</Label>
      <Select
        value={form[field]}
        onValueChange={(v) => setForm((p) => ({ ...p, [field]: v }))}
      >
        <SelectTrigger className="bg-card">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-4">
      {/* Rating */}
      <RatingField
        value={form.rating}
        onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
      />

      {/* Visit type */}
      {renderSelect("Visit Type", "visitType", visitTypes)}

      {/* What stood out */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          What stood out to you? *
        </Label>
        <Textarea
          value={form.stoodOut}
          onChange={(e) =>
            setForm((p) => ({ ...p, stoodOut: e.target.value }))
          }
          placeholder="e.g. The stylist listened carefully, the atmosphere was calm, the finish looked natural..."
          rows={3}
          className="bg-card"
          aria-describedby="stoodOut-desc"
        />
        <p id="stoodOut-desc" className="text-xs text-muted-foreground">
          Be specific — this becomes the heart of your review.
        </p>
      </div>

      {/* What to tell others */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          What would you want another customer to know? *
        </Label>
        <Textarea
          value={form.tellOthers}
          onChange={(e) =>
            setForm((p) => ({ ...p, tellOthers: e.target.value }))
          }
          placeholder="e.g. Book ahead on weekends. Worth the price for the quality. Good for sensitive skin."
          rows={3}
          className="bg-card"
          aria-describedby="tellOthers-desc"
        />
        <p id="tellOthers-desc" className="text-xs text-muted-foreground">
          Practical, honest advice — not marketing copy.
        </p>
      </div>

      {/* Optional staff name */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Staff / Stylist Name{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Input
          value={form.staffName}
          onChange={(e) =>
            setForm((p) => ({ ...p, staffName: e.target.value }))
          }
          placeholder="e.g. Priya"
          className="bg-card"
        />
      </div>

      {/* Optional additional context */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">
          Additional Context{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          value={form.context}
          onChange={(e) =>
            setForm((p) => ({ ...p, context: e.target.value }))
          }
          placeholder="Any detail that would make this review authentic to you..."
          rows={2}
          className="bg-card"
          aria-describedby="context-desc"
        />
        <p id="context-desc" className="text-xs text-muted-foreground">
          e.g. "I've been coming here for 2 years" or "First time visiting"
        </p>
      </div>

      <p className="text-xs text-muted-foreground italic">
        This tool helps you express your experience clearly. What you write is
        what you experienced.
      </p>

      <Button
        type="submit"
        disabled={!requiredFilled || isLoading}
        className="w-full h-12 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span
              className="h-4 w-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin"
            />
            Drafting...
          </span>
        ) : (
          "Draft My Review"
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
