import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const visitTypes = ["Haircut", "Hair Color", "Keratin/Smoothing", "Facial/Cleanup", "Manicure/Pedicure", "Styling/Makeover", "Other"];
const tones = ["Professional", "Friendly", "Fun & Stylish", "Practical & Time-Saving", "Relaxing & Pampering", "Inspirational"];
const personas = ["Student", "Working Professional", "Entrepreneur", "Homemaker", "Freelancer", "Other"];
const reasons = ["Nearby location", "Good reviews", "Clean & hygienic", "Skilled staff", "Value for money", "Recommendation"];
const likes = ["Expert stylists", "Service quality", "Cleanliness", "Pricing", "Staff behavior", "Ambience", "Timeliness"];
const impacts = ["Boosted confidence", "Loved the hairstyle", "Time saved", "Great value", "Perfect for an event"];

export interface FormData {
  visitType: string;
  tone: string;
  persona: string;
  reason: string;
  liked: string;
  impact: string;
  staffName: string;
  notes: string;
}

interface ReviewFormProps {
  onSubmit: (data: FormData) => void;
  isLoading: boolean;
}

const ReviewForm = ({ onSubmit, isLoading }: ReviewFormProps) => {
  const [form, setForm] = useState<FormData>({
    visitType: "",
    tone: "",
    persona: "",
    reason: "",
    liked: "",
    impact: "",
    staffName: "",
    notes: "",
  });

  const isValid = form.visitType && form.tone && form.persona && form.reason && form.liked && form.impact;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onSubmit(form);
  };

  const renderSelect = (label: string, field: keyof FormData, options: string[]) => (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label} *</Label>
      <Select value={form[field]} onValueChange={(v) => setForm((p) => ({ ...p, [field]: v }))}>
        <SelectTrigger className="bg-card">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="px-4 space-y-4 pb-4">
      {renderSelect("Visit Type", "visitType", visitTypes)}
      {renderSelect("Experience Tone", "tone", tones)}
      {renderSelect("Who Are You?", "persona", personas)}
      {renderSelect("Why Lakme Salon?", "reason", reasons)}
      {renderSelect("What You Liked Most?", "liked", likes)}
      {renderSelect("Impact/Outcome", "impact", impacts)}

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Staff/Stylist Name <span className="text-muted-foreground">(optional)</span></Label>
        <Input
          value={form.staffName}
          onChange={(e) => setForm((p) => ({ ...p, staffName: e.target.value }))}
          placeholder="e.g. Priya"
          className="bg-card"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-foreground">Additional Notes <span className="text-muted-foreground">(optional, 10–30 words)</span></Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
          placeholder="Any personal detail to make it authentic..."
          rows={2}
          className="bg-card"
        />
      </div>

      <p className="text-xs text-muted-foreground italic">
        Keep it honest—this tool just helps you express it better.
      </p>

      <Button
        type="submit"
        disabled={!isValid || isLoading}
        className="w-full h-12 text-base font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 border-2 border-secondary-foreground/30 border-t-secondary-foreground rounded-full animate-spin" />
            Generating...
          </span>
        ) : (
          "Generate My Reviews ✨"
        )}
      </Button>
    </form>
  );
};

export default ReviewForm;
