import { useState, useEffect } from "react";
import Header from "@/components/Header";
import ReviewForm, { FormData } from "@/components/ReviewForm";
import ResultsScreen from "@/components/ResultsScreen";
import StatsNote from "@/components/StatsNote";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const AI_REQUEST_TIMEOUT_MS = 30_000;

type AppState = "form" | "loading" | "results";

const STORAGE_KEY = "lakme-review-form";


// ── invokeWithTimeout ─────────────────────────────────────────────────────────
// supabase.js v2 does not accept AbortSignal in functions.invoke().
// We race the invoke against a timeout promise so the UI never hangs.

function invokeWithTimeout(
  fn: () => Promise<{ data: any; error: any }>,
  timeoutMs: number
): Promise<{ data: any; error: any }> {
  let settled = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    const id = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new DOMException("The operation was aborted.", "AbortError"));
      }
    }, timeoutMs);
    (timeoutPromise as any)._clear = () => clearTimeout(id);
  });

  const invokePromise = fn();

  return Promise.race([invokePromise, timeoutPromise]).then(
    (v) => {
      settled = true;
      (timeoutPromise as any)._clear?.();
      return v as { data: any; error: any };
    },
    (e) => {
      settled = true;
      (timeoutPromise as any)._clear?.();
      throw e;
    }
  ) as Promise<{ data: any; error: any }>;
}

const Index = () => {
  const [state, setState] = useState<AppState>("form");
  const [formData, setFormData] = useState<FormData | null>(null);
  const [shortReview, setShortReview] = useState("");
  const [detailedReview, setDetailedReview] = useState("");

  // Persist form answers so a page refresh doesn't lose them mid-draft
  useEffect(() => {
    if (state === "form" && formData) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData, state]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as FormData;
        const hasAnswers =
          parsed.rating > 0 ||
          parsed.visitType ||
          parsed.stoodOut ||
          parsed.tellOthers;
        if (hasAnswers) {
          setFormData(parsed);
        }
      }
    } catch {
      // ignore corrupt stored data
    }
  }, []);

  const handleSubmit = async (data: FormData) => {
    setFormData(data);
    setState("loading");

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const result = await invokeWithTimeout(
        () => supabase.functions.invoke("generate-review", { body: data }),
        AI_REQUEST_TIMEOUT_MS
      );

      if (result.error) throw result.error;
      if (result.data?.error) throw new Error(String(result.data.error));

      setShortReview(result.data.short);
      setDetailedReview(result.data.detailed);
      setState("results");
    } catch (e: any) {
      console.error(e);
      const timedOut =
        e?.name === "AbortError" ||
        String(e).includes("Aborted") ||
        String(e).includes("timeout");
      toast({
        title: timedOut ? "Request timed out" : "Couldn't draft right now",
        description: timedOut
          ? "The request took too long. Please try again."
          : e?.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
      setState("form");
    } finally {
      clearTimeout(tid);
    }
  };

  const handleRegenerate = async () => {
    if (!formData) return;
    setState("loading");

    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), AI_REQUEST_TIMEOUT_MS);

    try {
      const result = await invokeWithTimeout(
        () => supabase.functions.invoke("generate-review", { body: formData }),
        AI_REQUEST_TIMEOUT_MS
      );

      if (result.error) throw result.error;
      if (result.data?.error) throw new Error(String(result.data.error));

      setShortReview(result.data.short);
      setDetailedReview(result.data.detailed);
      setState("results");
    } catch (e: any) {
      console.error(e);
      const timedOut =
        e?.name === "AbortError" ||
        String(e).includes("Aborted") ||
        String(e).includes("timeout");
      toast({
        title: timedOut ? "Request timed out" : "Regeneration failed",
        description: timedOut
          ? "The request took too long. Please try again."
          : e?.message || "Please try again.",
        variant: "destructive",
      });
      setState("results");
    } finally {
      clearTimeout(tid);
    }
  };

  const handleReset = () => {
    setState("form");
    setFormData(null);
    setShortReview("");
    setDetailedReview("");
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <Header />
      <StatsNote />

      {state === "form" && (
        <ReviewForm
          onSubmit={handleSubmit}
          isLoading={false}
        />
      )}

      {state === "loading" && (
        <div
          className="flex flex-col items-center justify-center py-16 px-4 space-y-4"
          aria-live="polite"
          aria-atomic="true"
          role="status"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted border-t-secondary animate-spin" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Drafting your review...
          </p>
          <p className="text-xs text-muted-foreground">
            This takes a few seconds
          </p>
        </div>
      )}

      {state === "results" && formData && (
        <ResultsScreen
          formData={formData}
          shortReview={shortReview}
          detailedReview={detailedReview}
          onRegenerate={handleRegenerate}
        />
      )}

      <Footer />
    </div>
  );
};

export default Index;
