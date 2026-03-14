import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const GOOGLE_REVIEW_URL = "https://search.google.com/local/writereview?placeid=ChIJpczd7ae35zsRiOjaXsb9Uj4";

const Stars = () => (
  <div className="flex gap-0.5 mb-2">
    {[1, 2, 3, 4, 5].map((i) => (
      <span key={i} className="text-lg">⭐</span>
    ))}
  </div>
);

interface ResultsScreenProps {
  shortReview: string;
  detailedReview: string;
  onReset: () => void;
}

const ReviewCard = ({ title, review, gradient }: { title: string; review: string; gradient: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(review);
    setCopied(true);
    toast({ title: "Copied!", description: "Review copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePost = async () => {
    await navigator.clipboard.writeText(review);
    toast({ title: "Copied!", description: "Now paste it on Google Reviews." });
    window.open(GOOGLE_REVIEW_URL, "_blank");
  };

  return (
    <Card className={`border-0 shadow-lg ${gradient}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-display">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Stars />
        <p className="text-sm leading-relaxed text-card-foreground">{review}</p>
        <div className="flex gap-2">
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
            onClick={handlePost}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/90"
          >
            📝 Post on Google
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const ResultsScreen = ({ shortReview, detailedReview, onReset }: ResultsScreenProps) => {
  return (
    <div className="px-4 space-y-4 pb-6">
      <ReviewCard
        title="⚡ Short Review"
        review={shortReview}
        gradient="bg-gradient-to-br from-muted to-card"
      />
      <ReviewCard
        title="📝 Detailed Review"
        review={detailedReview}
        gradient="bg-gradient-to-br from-muted to-card"
      />

      <div className="bg-card border border-border rounded-lg p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">📌 How to Post</p>
        <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
          <li>Tap "Post on Google"</li>
          <li>Select stars (rate as you feel)</li>
          <li>Paste your review → Submit</li>
        </ol>
      </div>

      <Button
        variant="outline"
        onClick={onReset}
        className="w-full h-11 text-base"
      >
        🔄 Generate New Reviews
      </Button>
    </div>
  );
};

export default ResultsScreen;
