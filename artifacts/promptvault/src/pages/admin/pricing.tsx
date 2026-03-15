import { useState } from "react";
import { AdminLayout } from "@/components/layout/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Tag, Percent, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminListCoupons, useAdminCreateCoupon, useAdminDeleteCoupon, useGetAdminPricing, useUpdateAdminPricing } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function PricingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("coupons");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState("PERCENT");
  const [newValue, setNewValue] = useState("");
  const [newMaxUses, setNewMaxUses] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");

  const { data: coupons = [], isLoading: couponsLoading, isError: couponsError, refetch: refetchCoupons } = useAdminListCoupons({
    query: { queryKey: ["adminCoupons"] }
  });

  const { data: pricingData, isLoading: pricingLoading } = useGetAdminPricing({
    query: {
      queryKey: ["adminPricing"],
      onSuccess: (data: any) => setDefaultPrice(String(data?.defaultPriceCents || 999)),
    } as any
  });

  const { mutateAsync: createCoupon, isPending: creating } = useAdminCreateCoupon({
    mutation: {
      onSuccess: () => {
        toast.success("Coupon created!");
        queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
        setIsDialogOpen(false);
        setNewCode(""); setNewValue(""); setNewMaxUses(""); setNewType("PERCENT");
      },
      onError: () => toast.error("Failed to create coupon"),
    }
  });

  const { mutateAsync: deleteCoupon } = useAdminDeleteCoupon({
    mutation: {
      onSuccess: () => {
        toast.success("Coupon deleted");
        queryClient.invalidateQueries({ queryKey: ["adminCoupons"] });
      },
      onError: () => toast.error("Failed to delete coupon"),
    }
  });

  const { mutateAsync: updatePricing, isPending: savingPrice } = useUpdateAdminPricing({
    mutation: {
      onSuccess: () => toast.success("Default price updated"),
      onError: () => toast.error("Failed to update pricing"),
    }
  });

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || !newValue) return;
    await createCoupon({
      data: {
        code: newCode.toUpperCase(),
        discountType: newType as "PERCENT" | "FIXED",
        discountValue: Number(newValue),
        maxUses: newMaxUses ? Number(newMaxUses) : null,
        isActive: true,
      } as any
    });
  };

  const couponList = Array.isArray(coupons) ? coupons : [];
  const categoryPricing = pricingData?.categoryPricing || [];

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold">Pricing & Coupons</h1>
            <p className="text-muted-foreground mt-1">Manage discounts and pricing rules</p>
          </div>

          {activeTab === "coupons" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Coupon
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Coupon</DialogTitle>
                </DialogHeader>
                <form className="space-y-4 py-4" onSubmit={handleCreateCoupon}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Coupon Code</label>
                    <Input
                      placeholder="SUMMER2024"
                      className="uppercase"
                      required
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Discount Type</label>
                      <Select value={newType} onValueChange={setNewType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENT">Percentage (%)</SelectItem>
                          <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Value</label>
                      <Input
                        type="number"
                        placeholder={newType === "PERCENT" ? "20" : "10"}
                        required
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Max Uses (Optional)</label>
                    <Input
                      type="number"
                      placeholder="Leave empty for unlimited"
                      value={newMaxUses}
                      onChange={(e) => setNewMaxUses(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full mt-4" disabled={creating}>
                    {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Coupon
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex gap-2 border-b border-border pb-px">
          {["coupons", "rules"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-[1px] transition-colors capitalize ${
                activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground"
              }`}
            >
              {tab === "coupons" ? "Coupons" : "Price Rules"}
            </button>
          ))}
        </div>

        {activeTab === "coupons" && (
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {couponsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : couponsError ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <AlertCircle className="w-8 h-8 text-destructive opacity-60" />
                <p className="text-muted-foreground text-sm">Failed to load coupons</p>
                <Button variant="outline" size="sm" onClick={() => refetchCoupons()} className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Retry
                </Button>
              </div>
            ) : couponList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Tag className="w-10 h-10 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground text-sm">No coupons created yet</p>
                <p className="text-xs text-muted-foreground">Click "Add Coupon" to create your first discount code</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Uses</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponList.map((coupon: any) => (
                    <TableRow key={coupon.id} className="border-border">
                      <TableCell>
                        <span className="font-mono font-semibold tracking-wide bg-black/30 px-2 py-1 rounded text-primary text-sm">
                          {coupon.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        {coupon.discountType === "PERCENT"
                          ? `${coupon.discountValue}% off`
                          : `$${(coupon.discountValue).toFixed(2)} off`}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {coupon.usesCount ?? 0} / {coupon.maxUses ?? '∞'}
                      </TableCell>
                      <TableCell>
                        {coupon.isActive ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteCoupon({ id: coupon.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Tag className="w-5 h-5 text-primary" /> Default Pricing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Global Default Price (cents)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={defaultPrice || pricingData?.defaultPriceCents || 999}
                      onChange={(e) => setDefaultPrice(e.target.value)}
                      placeholder="999"
                    />
                    <Button
                      variant="secondary"
                      disabled={savingPrice}
                      onClick={() => updatePricing({ data: { defaultPriceCents: Number(defaultPrice) } })}
                    >
                      {savingPrice ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Currently: {pricingLoading ? "..." : `$${((pricingData?.defaultPriceCents || 999) / 100).toFixed(2)}`} — Applied to new packs if no category rule exists.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Percent className="w-5 h-5 text-secondary" /> Category Pricing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pricingLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted/20 rounded animate-pulse" />)}
                  </div>
                ) : categoryPricing.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No categories configured.</p>
                ) : (
                  <div className="space-y-2">
                    {categoryPricing.map((c: any) => (
                      <div key={c.categoryId} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-border">
                        <span className="font-medium text-sm">{c.categoryName}</span>
                        <span className="font-mono text-emerald-400 text-sm">${(c.defaultPriceCents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
}
