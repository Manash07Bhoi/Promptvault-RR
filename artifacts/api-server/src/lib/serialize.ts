/**
 * Serialization whitelist helpers.
 * All API responses MUST go through these to prevent accidental field leakage.
 */

import type { usersTable, packsTable, categoriesTable, ordersTable, orderItemsTable } from "@workspace/db";

type UserRow = typeof usersTable.$inferSelect;
type PackRow = typeof packsTable.$inferSelect;
type CategoryRow = typeof categoriesTable.$inferSelect;
type OrderRow = typeof ordersTable.$inferSelect;
type OrderItemRow = typeof orderItemsTable.$inferSelect;

/**
 * Public user profile — never includes passwordHash, refreshToken, stripeCustomerId, etc.
 */
export function serializeUser(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    // NEVER INCLUDED: passwordHash, refreshToken, resetPasswordToken, resetPasswordExpiresAt,
    //                 emailVerificationToken, stripeCustomerId, updatedAt (internal), lastLoginAt
  };
}

/**
 * Admin user view — slightly more fields but still no credentials.
 */
export function serializeUserAdmin(user: UserRow) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    // NEVER INCLUDED: passwordHash, refreshToken, resetPasswordToken, stripeCustomerId
  };
}

/**
 * Public pack listing — excludes revenue, internal moderation fields.
 */
export function serializePackPublic(pack: PackRow, extra?: { categoryName?: string | null; categorySlug?: string | null }) {
  return {
    id: pack.id,
    title: pack.title,
    slug: pack.slug,
    shortDescription: pack.shortDescription,
    description: pack.description,
    categoryId: pack.categoryId,
    categoryName: extra?.categoryName ?? null,
    categorySlug: extra?.categorySlug ?? null,
    status: pack.status,
    aiToolTargets: pack.aiToolTargets || [],
    promptCount: pack.promptCount,
    priceCents: pack.priceCents,
    comparePriceCents: pack.comparePriceCents,
    isFree: pack.isFree,
    isFeatured: pack.isFeatured,
    isBestseller: pack.isBestseller,
    thumbnailUrl: pack.thumbnailUrl,
    previewImageUrl: pack.previewImageUrl,
    tags: pack.tags || [],
    totalDownloads: pack.totalDownloads,
    avgRating: pack.avgRating,
    reviewCount: pack.reviewCount,
    publishedAt: pack.publishedAt ? pack.publishedAt.toISOString() : null,
    createdAt: pack.createdAt.toISOString(),
    seoTitle: pack.seoTitle,
    seoDescription: pack.seoDescription,
    // NEVER INCLUDED: totalRevenueCents, moderatedBy, moderatedAt, aiGenerationId, deletedAt
  };
}

/**
 * Admin pack view — includes internal fields needed for management.
 */
export function serializePackAdmin(pack: PackRow, extra?: { categoryName?: string | null; categorySlug?: string | null }) {
  return {
    ...serializePackPublic(pack, extra),
    totalRevenueCents: pack.totalRevenueCents,
    moderatedBy: pack.moderatedBy,
    moderatedAt: pack.moderatedAt ? pack.moderatedAt.toISOString() : null,
    updatedAt: pack.updatedAt.toISOString(),
    deletedAt: pack.deletedAt ? pack.deletedAt.toISOString() : null,
  };
}

/**
 * Category public serialization.
 */
export function serializeCategory(cat: CategoryRow) {
  return {
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description,
    icon: cat.icon,
    color: cat.color,
    packCount: cat.packCount,
    isFeatured: cat.isFeatured,
    sortOrder: cat.sortOrder,
    createdAt: cat.createdAt.toISOString(),
  };
}

/**
 * Order item serialization (no internal DB fields).
 */
export function serializeOrderItem(item: OrderItemRow, packSlug = "") {
  return {
    id: item.id,
    packId: item.packId,
    packSlug,
    titleSnapshot: item.titleSnapshot,
    priceCents: item.priceCents,
    downloadCount: item.downloadCount,
    firstDownloadedAt: item.firstDownloadedAt ? item.firstDownloadedAt.toISOString() : null,
  };
}

/**
 * Order serialization (no internal fields like stripeSessionId exposed to buyers).
 */
export function serializeOrder(order: OrderRow, items: ReturnType<typeof serializeOrderItem>[]) {
  return {
    id: order.id,
    userId: order.userId,
    status: order.status,
    subtotalCents: order.subtotalCents,
    discountCents: order.discountCents,
    taxCents: order.taxCents,
    totalCents: order.totalCents,
    currency: order.currency,
    stripePaymentIntentId: order.stripePaymentIntentId,
    completedAt: order.completedAt ? order.completedAt.toISOString() : null,
    createdAt: order.createdAt.toISOString(),
    items,
    // NEVER INCLUDED: ipAddress, userAgent, stripeSessionId
  };
}
