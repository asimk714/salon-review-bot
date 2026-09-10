import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import type { FormData } from "./ReviewForm";

// ── Google link ────────────────────────────────────────────────────────────
const GOOGLE_REVIEW_URL =
  "https://search.google.com/local/writereview?placeid=ChIJpczd7ae35zsRiOjaXsb9Uj4";

// ── Star display (read-only, accessible) ───────────────────────────────────
const StarDisplay = ({ rating }: { rating: number }) => (
  <div
    role="img"
    aria-label={`${rating} out of 5 stars`}
    className="flex gap-0.5 mb-2"
  >
    {[1, 2, 3, 4, 5].map((s) => (
      <span key={s} aria-hidden="true">
        {s <= rating ? "★" : "☆"}
      </span>
    ))}
  </div>
);

// ── Review card ────────────────────────────────────────────────────────────
interface ReviewCardProps {
  variant: "short" | "detailed";
  review: string;
  rating: number;
  onEditChange: (text: string) => void;
  isEditing: boolean;
}

const ReviewCard = ({
  variant,
  review,
  rating,
  onEditChange,
  isEditing,
}: ReviewCardProps) => {
  const [copied, setCopied] = useState(false);

  const currentText = isEditing ? review : review;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    toast({
      title: "Copied",
      description: "Review text copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyAndOpen = async () => {
    await navigator.clipboard.writeText(currentText);
    toast({
      title: "Copied",
      description: "Now paste it on Google Reviews.",
    });
    window.open(GOOGLE_REVIEW_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-muted to-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-display">
            {variant === "short" ? "Short Review" : "Detailed Review"}
          </CardTitle>
          <StarDisplay rating={rating} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {isEditing ? (
          <Textarea
            value={review}
            onChange={(e) => onEditChange(e.target.value)}
            rows={5}
            className="bg-card min-h-[120px]"
            aria-label={`${variant} review — edit as you like`}
          />
        ) : (
          <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">
            {review}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex-1 bg-card/80 hover:bg-card"
          >
            {copied ? "✓ Copied" : "📋 Copy"}
          </Button>
          <Button
            size="sm"
            onClick={handleCopyAndOpen}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            📝 Copy & Open Google Reviews
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // toggle edit on the current card's text
              onEditChange(currentText);
            }}
            className="shrink-0"
          >
            {isEditing ? "✓ Done editing" : "✎ Edit"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Main results screen ────────────────────────────────────────────────────
interface ResultsScreenProps {
  formData: FormData;
  shortReview: string;
  detailedReview: string;
  onRegenerate: () => void;
}

const ResultsScreen = ({
  formData,
  shortReview,
  detailedReview,
  onRegenerate,
}: ResultsScreenProps) => {
  const [activeVariant, setActiveVariant] = useState<"short" | "detailed">(
    "short"
  );
  const [editedShort, setEditedShort] = useState(shortReview);
  const [editedDetailed, setEditedDetailed] = useState(detailedReview);
  const [isEditing, setIsEditing] = useState(false);

  const currentReview =
    activeVariant === "short" ? editedShort : editedDetailed;

  const handleEditChange = (text: string) => {
    if (activeVariant === "short") {
      setEditedShort(text);
    } else {
      setEditedDetailed(text);
    }
  };

  return (
    <div className="px-4 space-y-4 pb-6">
      {/* Trust banner */}
      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">
          📌 Before you post
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          AI helped draft this from your answers. Please read it carefully —
          edit anything that doesn't match your experience, then post
          manually on Google. You control the final review.
        </p>
      </div>

      {/* Active review card */}
      <ReviewCard
        variant={activeVariant}
        review={currentReview}
        rating={formData.rating}
        onEditChange={handleEditChange}
        isEditing={isEditing}
      />

      {/* Variant toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeVariant === "short" ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setActiveVariant("short");
            setIsEditing(false);
          }}
          className="flex-1"
        >
          Short
        </Button>
        <Button
          variant={activeVariant === "detailed" ? "secondary" : "outline"}
          size="sm"
          onClick={() => {
            setActiveVariant("detailed");
            setIsEditing(false);
          }}
          className="flex-1"
        >
          Detailed
        </Button>
      </div>

      {/* Regenerate */}
      <Button
        variant="outline"
        onClick={onRegenerate}
        className="w-full h-11 text-base"
      >
        🔄 Draft Again with Same Answers
      </Button>

      {/* What we used (transparency) */}
      <details className="group bg-muted/50 border border-border rounded-lg p-3 space-y-1">
        <summary className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
          What this draft was based on
        </summary>
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Visit type: {formData.visitType}</p>
          <p>Rating: {formData.rating} / 5</p>
          {formData.staffName && (
            <p>Staff mentioned: {formData.staffName}</p>
          )}
          {formData.context && <p>Context: {formData.context}</p>}
        </div>
      </details>
    </div>
  );
};

export default ResultsScreen;
