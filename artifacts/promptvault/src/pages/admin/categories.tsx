import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Tag, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminListCategories, useAdminCreateCategory, useAdminUpdateCategory, useAdminDeleteCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);

  const { data: categories, isLoading, isError, refetch } = useAdminListCategories({
    query: { queryKey: ["adminCategories"] }
  });

  const { mutateAsync: createCategory, isPending: creating } = useAdminCreateCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category created!");
        queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
        setIsCreateOpen(false);
        resetForm();
      },
      onError: () => toast.error("Failed to create category"),
    }
  });

  const { mutateAsync: updateCategory, isPending: updating } = useAdminUpdateCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category updated!");
        queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
        setEditingCat(null);
        resetForm();
      },
      onError: () => toast.error("Failed to update category"),
    }
  });

  const { mutateAsync: deleteCategory } = useAdminDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category deleted");
        queryClient.invalidateQueries({ queryKey: ["adminCategories"] });
      },
      onError: () => toast.error("Cannot delete category with existing packs"),
    }
  });

  const resetForm = () => {
    setName(""); setSlug(""); setIcon(""); setSortOrder("0"); setIsFeatured(false);
  };

  const openEdit = (cat: any) => {
    setEditingCat(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setIcon(cat.icon || "");
    setSortOrder(String(cat.sortOrder));
    setIsFeatured(cat.isFeatured);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCategory({
      data: { name, slug: slug || name.toLowerCase().replace(/\s+/g, "-"), icon, sortOrder: Number(sortOrder), isFeatured } as any
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCategory({
      id: editingCat.id,
      data: { name, slug, icon, sortOrder: Number(sortOrder), isFeatured } as any
    });
  };

  const catList = Array.isArray(categories) ? categories : [];

  const CategoryForm = ({ onSubmit, isPending }: { onSubmit: (e: React.FormEvent) => void; isPending: boolean }) => (
    <form className="space-y-4 py-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <label className="text-sm font-medium">Name</label>
        <Input placeholder="e.g. Content Creation" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Slug</label>
          <Input placeholder="content-creation" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Icon (Emoji)</label>
          <Input placeholder="✨" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sort Order</label>
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
        <div className="space-y-2 flex flex-col justify-end">
          <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded border-border"
            />
            Featured
          </label>
        </div>
      </div>
      <Button type="submit" className="w-full mt-4" disabled={isPending}>
        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        Save Category
      </Button>
    </form>
  );

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Categories</h1>
            <p className="text-muted-foreground mt-1">Manage prompt pack categories</p>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={(o) => { setIsCreateOpen(o); if (!o) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
              </DialogHeader>
              <CategoryForm onSubmit={handleCreate} isPending={creating} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <AlertCircle className="w-8 h-8 text-destructive opacity-60" />
              <p className="text-muted-foreground text-sm">Failed to load categories</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Retry
              </Button>
            </div>
          ) : catList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Tag className="w-10 h-10 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground text-sm">No categories yet</p>
              <p className="text-xs text-muted-foreground">Click "Add Category" to create the first category</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-[60px]">Icon</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Packs</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {catList.map((cat: any) => (
                  <TableRow key={cat.id} className="border-border">
                    <TableCell className="text-2xl">{cat.icon || "📁"}</TableCell>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cat.slug}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cat.packCount ?? 0} packs</Badge>
                    </TableCell>
                    <TableCell>
                      {cat.isFeatured ? (
                        <Badge className="bg-primary/20 text-primary border-primary/30">Featured</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">Standard</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{cat.sortOrder}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(cat)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCategory({ id: cat.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <Dialog open={!!editingCat} onOpenChange={(o) => { if (!o) { setEditingCat(null); resetForm(); } }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
            </DialogHeader>
            <CategoryForm onSubmit={handleUpdate} isPending={updating} />
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminLayout>
  );
}
