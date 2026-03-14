import { useState, useEffect } from "react";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import ReviewForm, { FormData } from "@/components/ReviewForm";
import ResultsScreen from "@/components/ResultsScreen";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type AppState = "form" | "loading" | "results";

const STORAGE_KEY = "lakme-review-form";

const Index = () => {
  const [state, setState] = useState<AppState>("form");
  const [shortReview, setShortReview] = useState("");
  const [detailedReview, setDetailedReview] = useState("");

  const handleSubmit = async (data: FormData) => {
    setState("loading");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    try {
      const { data: result, error } = await supabase.functions.invoke("generate-review", {
        body: data,
      });

      if (error) throw error;
      if (result?.error) throw new Error(result.error);

      setShortReview(result.short);
      setDetailedReview(result.detailed);
      setState("results");
    } catch (e: any) {
      console.error(e);
      toast({
        title: "Error",
        description: e?.message || "Couldn't generate right now. Please try again.",
        variant: "destructive",
      });
      setState("form");
    }
  };

  const handleReset = () => {
    setState("form");
    setShortReview("");
    setDetailedReview("");
  };

  return (
    <div className="min-h-screen bg-background max-w-md mx-auto">
      <Header />
      <StatsBar />

      {state === "form" && (
        <ReviewForm onSubmit={handleSubmit} isLoading={false} />
      )}

      {state === "loading" && (
        <div className="flex flex-col items-center justify-center py-16 px-4 space-y-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-muted border-t-secondary animate-spin" />
          </div>
          <p className="text-sm font-medium text-foreground animate-pulse-glow">
            Crafting your reviews...
          </p>
          <p className="text-xs text-muted-foreground">This takes a few seconds</p>
        </div>
      )}

      {state === "results" && (
        <ResultsScreen
          shortReview={shortReview}
          detailedReview={detailedReview}
          onReset={handleReset}
        />
      )}

      <Footer />
    </div>
  );
};

export default Index;
