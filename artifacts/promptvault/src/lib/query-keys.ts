export const queryKeys = {
  packs: {
    all: ["packs"] as const,
    lists: () => [...queryKeys.packs.all, "list"] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.packs.lists(), filters] as const,
    detail: (slug: string) => [...queryKeys.packs.all, "detail", slug] as const,
    featured: () => [...queryKeys.packs.all, "featured"] as const,
    trending: (filters?: Record<string, unknown>) => [...queryKeys.packs.all, "trending", filters] as const,
    bestsellers: () => [...queryKeys.packs.all, "bestsellers"] as const,
    related: (slug: string) => [...queryKeys.packs.all, "related", slug] as const,
  },
  categories: {
    all: ["categories"] as const,
    list: () => [...queryKeys.categories.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.categories.all, "detail", slug] as const,
  },
  user: {
    me: ["user", "me"] as const,
    purchases: (userId?: number) => ["user", userId, "purchases"] as const,
    wishlist: (userId?: number) => ["user", userId, "wishlist"] as const,
    orders: (userId?: number) => ["user", userId, "orders"] as const,
    order: (orderId: string) => ["user", "orders", orderId] as const,
  },
  reviews: {
    pack: (packId: string | number) => ["reviews", "pack", String(packId)] as const,
  },
  search: {
    results: (query: string, filters?: Record<string, unknown>) => ["search", query, filters] as const,
  },
  admin: {
    dashboard: ["admin", "dashboard"] as const,
    packs: (filters?: Record<string, unknown>) => ["admin", "packs", filters] as const,
    pack: (id: string | number) => ["admin", "packs", String(id)] as const,
    users: (filters?: Record<string, unknown>) => ["admin", "users", filters] as const,
    automation: (filters?: Record<string, unknown>) => ["admin", "automation", filters] as const,
    moderation: (filters?: Record<string, unknown>) => ["admin", "moderation", filters] as const,
    categories: ["admin", "categories"] as const,
    coupons: ["admin", "coupons"] as const,
  },
};
