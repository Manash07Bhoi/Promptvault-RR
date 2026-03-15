import { useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useCreateReview } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Loader2, MessageSquareHeart, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";

interface WriteReviewProps {
  packId: string;
}

export default function WriteReview({ packId }: WriteReviewProps) {
  const [, setLocation] = useLocation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  const { data: myReviewData, isLoading: checkingReview } = useQuery({
    queryKey: ["my-review", packId],
    queryFn: async () => {
      const { accessToken } = useAuthStore.getState();
      const res = await fetch(`/api/reviews/${packId}/my-review`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!packId && !isNaN(Number(packId)) && !!user,
  });

  const { mutateAsync: createReview, isPending } = useCreateReview({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: ["pack", packId] });
        qc.invalidateQueries({ queryKey: ["packs"] });
        qc.invalidateQueries({ queryKey: ["my-review", packId] });
        toast.success("Review submitted! Thank you for your feedback.");
        setLocation("/dashboard/purchases");
      },
      onError: (err: any) => {
        const msg = (err?.data as any)?.error || err?.message || "Failed to submit review";
        toast.error(msg);
      }
    }
  });

  if (!packId || isNaN(Number(packId))) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-24">
          <AlertCircle className="w-12 h-12 text-destructive opacity-60 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Invalid Pack</h2>
          <p className="text-muted-foreground mb-6">No pack ID was provided for this review.</p>
          <Button variant="outline" onClick={() => setLocation("/dashboard/purchases")}>
            Back to Purchases
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  if (checkingReview) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (myReviewData?.hasReviewed) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto text-center py-24">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Already Reviewed</h2>
          <p className="text-muted-foreground mb-6">
            You have already submitted a review for this pack. You can only review each pack once.
          </p>
          <Button variant="outline" onClick={() => setLocation("/dashboard/purchases")}>
            Back to Purchases
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    if (!title.trim()) {
      toast.error("Please add a review title");
      return;
    }
    if (body.trim().length > 0 && body.trim().length < 10) {
      toast.error("Detailed review must be at least 10 characters");
      return;
    }
    if (body.length > 0 && body.trim().length === 0) {
      toast.error("Review body cannot be whitespace only");
      return;
    }

    await createReview({
      packId: Number(packId),
      data: { rating, title: title.trim(), body: body.trim() }
    });
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Great", "Excellent!"];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight">Write a Review</h1>
          <p className="text-muted-foreground mt-1">Share your experience with this prompt pack.</p>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary" />
          <form onSubmit={handleSubmit}>
            <CardHeader className="text-center pt-10 pb-6">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/20">
                <MessageSquareHeart className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">How was your experience?</CardTitle>
              <CardDescription>
                Your feedback helps others make better decisions.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8 px-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Label className="text-lg font-medium">Select a rating</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          "w-10 h-10 transition-colors",
                          (hoverRating || rating) >= star
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <div className="h-5 text-sm text-primary font-semibold">
                  {ratingLabels[hoverRating || rating]}
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-border">
                <div className="space-y-2">
                  <Label htmlFor="title">Review Title</Label>
                  <Input
                    id="title"
                    placeholder="Summarize your experience..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={150}
                    className="bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body">Detailed Review</Label>
                  <Textarea
                    id="body"
                    placeholder="What did you like? How did you use the prompts? Be specific to help other buyers..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    maxLength={1000}
                    className="min-h-[150px] bg-background"
                  />
                  <p className="text-xs text-muted-foreground text-right">{body.length}/1000</p>
                </div>
              </div>
            </CardContent>

            <CardFooter className="px-8 pb-8 pt-4 flex gap-4 justify-end">
              <Button type="button" variant="ghost" onClick={() => window.history.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Review
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
