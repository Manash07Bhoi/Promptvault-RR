import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { FlaskConical, Plus, Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const MOCK_EXPERIMENTS = [
  { id: 1, name: "homepage_v2_layout", description: "Test new homepage layout with featured packs", status: "running", variants: [{ name: "control", allocation: 50 }, { name: "variant_a", allocation: 50 }], participantCount: 1234 },
  { id: 2, name: "pack_card_cta", description: "Test 'Add to Cart' vs 'Get Pack' button label", status: "running", variants: [{ name: "add_to_cart", allocation: 50 }, { name: "get_pack", allocation: 50 }], participantCount: 867 },
  { id: 3, name: "checkout_flow", description: "Single-page checkout vs multi-step checkout", status: "paused", variants: [{ name: "single_page", allocation: 50 }, { name: "multi_step", allocation: 50 }], participantCount: 234 },
];

const STATUS_COLOR: Record<string, string> = {
  running: "bg-green-500/10 text-green-500",
  paused: "bg-amber-500/10 text-amber-500",
  stopped: "bg-muted text-muted-foreground",
  draft: "bg-blue-500/10 text-blue-500",
};

export default function AdminExperimentsPage() {
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">A/B Testing</h1>
            <p className="text-muted-foreground text-sm">Manage experiments and feature flags</p>
          </div>
          <Button className="gap-2"><Plus className="w-4 h-4" /> New Experiment</Button>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1"><Activity className="w-4 h-4 text-green-500" /><span className="text-xs text-muted-foreground">Running</span></div>
            <div className="text-2xl font-bold text-foreground">2</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-blue-500" /><span className="text-xs text-muted-foreground">Total Participants</span></div>
            <div className="text-2xl font-bold text-foreground">2,335</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-1"><FlaskConical className="w-4 h-4 text-violet-500" /><span className="text-xs text-muted-foreground">Total Experiments</span></div>
            <div className="text-2xl font-bold text-foreground">{MOCK_EXPERIMENTS.length}</div>
          </div>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          {MOCK_EXPERIMENTS.map(exp => (
            <div key={exp.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm font-semibold text-foreground">{exp.name}</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_COLOR[exp.status])}>
                      {exp.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{exp.description}</p>
                </div>
                <div className="flex gap-2">
                  {exp.status === "running" ? (
                    <Button size="sm" variant="outline">Pause</Button>
                  ) : (
                    <Button size="sm" variant="outline">Resume</Button>
                  )}
                  <Button size="sm" variant="outline">Results</Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {exp.participantCount.toLocaleString()} participants</span>
                <span>{exp.variants.length} variants</span>
              </div>
              <div className="mt-3 space-y-1.5">
                {exp.variants.map(v => (
                  <div key={v.name} className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground w-24">{v.name}</span>
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${v.allocation}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{v.allocation}%</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
