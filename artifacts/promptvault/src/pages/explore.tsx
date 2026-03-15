import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { useListPacks, useListCategories } from "@workspace/api-client-react";
import { PackCard } from "@/components/shared/pack-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

const SORT_OPTIONS = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const AI_TOOLS = ["ChatGPT", "Claude", "Midjourney", "DALL-E 3", "Gemini", "Stable Diffusion"];

function FilterSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 pb-5 mb-5">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-4 font-semibold text-sm text-foreground hover:text-primary transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Explore() {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState<number | undefined>(undefined);
  const [priceMax, setPriceMax] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const { data, isLoading } = useListPacks({
    limit: 12,
    page,
    search: search || undefined,
    category: selectedCategory,
    sort: sort as any,
    aiTool: selectedTools.length === 1 ? selectedTools[0] : undefined,
  });

  const { data: categories } = useListCategories();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearch(""); setSearchInput(""); setSelectedCategory(undefined);
    setSelectedTools([]); setPriceMin(undefined); setPriceMax(undefined);
    setSort("popular"); setPage(1);
  };

  const activeFilterCount = [
    selectedCategory, ...selectedTools,
    priceMin !== undefined ? "price" : null,
    search ? "search" : null,
  ].filter(Boolean).length;

  const FiltersPanel = () => (
    <aside className="space-y-0">
      <div className="flex items-center justify-between mb-5">
        <span className="font-bold text-foreground">Filters</span>
        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="text-xs text-primary hover:underline flex items-center gap-1">
            <X className="w-3 h-3" /> Clear all ({activeFilterCount})
          </button>
        )}
      </div>

      <FilterSection title="Categories">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input type="radio" name="cat" className="accent-primary" checked={!selectedCategory} onChange={() => { setSelectedCategory(undefined); setPage(1); }} />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">All Categories</span>
          </label>
          {(categories || []).map((cat: any) => (
            <label key={cat.slug} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="cat"
                className="accent-primary"
                checked={selectedCategory === cat.slug}
                onChange={() => { setSelectedCategory(cat.slug); setPage(1); }}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors flex-grow">{cat.name}</span>
              <span className="text-xs text-muted-foreground/50">{cat.packCount}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="AI Tool" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {AI_TOOLS.map(tool => (
            <button
              key={tool}
              onClick={() => toggleTool(tool)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                selectedTools.includes(tool)
                  ? "bg-primary/20 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {tool}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range" defaultOpen={false}>
        <div className="space-y-3">
          {[
            { label: "Free", min: 0, max: 0 },
            { label: "Under $10", min: 0, max: 999 },
            { label: "$10 – $25", min: 1000, max: 2500 },
            { label: "$25 – $50", min: 2500, max: 5000 },
            { label: "Over $50", min: 5000, max: undefined },
          ].map(({ label, min, max }) => (
            <label key={label} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="price"
                className="accent-primary"
                checked={priceMin === min && priceMax === max}
                onChange={() => { setPriceMin(min); setPriceMax(max); setPage(1); }}
              />
              <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
            </label>
          ))}
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="price"
              className="accent-primary"
              checked={priceMin === undefined && priceMax === undefined}
              onChange={() => { setPriceMin(undefined); setPriceMax(undefined); setPage(1); }}
            />
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">Any Price</span>
          </label>
        </div>
      </FilterSection>
    </aside>
  );

  return (
    <PublicLayout>
      <SEO
        canonical="/explore"
        title="Explore Prompt Packs"
        description="Browse our full library of premium AI prompt packs for ChatGPT, Claude, Midjourney, and more. Filter by category, price, and AI tool."
        keywords="AI prompts marketplace, browse prompt packs, ChatGPT prompts, AI productivity"
      />
      <div className="container mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-3">
            <Sparkles className="w-4 h-4" /> Explore
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-display font-bold mb-2">All Prompt Packs</h1>
              <p className="text-muted-foreground text-lg">
                {data?.total ? `${data.total} packs across all categories` : "Browse our complete library of premium AI prompts"}
              </p>
            </div>
            <div className="flex gap-3">
              <form onSubmit={handleSearch} className="flex gap-2">
                <Input
                  icon={<Search className="w-4 h-4" />}
                  placeholder="Search packs..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-64"
                />
                <Button type="submit" variant="outline" size="sm">Search</Button>
              </form>
              <Button
                variant="outline"
                className="lg:hidden flex items-center gap-2"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && <Badge className="w-5 h-5 p-0 flex items-center justify-center text-[10px]">{activeFilterCount}</Badge>}
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Pills */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {search && (
              <Badge variant="secondary" className="flex items-center gap-1.5 cursor-pointer hover:bg-destructive/10" onClick={() => { setSearch(""); setSearchInput(""); }}>
                Search: "{search}" <X className="w-3 h-3" />
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="flex items-center gap-1.5 cursor-pointer hover:bg-destructive/10" onClick={() => setSelectedCategory(undefined)}>
                Category: {categories?.find((c: any) => c.slug === selectedCategory)?.name || selectedCategory} <X className="w-3 h-3" />
              </Badge>
            )}
            {selectedTools.map(tool => (
              <Badge key={tool} variant="secondary" className="flex items-center gap-1.5 cursor-pointer hover:bg-destructive/10" onClick={() => toggleTool(tool)}>
                {tool} <X className="w-3 h-3" />
              </Badge>
            ))}
            <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-destructive transition-colors">
              Clear all
            </button>
          </div>
        )}

        <div className="flex gap-10">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-56 shrink-0">
            <FiltersPanel />
          </aside>

          {/* Mobile Filters Drawer */}
          <AnimatePresence>
            {showMobileFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)} />
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute left-0 top-0 bottom-0 w-72 bg-card border-r border-border p-6 overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-lg">Filters</h2>
                    <button onClick={() => setShowMobileFilters(false)} className="p-1 rounded-lg hover:bg-muted">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <FiltersPanel />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Grid */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Loading..." : `Showing ${data?.packs?.length || 0} of ${data?.total || 0} packs`}
              </p>
              <select
                value={sort}
                onChange={(e) => { setSort(e.target.value); setPage(1); }}
                className="bg-card border border-border rounded-xl text-sm px-3 py-2 focus:outline-none focus:border-primary text-foreground cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card h-[360px] animate-pulse">
                    <div className="h-44 bg-muted rounded-t-2xl" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !data?.packs?.length ? (
              <div className="text-center py-20 border-2 border-dashed border-border rounded-2xl">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2">No packs found</h3>
                <p className="text-muted-foreground mb-6">Try adjusting your search or filters.</p>
                <Button variant="outline" onClick={clearFilters}>Clear All Filters</Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {data.packs.map((pack: any, index: number) => (
                    <PackCard key={pack.id} pack={pack} index={index} />
                  ))}
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12">
                    <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                      ← Previous
                    </Button>
                    {[...Array(Math.min(data.totalPages, 5))].map((_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={page === p ? "default" : "outline"}
                          onClick={() => setPage(p)}
                          className="w-10 h-10 p-0"
                        >
                          {p}
                        </Button>
                      );
                    })}
                    <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)}>
                      Next →
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
