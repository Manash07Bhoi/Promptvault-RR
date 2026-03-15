import { describe, it, expect } from "vitest";
import { serializeOrder, serializeOrderItem } from "../lib/serialize.js";
import type { ordersTable, orderItemsTable } from "@workspace/db";

type OrderRow = typeof ordersTable.$inferSelect;
type OrderItemRow = typeof orderItemsTable.$inferSelect;

describe("serializeOrderItem", () => {
  it("serializes an order item and hides internal fields", () => {
    const mockOrderItem: OrderItemRow = {
      id: 101,
      orderId: 50, // internal DB reference
      packId: 200,
      priceCents: 1500,
      titleSnapshot: "Pro Pack",
      downloadCount: 5,
      firstDownloadedAt: new Date("2023-01-01T12:00:00Z"),
    };

    const serialized = serializeOrderItem(mockOrderItem, "pro-pack");

    expect(serialized).toEqual({
      id: 101,
      packId: 200,
      packSlug: "pro-pack",
      titleSnapshot: "Pro Pack",
      priceCents: 1500,
      downloadCount: 5,
      firstDownloadedAt: "2023-01-01T12:00:00.000Z",
    });

    // Ensure orderId is explicitly NOT present
    expect((serialized as any).orderId).toBeUndefined();
  });

  it("handles null firstDownloadedAt correctly", () => {
    const mockOrderItem: OrderItemRow = {
      id: 102,
      orderId: 50,
      packId: 201,
      priceCents: 1000,
      titleSnapshot: "Starter Pack",
      downloadCount: 0,
      firstDownloadedAt: null,
    };

    const serialized = serializeOrderItem(mockOrderItem);

    expect(serialized.firstDownloadedAt).toBeNull();
    expect(serialized.packSlug).toBe("");
  });
});

describe("serializeOrder", () => {
  it("serializes an order and hides sensitive internal fields", () => {
    const mockOrder: OrderRow = {
      id: 1001,
      userId: 55,
      status: "COMPLETED",
      subtotalCents: 2000,
      discountCents: 500,
      taxCents: 150,
      totalCents: 1650,
      currency: "usd",
      stripePaymentIntentId: "pi_12345",
      stripeSessionId: "cs_test_abc123", // SENSITIVE
      refundedAt: null,
      refundReason: null,
      completedAt: new Date("2023-10-01T10:00:00Z"),
      ipAddress: "192.168.1.1", // SENSITIVE
      userAgent: "Mozilla/5.0", // SENSITIVE
      createdAt: new Date("2023-10-01T09:50:00Z"),
      updatedAt: new Date("2023-10-01T10:00:00Z"),
      giftOrderId: null,
      isGift: false,
      creditAppliedCents: 0,
      affiliateConversionId: null,
    };

    const mockSerializedItems = [
      {
        id: 101,
        packId: 200,
        packSlug: "pro-pack",
        titleSnapshot: "Pro Pack",
        priceCents: 1500,
        downloadCount: 5,
        firstDownloadedAt: "2023-01-01T12:00:00.000Z",
      },
    ];

    const serialized = serializeOrder(mockOrder, mockSerializedItems);

    expect(serialized).toEqual({
      id: 1001,
      userId: 55,
      status: "COMPLETED",
      subtotalCents: 2000,
      discountCents: 500,
      taxCents: 150,
      totalCents: 1650,
      currency: "usd",
      stripePaymentIntentId: "pi_12345",
      completedAt: "2023-10-01T10:00:00.000Z",
      createdAt: "2023-10-01T09:50:00.000Z",
      items: mockSerializedItems,
    });

    // Ensure sensitive fields are explicitly NOT present
    expect((serialized as any).ipAddress).toBeUndefined();
    expect((serialized as any).userAgent).toBeUndefined();
    expect((serialized as any).stripeSessionId).toBeUndefined();

    // Ensure other internal DB fields are not exposed
    expect((serialized as any).updatedAt).toBeUndefined();
    expect((serialized as any).refundedAt).toBeUndefined();
    expect((serialized as any).refundReason).toBeUndefined();
    expect((serialized as any).isGift).toBeUndefined();
  });

  it("handles null completedAt correctly", () => {
    const mockOrder: OrderRow = {
      id: 1002,
      userId: 56,
      status: "PENDING",
      subtotalCents: 1000,
      discountCents: 0,
      taxCents: 0,
      totalCents: 1000,
      currency: "usd",
      stripePaymentIntentId: null,
      stripeSessionId: "cs_test_xyz789",
      refundedAt: null,
      refundReason: null,
      completedAt: null,
      ipAddress: "10.0.0.1",
      userAgent: "curl/7.68.0",
      createdAt: new Date("2023-11-01T09:50:00Z"),
      updatedAt: new Date("2023-11-01T09:50:00Z"),
      giftOrderId: null,
      isGift: false,
      creditAppliedCents: 0,
      affiliateConversionId: null,
    };

    const serialized = serializeOrder(mockOrder, []);

    expect(serialized.completedAt).toBeNull();
    expect(serialized.items).toEqual([]);

    // Double check sensitive fields for pending orders
    expect((serialized as any).ipAddress).toBeUndefined();
    expect((serialized as any).userAgent).toBeUndefined();
    expect((serialized as any).stripeSessionId).toBeUndefined();
  });
});
