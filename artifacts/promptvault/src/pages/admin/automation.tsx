import { useState, Fragment, useRef } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Play, RotateCcw, ChevronDown, ChevronUp, Loader2, RefreshCw, Sparkles, CheckCircle2, XCircle, Clock, Zap, Package, Cpu } from "lucide-react";
import { toast } from "sonner";
import { useListAutomationJobs, useTriggerAutomationJob, useAdminListCategories } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

const JOB_TYPES = [
  { value: "GENERATE_PACK", label: "Generate Prompt Pack", icon: "📦", description: "Auto-generate a complete pack with prompts ready for review" },
  { value: "GENERATE_PROMPTS", label: "Generate Prompts Only", icon: "✨", description: "Generate individual prompts for an existing pack" },
  { value: "SYNC_SEARCH", label: "Sync Search Index", icon: "🔍", description: "Rebuild the search index for all published packs" },
  { value: "GENERATE_PDF", label: "Generate PDF Assets", icon: "📄", description: "Generate downloadable PDF files for a pack" },
];

function getStatusConfig(status: string) {
  switch (status?.toUpperCase()) {
    case "RUNNING": return { color: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, dot: "bg-blue-500" };
    case "COMPLETED": return { color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-emerald-500" };
    case "FAILED": return { color: "bg-red-500/10 text-red-400 border-red-500/20", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-red-500" };
    case "PENDING": return { color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-amber-500" };
    case "DEAD": return { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-gray-500" };
    default: return { color: "bg-gray-500/10 text-gray-400 border-gray-500/20", icon: <Clock className="w-3.5 h-3.5" />, dot: "bg-gray-400" };
  }
}

export default function AutomationJobsPage() {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [jobType, setJobType] = useState("GENERATE_PACK");
  const [categoryId, setCategoryId] = useState("");
  const [packTitle, setPackTitle] = useState("");
  const [promptCount, setPromptCount] = useState("10");
  const [priceCents, setPriceCents] = useState("999");
  const [freeAiMode, setFreeAiMode] = useState(true);
  const queryClient = useQueryClient();

  const statusParam = statusFilter === "ALL" ? undefined : statusFilter;

  const { data: jobsResponse, isLoading, refetch } = useListAutomationJobs(
    statusParam ? { status: statusParam as any } : {},
    {
      query: {
        queryKey: ["automationJobs", statusFilter],
        refetchInterval: 5000,
      }
    }
  );

  const { data: categoriesRes } = useAdminListCategories({ query: { queryKey: ["adminCategories"] } });
  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const triggerJob = useTriggerAutomationJob({
    mutation: {
      onSuccess: (data: any) => {
        toast.success("Job triggered! Processing in background...");
        setDialogOpen(false);
        queryClient.invalidateQueries({ queryKey: ["automationJobs"] });
        // Auto-refresh to show progress
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["automationJobs"] }), 2000);
        setTimeout(() => queryClient.invalidateQueries({ queryKey: ["automationJobs"] }), 5000);
      },
      onError: (err: any) => {
        toast.error("Failed to trigger job: " + (err.message || "Unknown error"));
      },
    },
  });

  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const handleTrigger = () => {
    const payload: Record<string, any> = {};
    if (categoryId) payload.categoryId = parseInt(categoryId);
    if (packTitle.trim()) payload.title = packTitle.trim();
    if (promptCount) payload.promptCount = parseInt(promptCount);
    if (priceCents) payload.priceCents = parseInt(priceCents);
    if ((jobType === "GENERATE_PACK" || jobType === "GENERATE_PROMPTS") && freeAiMode) {
      payload.freeAiMode = true;
      payload.aiMode = "free";
    }

    triggerJob.mutate({
      data: {
        jobType: jobType as any,
        payload,
      },
    });
  };

  const tabs = [
    { label: "All", value: "ALL" },
    { label: "Pending", value: "PENDING" },
    { label: "Running", value: "RUNNING" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Failed", value: "FAILED" },
  ];

  const jobs = jobsResponse?.jobs || [];
  const stats = {
    total: jobsResponse?.total || 0,
    running: jobs.filter((j: any) => j.status === "RUNNING").length,
    completed: jobs.filter((j: any) => j.status === "COMPLETED").length,
    failed: jobs.filter((j: any) => j.status === "FAILED").length,
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-display font-bold">Automation Engine</h1>
            <p className="text-muted-foreground mt-1">Trigger AI-powered prompt pack generation and background tasks</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 gap-2">
                  <Zap className="w-4 h-4" /> Trigger Job
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[560px] bg-card border-border">
                <DialogHeader>
                  <DialogTitle className="text-xl font-display">Trigger Automation Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  {/* Job type */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold">Job Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      {JOB_TYPES.map(jt => (
                        <button
                          key={jt.value}
                          onClick={() => setJobType(jt.value)}
                          className={`text-left p-3 rounded-lg border transition-all ${
                            jobType === jt.value
                              ? "border-primary bg-primary/10 shadow-sm"
                              : "border-border hover:border-primary/40 hover:bg-primary/5"
                          }`}
                        >
                          <div className="text-lg mb-1">{jt.icon}</div>
                          <div className="font-semibold text-xs">{jt.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{jt.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {(jobType === "GENERATE_PACK" || jobType === "GENERATE_PROMPTS") && (
                    <>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Category <span className="text-muted-foreground font-normal">(required)</span></label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {(categories || []).map((cat: any) => (
                              <SelectItem key={cat.id} value={String(cat.id)}>
                                {cat.icon} {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold">Pack Title <span className="text-muted-foreground font-normal">(optional — auto-generated if blank)</span></label>
                        <Input
                          placeholder="e.g. Ultimate Marketing Prompts Pack"
                          value={packTitle}
                          onChange={e => setPackTitle(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Number of Prompts</label>
                          <Select value={promptCount} onValueChange={setPromptCount}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {[5, 7, 10].map(n => (
                                <SelectItem key={n} value={String(n)}>{n} prompts</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold">Price (cents)</label>
                          <Select value={priceCents} onValueChange={setPriceCents}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Free ($0.00)</SelectItem>
                              <SelectItem value="499">$4.99</SelectItem>
                              <SelectItem value="999">$9.99</SelectItem>
                              <SelectItem value="1499">$14.99</SelectItem>
                              <SelectItem value="1999">$19.99</SelectItem>
                              <SelectItem value="2999">$29.99</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold">Free AI Mode</span>
                            <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-1.5 py-0">FREE</Badge>
                          </div>
                          <Switch
                            checked={freeAiMode}
                            onCheckedChange={setFreeAiMode}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {freeAiMode
                            ? <>
                                <span className="text-emerald-400 font-medium">Enabled</span> — Uses a free AI model via OpenRouter. No API key required, powered by Replit AI Integrations at no extra cost.
                              </>
                            : <>
                                <span className="text-amber-400 font-medium">Disabled</span> — Uses Anthropic Claude (requires <code className="text-xs bg-muted px-1 rounded">ANTHROPIC_API_KEY</code>). Falls back to the built-in prompt library if no key is set.
                              </>
                          }
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                        <Sparkles className="w-3.5 h-3.5 text-primary inline mr-1.5" />
                        The AI engine will generate professional-grade prompts. The pack will be created with <strong>PENDING_REVIEW</strong> status and must be approved before publishing.
                      </div>
                    </>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t border-border">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleTrigger}
                    disabled={triggerJob.isPending || ((jobType === "GENERATE_PACK" || jobType === "GENERATE_PROMPTS") && !categoryId)}
                    className="gap-2"
                  >
                    {triggerJob.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {triggerJob.isPending ? "Starting..." : "Run Job"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Jobs", value: stats.total, color: "text-foreground" },
            { label: "Running", value: stats.running, color: "text-blue-400" },
            { label: "Completed", value: stats.completed, color: "text-emerald-400" },
            { label: "Failed", value: stats.failed, color: "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 border-b border-border pb-0">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-[1px] transition-colors ${
                statusFilter === tab.value
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading jobs...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[40px]" />
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => {
                  const statusCfg = getStatusConfig(job.status);
                  return (
                    <Fragment key={job.id}>
                      <TableRow className="border-border hover:bg-muted/20">
                        <TableCell>
                          <button onClick={() => toggleRow(job.id.toString())} className="text-muted-foreground hover:text-foreground">
                            {expandedRows[job.id.toString()] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-mono text-xs font-semibold text-foreground">{job.jobType}</span>
                            {job.relatedPackId && <p className="text-[10px] text-muted-foreground mt-0.5">Pack #{job.relatedPackId}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-medium gap-1 ${statusCfg.color}`}>
                            {statusCfg.icon}
                            {job.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                          {job.status === "COMPLETED" && job.result?.message
                            ? <span className="text-emerald-400">{job.result.message?.slice(0, 60) || "Success"}</span>
                            : job.status === "FAILED"
                            ? <span className="text-red-400">{job.errorMessage?.slice(0, 60) || "Failed"}</span>
                            : job.status === "RUNNING"
                            ? <span className="text-blue-400 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Processing...</span>
                            : "—"
                          }
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(job.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{job.retryCount}/{job.maxRetries}</TableCell>
                        <TableCell className="text-right">
                          {job.status === "FAILED" && (
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-primary text-xs">
                              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
                            </Button>
                          )}
                          {job.status === "COMPLETED" && job.result?.packSlug && (
                            <a href={`/packs/${job.result.packSlug}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">
                                <Package className="w-3.5 h-3.5 mr-1" /> View Pack
                              </Button>
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                      {expandedRows[job.id.toString()] && (
                        <TableRow className="border-border bg-muted/10 hover:bg-muted/10">
                          <TableCell colSpan={8} className="p-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">Payload</p>
                                <pre className="bg-black/40 p-3 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto">
                                  {JSON.stringify(job.payload, null, 2) || "{}"}
                                </pre>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                                  {job.errorMessage ? "Error" : "Result"}
                                </p>
                                <pre className={`bg-black/40 p-3 rounded-lg text-xs font-mono overflow-x-auto ${job.errorMessage ? "text-red-400" : "text-emerald-400"}`}>
                                  {job.errorMessage || JSON.stringify(job.result, null, 2) || "—"}
                                </pre>
                              </div>
                            </div>
                            {job.aiTokensUsed > 0 && (
                              <p className="text-[10px] text-muted-foreground mt-3">
                                AI Tokens: {job.aiTokensUsed?.toLocaleString()} · Est. Cost: ${((job.aiCostUsdCents || 0) / 100).toFixed(4)}
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center p-16 text-muted-foreground">
                      <Zap className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p className="font-medium mb-1">No automation jobs yet</p>
                      <p className="text-xs">Click "Trigger Job" to generate your first prompt pack automatically</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
