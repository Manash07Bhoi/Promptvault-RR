import { describe, it, expect } from "vitest";
import { queryKeys } from "../lib/query-keys.js";

describe("queryKeys factory", () => {
  describe("packs", () => {
    it("packs.all is stable", () => {
      expect(queryKeys.packs.all).toEqual(["packs"]);
    });

    it("packs.lists() includes 'list'", () => {
      expect(queryKeys.packs.lists()).toEqual(["packs", "list"]);
    });

    it("packs.list with filters produces distinct keys", () => {
      const a = queryKeys.packs.list({ category: "writing" });
      const b = queryKeys.packs.list({ category: "coding" });
      expect(a).not.toEqual(b);
    });

    it("packs.detail includes slug", () => {
      const key = queryKeys.packs.detail("my-pack");
      expect(key).toContain("my-pack");
    });

    it("packs.featured returns stable key", () => {
      expect(queryKeys.packs.featured()).toEqual(queryKeys.packs.featured());
    });
  });

  describe("user", () => {
    it("user.me is stable", () => {
      expect(queryKeys.user.me).toEqual(["user", "me"]);
    });

    it("user.purchases includes userId", () => {
      expect(queryKeys.user.purchases(42)).toContain(42);
    });
  });

  describe("categories", () => {
    it("categories.list is stable", () => {
      expect(queryKeys.categories.list()).toEqual(queryKeys.categories.list());
    });

    it("categories.detail includes slug", () => {
      expect(queryKeys.categories.detail("writing")).toContain("writing");
    });
  });

  describe("admin", () => {
    it("admin.dashboard is stable", () => {
      expect(queryKeys.admin.dashboard).toEqual(["admin", "dashboard"]);
    });

    it("admin.packs with different filters produce different keys", () => {
      const a = queryKeys.admin.packs({ status: "PUBLISHED" });
      const b = queryKeys.admin.packs({ status: "DRAFT" });
      expect(a).not.toEqual(b);
    });
  });

  describe("search", () => {
    it("search results include query", () => {
      const key = queryKeys.search.results("hello");
      expect(key).toContain("hello");
    });

    it("different queries produce different keys", () => {
      const a = queryKeys.search.results("hello");
      const b = queryKeys.search.results("world");
      expect(a).not.toEqual(b);
    });
  });
});
