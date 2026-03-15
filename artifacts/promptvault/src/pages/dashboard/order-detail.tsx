import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, CreditCard, Calendar, FileText, AlertCircle, Package, Star } from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { useGetOrder } from "@workspace/api-client-react";
import { motion } from "framer-motion";

interface OrderDetailProps {
  id: string;
}

export default function OrderDetail({ id }: OrderDetailProps) {
  const { data: order, isLoading, isError } = useGetOrder(Number(id), {
    query: { enabled: !!id && !isNaN(Number(id)) } as any
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-8 bg-card border border-border rounded animate-pulse w-48" />
          <div className="h-12 bg-card border border-border rounded animate-pulse w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-64 bg-card border border-border rounded-2xl animate-pulse" />
            <div className="h-64 bg-card border border-border rounded-2xl animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !order) {
    return (
      <DashboardLayout>
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard/purchases">
            <Button variant="ghost" size="sm" className="mb-6 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Purchases
            </Button>
          </Link>
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <AlertCircle className="w-12 h-12 text-destructive opacity-60" />
            <h2 className="text-xl font-bold">Order Not Found</h2>
            <p className="text-muted-foreground text-sm">This order doesn't exist or you don't have access to it.</p>
            <Link href="/dashboard/purchases">
              <Button variant="outline">Back to Purchases</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl mx-auto">
        <div>
          <Link href="/dashboard/purchases">
            <Button variant="ghost" size="sm" className="mb-4 -ml-3 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Purchases
            </Button>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h1 className="text-3xl font-display font-bold tracking-tight">Order #{order.id}</h1>
            <div className="flex gap-3">
              <Badge className={order.status === "COMPLETED" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"}>
                {order.status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card border-border md:col-span-2">
            <CardHeader className="bg-card/50 border-b border-border">
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Items Purchased
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[50%]">Item</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items || []).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{item.titleSnapshot}</p>
                          {item.packSlug && (
                            <Link href={`/packs/${item.packSlug}`} className="text-xs text-primary hover:underline">
                              View pack details
                            </Link>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(item.priceCents)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.packId && (
                            <Link href={`/dashboard/review/${item.packId}`}>
                              <Button size="sm" variant="outline" className="gap-1.5">
                                <Star className="w-3.5 h-3.5" /> Review
                              </Button>
                            </Link>
                          )}
                          <Link href="/dashboard/downloads">
                            <Button size="sm" variant="secondary">
                              <Download className="w-4 h-4 mr-1" /> Download
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-card/50 border-t border-border p-6 flex flex-col items-end">
              <div className="w-full max-w-xs space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotalCents)}</span>
                </div>
                {(order.discountCents ?? 0) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-400">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discountCents)}</span>
                  </div>
                )}
                {(order.taxCents ?? 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax</span>
                    <span>{formatPrice(order.taxCents)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.totalCents)}</span>
                </div>
              </div>
            </CardFooter>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Order Date</p>
                    <p className="font-semibold">{formatDate(order.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Payment</p>
                    <p className="font-semibold text-sm">
                      {order.stripePaymentIntentId ? `Stripe ···${order.stripePaymentIntentId.slice(-4)}` : order.totalCents === 0 ? "Free" : "Completed"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Order ID</p>
                    <p className="font-mono text-sm">#{order.id}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(order.items || []).length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-1 text-center">Love these prompts?</h3>
                  <p className="text-sm text-muted-foreground mb-4 text-center">Share your experience to help others.</p>
                  <div className="space-y-2">
                    {(order.items as any[]).filter(item => item.packId).map((item: any) => (
                      <Link key={item.id} href={`/dashboard/review/${item.packId}`}>
                        <Button variant="outline" className="w-full justify-start gap-2 text-sm">
                          <Star className="w-3.5 h-3.5 text-amber-400" />
                          Review: {item.titleSnapshot}
                        </Button>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
