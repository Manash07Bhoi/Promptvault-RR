import { describe, it, expect } from "vitest";
import { serializeCategory } from "../lib/serialize.js";
import type { categoriesTable } from "@workspace/db";

type CategoryRow = typeof categoriesTable.$inferSelect;

describe("serializeCategory", () => {
  it("serializes all required fields correctly", () => {
    const mockDate = new Date("2024-01-01T12:00:00.000Z");
    const mockCategory: CategoryRow = {
      id: 123,
      slug: "tech-prompts",
      name: "Tech Prompts",
      description: "A collection of tech-related prompts",
      icon: "code",
      color: "#000000",
      packCount: 42,
      isFeatured: true,
      parentId: null,
      sortOrder: 1,
      createdAt: mockDate,
    };

    const result = serializeCategory(mockCategory);

    expect(result).toEqual({
      id: 123,
      slug: "tech-prompts",
      name: "Tech Prompts",
      description: "A collection of tech-related prompts",
      icon: "code",
      color: "#000000",
      packCount: 42,
      isFeatured: true,
      sortOrder: 1,
      createdAt: "2024-01-01T12:00:00.000Z",
    });
  });

  it("handles null values for optional fields", () => {
    const mockDate = new Date("2024-01-01T12:00:00.000Z");
    const mockCategory: CategoryRow = {
      id: 456,
      slug: "minimal-category",
      name: "Minimal",
      description: null,
      icon: null,
      color: null,
      packCount: 0,
      isFeatured: false,
      parentId: null,
      sortOrder: 2,
      createdAt: mockDate,
    };

    const result = serializeCategory(mockCategory);

    expect(result).toEqual({
      id: 456,
      slug: "minimal-category",
      name: "Minimal",
      description: null,
      icon: null,
      color: null,
      packCount: 0,
      isFeatured: false,
      sortOrder: 2,
      createdAt: "2024-01-01T12:00:00.000Z",
    });
  });

  it("does not leak unexpected internal fields", () => {
    const mockDate = new Date("2024-01-01T12:00:00.000Z");

    // We create an object that has extra fields simulating internal DB state
    const mockCategoryWithExtras = {
      id: 789,
      slug: "secret-category",
      name: "Secret",
      description: "Shh",
      icon: "lock",
      color: "#ff0000",
      packCount: 1,
      isFeatured: false,
      parentId: null,
      sortOrder: 3,
      createdAt: mockDate,
      // Extra fields that should NOT be in the output
      internalStatus: "active",
      deletedAt: null,
      moderatorNotes: "Looks good"
    } as unknown as CategoryRow;

    const result = serializeCategory(mockCategoryWithExtras);

    // Assert that the exact returned object doesn't have the extra fields
    expect(result).not.toHaveProperty("updatedAt");
    expect(result).not.toHaveProperty("internalStatus");
    expect(result).not.toHaveProperty("deletedAt");
    expect(result).not.toHaveProperty("moderatorNotes");

    // And that it matches the strict expected shape
    expect(result).toEqual({
      id: 789,
      slug: "secret-category",
      name: "Secret",
      description: "Shh",
      icon: "lock",
      color: "#ff0000",
      packCount: 1,
      isFeatured: false,
      sortOrder: 3,
      createdAt: "2024-01-01T12:00:00.000Z",
    });
  });
});
