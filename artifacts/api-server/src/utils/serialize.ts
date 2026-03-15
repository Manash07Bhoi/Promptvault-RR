export function serializeUser(user: Record<string, unknown>) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    status: user.status,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
  };
}

export function serializePackPublic(pack: Record<string, unknown>, category?: Record<string, unknown> | null) {
  return {
    id: pack.id,
    title: pack.title,
    slug: pack.slug,
    shortDescription: pack.shortDescription,
    description: pack.description,
    categoryId: pack.categoryId,
    categoryName: category?.name ?? null,
    categorySlug: category?.slug ?? null,
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
    publishedAt: pack.publishedAt,
    createdAt: pack.createdAt,
    seoTitle: pack.seoTitle,
    seoDescription: pack.seoDescription,
  };
}
