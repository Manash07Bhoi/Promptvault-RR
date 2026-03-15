import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuthStore } from "@/store/use-auth-store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import {
  Shield, CheckCircle2, Clock, Upload, Camera, Building2,
  Linkedin, Twitter, Globe, AlertCircle, ChevronRight, Lock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const VERIFICATION_STEPS = [
  {
    id: "email",
    icon: CheckCircle2,
    title: "Email Verified",
    desc: "Your email address is confirmed.",
    completed: true,
  },
  {
    id: "identity",
    icon: Camera,
    title: "Identity Verification",
    desc: "Upload a government-issued ID to verify your identity.",
    completed: false,
    badge: "Required for payouts",
  },
  {
    id: "social",
    icon: Linkedin,
    title: "Social Profile",
    desc: "Link a LinkedIn, Twitter/X, or personal website to build trust.",
    completed: false,
  },
  {
    id: "business",
    icon: Building2,
    title: "Business Verification",
    desc: "Provide business registration details (optional — for company accounts).",
    completed: false,
    badge: "Optional",
  },
];

type VerificationStep = "email" | "identity" | "social" | "business" | null;

export default function VerificationPage() {
  const { accessToken, user } = useAuthStore();
  const { toast } = useToast();
  const [activeStep, setActiveStep] = useState<VerificationStep>(null);
  const [socialUrl, setSocialUrl] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessReg, setBusinessReg] = useState("");

  const { data: verificationStatus } = useQuery({
    queryKey: ["verification-status"],
    queryFn: async () => {
      const res = await fetch("/api/user/verification", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return null;
      return res.json();
    },
  });

  const submitSocialMutation = useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch("/api/user/verification/social", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ profileUrl: url }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your social profile is under review." });
      setActiveStep(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" }),
  });

  const submitBusinessMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/user/verification/business", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ businessName, registrationNumber: businessReg }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Submitted!", description: "Your business details are under review." });
      setActiveStep(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to submit. Please try again.", variant: "destructive" }),
  });

  const completedCount = VERIFICATION_STEPS.filter((s) => s.completed || verificationStatus?.[s.id]).length;
  const progressPct = Math.round((completedCount / VERIFICATION_STEPS.length) * 100);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Account Verification</h1>
              <p className="text-sm text-muted-foreground">Build trust with buyers and unlock full creator features.</p>
            </div>
          </div>

          {/* Progress */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Verification Progress</span>
              <span className="text-sm font-bold text-primary">{progressPct}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {completedCount} of {VERIFICATION_STEPS.length} steps completed
            </p>
          </div>
        </motion.div>

        {/* Benefits */}
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Why Verify?
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {[
              "Verified badge on your profile",
              "Higher trust with buyers",
              "Access to payout features",
              "Priority in search results",
              "Unlock affiliate program",
              "Business account features",
            ].map((b) => (
              <div key={b} className="flex items-center gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                {b}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {VERIFICATION_STEPS.map((step, i) => {
            const isCompleted = step.completed || verificationStatus?.[step.id];
            const isPending = verificationStatus?.[`${step.id}Pending`];
            const isActive = activeStep === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`rounded-2xl border bg-card overflow-hidden transition-all ${
                  isActive ? "border-primary/40" : "border-border"
                }`}
              >
                <div className="p-5 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isCompleted ? "bg-emerald-500/10" : isPending ? "bg-amber-500/10" : "bg-muted"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : isPending ? (
                      <Clock className="w-5 h-5 text-amber-500" />
                    ) : (
                      <step.icon className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold text-foreground">{step.title}</span>
                      {step.badge && (
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5">{step.badge}</Badge>
                      )}
                      {isCompleted && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border text-[10px] py-0 px-1.5">Verified</Badge>}
                      {isPending && <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 border text-[10px] py-0 px-1.5">In Review</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  {!isCompleted && !isPending && step.id !== "email" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0"
                      onClick={() => setActiveStep(isActive ? null : (step.id as VerificationStep))}
                    >
                      {isActive ? "Cancel" : "Start"}
                    </Button>
                  )}
                </div>

                {/* Social Form */}
                {isActive && step.id === "social" && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                    <Label className="text-xs">Link your profile</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          className="pl-9"
                          placeholder="https://linkedin.com/in/yourname"
                          value={socialUrl}
                          onChange={(e) => setSocialUrl(e.target.value)}
                        />
                      </div>
                      <Button
                        disabled={!socialUrl || submitSocialMutation.isPending}
                        onClick={() => submitSocialMutation.mutate(socialUrl)}
                      >
                        Submit
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Accepted: LinkedIn, Twitter/X, personal website, GitHub</p>
                  </div>
                )}

                {/* Identity Form */}
                {isActive && step.id === "identity" && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Identity verification is processed securely. Upload a government-issued ID (passport, driver's license, or national ID). We'll verify within 24–48 hours.
                      </p>
                    </div>
                    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/30 transition-colors cursor-pointer">
                      <Upload className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Drop your ID here or <span className="text-primary">browse</span></p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG or PDF — Max 10MB</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Your ID is encrypted and never stored longer than verification requires.</span>
                    </div>
                  </div>
                )}

                {/* Business Form */}
                {isActive && step.id === "business" && (
                  <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="biz-name" className="text-xs">Business Name</Label>
                        <Input
                          id="biz-name"
                          placeholder="Acme Corp"
                          value={businessName}
                          onChange={(e) => setBusinessName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="biz-reg" className="text-xs">Registration Number</Label>
                        <Input
                          id="biz-reg"
                          placeholder="EIN / Company No."
                          value={businessReg}
                          onChange={(e) => setBusinessReg(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      disabled={!businessName || submitBusinessMutation.isPending}
                      onClick={() => submitBusinessMutation.mutate()}
                    >
                      Submit for Review
                    </Button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Note */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Questions about verification? <a href="/contact" className="text-primary hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
