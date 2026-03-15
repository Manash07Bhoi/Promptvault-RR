import { describe, it, expect } from "vitest";
import { serializePackPublic, serializePackAdmin } from "../lib/serialize";
import type { packsTable } from "@workspace/db";

type PackRow = typeof packsTable.$inferSelect;

describe("serializePackPublic", () => {
  const basePack: PackRow = {
    id: 1,
    title: "Advanced React Prompts",
    slug: "advanced-react-prompts",
    description: "A comprehensive guide to React.",
    shortDescription: "React prompts",
    categoryId: 2,
    status: "PUBLISHED",
    aiToolTargets: ["chatgpt", "claude"],
    promptCount: 50,
    priceCents: 1500,
    comparePriceCents: 2000,
    isFree: false,
    isFeatured: true,
    isBestseller: false,
    thumbnailUrl: "https://example.com/thumb.png",
    previewImageUrl: "https://example.com/preview.png",
    tags: ["react", "frontend"],
    seoTitle: "React Prompts SEO",
    seoDescription: "SEO Description for React",
    totalDownloads: 100,
    totalRevenueCents: 150000, // Should be excluded in public
    avgRating: 4.8,
    reviewCount: 15,
    version: 1,
    aiGenerationId: null, // Should be excluded
    moderatedBy: 99, // Should be excluded
    moderatedAt: new Date("2023-01-01T00:00:00.000Z"), // Should be excluded
    publishedAt: new Date("2023-01-02T00:00:00.000Z"),
    createdAt: new Date("2023-01-01T12:00:00.000Z"),
    updatedAt: new Date("2023-01-03T00:00:00.000Z"), // Excluded in public
    deletedAt: null, // Should be excluded
    creatorId: 5,
    packType: "single",
    licenseType: "commercial",
    viewCount: 500,
    appreciationCount: 20,
    saleEventId: null,
    salePriceCents: null,
    language: "en",
    qualityScore: 90,
  };

  it("should return public fields and exclude internal/admin fields", () => {
    const result = serializePackPublic(basePack);

    // Assert included fields
    expect(result.id).toBe(basePack.id);
    expect(result.title).toBe(basePack.title);
    expect(result.slug).toBe(basePack.slug);
    expect(result.shortDescription).toBe(basePack.shortDescription);
    expect(result.description).toBe(basePack.description);
    expect(result.categoryId).toBe(basePack.categoryId);
    expect(result.status).toBe(basePack.status);
    expect(result.aiToolTargets).toEqual(basePack.aiToolTargets);
    expect(result.promptCount).toBe(basePack.promptCount);
    expect(result.priceCents).toBe(basePack.priceCents);
    expect(result.comparePriceCents).toBe(basePack.comparePriceCents);
    expect(result.isFree).toBe(basePack.isFree);
    expect(result.isFeatured).toBe(basePack.isFeatured);
    expect(result.isBestseller).toBe(basePack.isBestseller);
    expect(result.thumbnailUrl).toBe(basePack.thumbnailUrl);
    expect(result.previewImageUrl).toBe(basePack.previewImageUrl);
    expect(result.tags).toEqual(basePack.tags);
    expect(result.totalDownloads).toBe(basePack.totalDownloads);
    expect(result.avgRating).toBe(basePack.avgRating);
    expect(result.reviewCount).toBe(basePack.reviewCount);
    expect(result.seoTitle).toBe(basePack.seoTitle);
    expect(result.seoDescription).toBe(basePack.seoDescription);

    // Dates
    expect(result.publishedAt).toBe(basePack.publishedAt?.toISOString());
    expect(result.createdAt).toBe(basePack.createdAt.toISOString());

    // Assert default extras are null
    expect(result.categoryName).toBeNull();
    expect(result.categorySlug).toBeNull();

    // Assert excluded fields
    expect("totalRevenueCents" in result).toBe(false);
    expect("moderatedBy" in result).toBe(false);
    expect("moderatedAt" in result).toBe(false);
    expect("aiGenerationId" in result).toBe(false);
    expect("deletedAt" in result).toBe(false);
    expect("updatedAt" in result).toBe(false);
  });

  it("should include extra category fields if provided", () => {
    const result = serializePackPublic(basePack, { categoryName: "Development", categorySlug: "dev" });
    expect(result.categoryName).toBe("Development");
    expect(result.categorySlug).toBe("dev");
  });

  it("should handle null and optional values gracefully", () => {
    const nullablePack: PackRow = {
      ...basePack,
      shortDescription: null,
      description: null,
      comparePriceCents: null,
      thumbnailUrl: null,
      previewImageUrl: null,
      seoTitle: null,
      seoDescription: null,
      avgRating: null,
      publishedAt: null,
      aiToolTargets: null as unknown as string[], // Testing edge case where DB array might be null although schema says default []
      tags: null as unknown as string[],
    };

    const result = serializePackPublic(nullablePack);

    expect(result.shortDescription).toBeNull();
    expect(result.description).toBeNull();
    expect(result.comparePriceCents).toBeNull();
    expect(result.thumbnailUrl).toBeNull();
    expect(result.previewImageUrl).toBeNull();
    expect(result.seoTitle).toBeNull();
    expect(result.seoDescription).toBeNull();
    expect(result.avgRating).toBeNull();
    expect(result.publishedAt).toBeNull();

    // Fallback to empty arrays
    expect(result.aiToolTargets).toEqual([]);
    expect(result.tags).toEqual([]);
  });
});

describe("serializePackAdmin", () => {
  const basePack: PackRow = {
    id: 2,
    title: "Admin Test Pack",
    slug: "admin-test-pack",
    description: "A test pack for admin",
    shortDescription: "Admin test",
    categoryId: 1,
    status: "PENDING_REVIEW",
    aiToolTargets: ["midjourney"],
    promptCount: 10,
    priceCents: 500,
    comparePriceCents: null,
    isFree: false,
    isFeatured: false,
    isBestseller: false,
    thumbnailUrl: null,
    previewImageUrl: null,
    tags: ["design"],
    seoTitle: null,
    seoDescription: null,
    totalDownloads: 5,
    totalRevenueCents: 2500,
    avgRating: 5.0,
    reviewCount: 1,
    version: 1,
    aiGenerationId: null,
    moderatedBy: 42,
    moderatedAt: new Date("2023-02-01T00:00:00.000Z"),
    publishedAt: null,
    createdAt: new Date("2023-01-15T12:00:00.000Z"),
    updatedAt: new Date("2023-02-01T00:05:00.000Z"),
    deletedAt: new Date("2023-02-10T00:00:00.000Z"),
    creatorId: 8,
    packType: "single",
    licenseType: "personal",
    viewCount: 100,
    appreciationCount: 5,
    saleEventId: null,
    salePriceCents: null,
    language: "en",
    qualityScore: null,
  };

  it("should include public fields AND admin-specific fields", () => {
    const result = serializePackAdmin(basePack, { categoryName: "Design", categorySlug: "design" });

    // Assert public fields are present
    expect(result.id).toBe(basePack.id);
    expect(result.title).toBe(basePack.title);
    expect(result.categoryName).toBe("Design");

    // Assert admin-specific fields
    expect(result.totalRevenueCents).toBe(basePack.totalRevenueCents);
    expect(result.moderatedBy).toBe(basePack.moderatedBy);
    expect(result.moderatedAt).toBe(basePack.moderatedAt?.toISOString());
    expect(result.updatedAt).toBe(basePack.updatedAt.toISOString());
    expect(result.deletedAt).toBe(basePack.deletedAt?.toISOString());
  });

  it("should handle null admin dates gracefully", () => {
    const nullableAdminPack: PackRow = {
      ...basePack,
      moderatedAt: null,
      deletedAt: null,
    };

    const result = serializePackAdmin(nullableAdminPack);

    expect(result.moderatedAt).toBeNull();
    expect(result.deletedAt).toBeNull();
  });
});
