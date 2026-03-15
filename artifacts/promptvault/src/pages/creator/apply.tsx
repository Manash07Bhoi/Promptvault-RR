import { PublicLayout } from "@/components/layout/public-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { CheckCircle, Sparkles, Package, DollarSign, Users, X, Plus, ArrowRight } from "lucide-react";

const PERKS = [
  { icon: DollarSign, title: "Earn 70% revenue share", desc: "Industry-leading commission on every pack sale" },
  { icon: Users, title: "Reach 50,000+ buyers", desc: "Instant access to our growing community" },
  { icon: Package, title: "Full creator tools", desc: "Analytics, pack builder, payout dashboard" },
  { icon: CheckCircle, title: "Creator verification badge", desc: "Stand out with a verified creator profile" },
];

export default function BecomeCreatorPage() {
  const { isAuthenticated, accessToken } = useAuthStore();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [bio, setBio] = useState("");
  const [specialtyInput, setSpecialtyInput] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const { data: statusData } = useQuery({
    queryKey: ["creator-status"],
    queryFn: async () => {
      const res = await fetch("/api/creator/status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
    enabled: !!isAuthenticated,
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/creator/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ bio, specialties }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => setSubmitted(true),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSpecialty = () => {
    const v = specialtyInput.trim();
    if (v && !specialties.includes(v) && specialties.length < 8) {
      setSpecialties(prev => [...prev, v]);
      setSpecialtyInput("");
    }
  };

  // Already a creator
  if (statusData?.isCreator) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold text-foreground">You're already a creator!</h1>
          <p className="text-muted-foreground mt-2">Head to your creator dashboard to manage packs and view analytics.</p>
          <Link href="/creator/dashboard"><Button className="mt-6 gap-2">Go to Creator Dashboard <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
      </PublicLayout>
    );
  }

  // Pending application
  if (statusData?.application?.status === "pending") {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground">Application Under Review</h1>
          <p className="text-muted-foreground mt-2">We'll review your application within 2–3 business days and notify you by email.</p>
        </div>
      </PublicLayout>
    );
  }

  // Success state
  if (submitted) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-display font-bold text-foreground">Application Submitted!</h1>
          <p className="text-muted-foreground mt-2">We'll review your application within 2–3 business days and email you the outcome.</p>
          <Link href="/dashboard"><Button variant="outline" className="mt-6">Back to Dashboard</Button></Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Creator Program</Badge>
          <h1 className="text-4xl sm:text-6xl font-display font-bold text-foreground mb-4">
            Share Your AI Expertise.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-violet-400">Earn Real Income.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Join top AI prompt creators selling on PromptVault. Earn 70% on every sale and reach thousands of buyers.
          </p>
        </div>

        {/* Perks */}
        <div className="grid sm:grid-cols-2 gap-4 mb-14">
          {PERKS.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Application Form */}
        <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card p-8 space-y-6">
          <h2 className="text-xl font-display font-bold text-foreground">Apply to Become a Creator</h2>

          {!isAuthenticated && (
            <div className="rounded-lg bg-primary/10 border border-primary/30 p-4 text-sm text-primary">
              Please <Link href="/login" className="font-semibold underline">sign in</Link> or <Link href="/signup" className="font-semibold underline">create an account</Link> before applying.
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground">Tell us about yourself</label>
            <Textarea
              className="mt-1.5 resize-none"
              rows={5}
              placeholder="What AI tools do you specialise in? What types of prompts do you create? Any portfolio or examples?"
              value={bio}
              onChange={e => setBio(e.target.value)}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground mt-1 text-right">{bio.length}/1000</p>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">Specialties</label>
            <div className="flex gap-2 mt-1.5">
              <Input
                placeholder="ChatGPT, Marketing, Coding..."
                value={specialtyInput}
                onChange={e => setSpecialtyInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSpecialty())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSpecialty}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {specialties.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {specialties.map(s => (
                  <Badge key={s} variant="secondary" className="gap-1 pr-1">
                    {s}
                    <button onClick={() => setSpecialties(prev => prev.filter(x => x !== s))}>
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full gap-2"
            disabled={!isAuthenticated || !bio.trim() || applyMutation.isPending}
            onClick={() => applyMutation.mutate()}
          >
            Submit Application <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            By applying you agree to our <Link href="/legal/content-policy" className="underline">Content Policy</Link> and <Link href="/legal/creator-terms" className="underline">Creator Terms</Link>.
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}
