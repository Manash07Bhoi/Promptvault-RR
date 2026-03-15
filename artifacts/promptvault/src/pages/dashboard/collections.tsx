import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/use-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";
import {
  Plus, FolderOpen, Package, Users, Globe, Lock, Users2,
  Edit, Trash2, ExternalLink, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", icon: Globe, desc: "Anyone can see this collection" },
  { value: "private", label: "Private", icon: Lock, desc: "Only you can see this" },
  { value: "followers", label: "Followers Only", icon: Users2, desc: "Your followers can see this" },
];

function CollectionFormDialog({
  open,
  collection,
  onClose,
  onSave,
}: {
  open: boolean;
  collection: any | null;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [form, setForm] = useState({
    title: collection?.title || "",
    description: collection?.description || "",
    visibility: collection?.visibility || "public",
  });

  const handleSave = () => {
    if (!form.title.trim()) return;
    onSave({ ...form, id: collection?.id });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{collection ? "Edit Collection" : "New Collection"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Title *</Label>
            <Input
              className="mt-1.5"
              placeholder="e.g. My Marketing Prompts"
              value={form.title}
              maxLength={100}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              className="mt-1.5"
              placeholder="What's this collection about?"
              value={form.description}
              maxLength={500}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground mt-1">{form.description.length}/500</p>
          </div>
          <div>
            <Label>Visibility</Label>
            <div className="mt-2 space-y-2">
              {VISIBILITY_OPTIONS.map(opt => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, visibility: opt.value }))}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all",
                      form.visibility === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", form.visibility === opt.value ? "text-primary" : "text-muted-foreground")} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={!form.title.trim()}>
              {collection ? "Save Changes" : "Create Collection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CollectionCard({
  collection,
  onEdit,
  onDelete,
}: {
  collection: any;
  onEdit: (c: any) => void;
  onDelete: (id: number) => void;
}) {
  const visOpt = VISIBILITY_OPTIONS.find(o => o.value === collection.visibility);
  const VisIcon = visOpt?.icon || Globe;

  return (
    <div className="rounded-xl border border-border bg-card hover:border-primary/30 transition-all">
      {collection.coverImageUrl ? (
        <img
          src={collection.coverImageUrl}
          alt={collection.title}
          className="w-full h-32 object-cover rounded-t-xl"
        />
      ) : (
        <div className="w-full h-32 rounded-t-xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
          <FolderOpen className="w-8 h-8 text-primary/30" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground truncate">{collection.title}</h3>
          <div className="flex gap-1 flex-shrink-0">
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onEdit(collection)}>
              <Edit className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onDelete(collection.id)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
        {collection.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{collection.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> {collection.itemCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> {collection.followerCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <VisIcon className="w-3.5 h-3.5" /> {visOpt?.label}
            </span>
          </div>
          <Link href={`/collections/${collection.id}`}>
            <Button size="icon" variant="ghost" className="h-7 w-7">
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
        {collection.updatedAt && (
          <p className="text-xs text-muted-foreground mt-2">Updated {formatDate(collection.updatedAt)}</p>
        )}
      </div>
    </div>
  );
}

export default function DashboardCollectionsPage() {
  const { accessToken } = useAuthStore();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<any | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["my-collections"],
    queryFn: async () => {
      const res = await fetch("/api/user/collections", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return res.json();
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { id, ...body } = formData;
      const method = id ? "PATCH" : "POST";
      const url = id ? `/api/collections/${id}` : "/api/collections";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: editingCollection ? "Collection updated!" : "Collection created!" });
      qc.invalidateQueries({ queryKey: ["my-collections"] });
      setDialogOpen(false);
      setEditingCollection(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      toast({ title: "Collection deleted" });
      qc.invalidateQueries({ queryKey: ["my-collections"] });
    },
  });

  const collections: any[] = data?.collections || [];

  const openCreate = () => {
    setEditingCollection(null);
    setDialogOpen(true);
  };

  const openEdit = (collection: any) => {
    setEditingCollection(collection);
    setDialogOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">My Collections</h1>
            <p className="text-muted-foreground text-sm">Organise your favourite prompt packs into curated sets</p>
          </div>
          <Button className="gap-2" onClick={openCreate}>
            <Plus className="w-4 h-4" /> New Collection
          </Button>
        </div>

        {/* Public collections browser link */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Browse Public Collections</p>
              <p className="text-xs text-muted-foreground">Discover curated collections from the community</p>
            </div>
          </div>
          <Link href="/collections">
            <Button variant="outline" size="sm">Browse</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border bg-card animate-pulse">
                <div className="h-32 bg-muted rounded-t-xl" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border-2 border-dashed border-border">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No collections yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Create your first collection to organise your prompt packs</p>
            <Button className="gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Create First Collection
            </Button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c: any) => (
              <CollectionCard
                key={c.id}
                collection={c}
                onEdit={openEdit}
                onDelete={(id) => {
                  if (window.confirm("Delete this collection?")) {
                    deleteMutation.mutate(id);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CollectionFormDialog
        open={dialogOpen}
        collection={editingCollection}
        onClose={() => { setDialogOpen(false); setEditingCollection(null); }}
        onSave={(data) => saveMutation.mutate(data)}
      />
    </DashboardLayout>
  );
}
