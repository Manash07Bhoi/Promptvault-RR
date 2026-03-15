import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { useParams, Link } from "wouter";
import { useListPacks } from "@workspace/api-client-react";
import { PackCard } from "@/components/shared/pack-card";
import { Button } from "@/components/ui/button";
import { Code, Sparkles, PenTool, Database, SlidersHorizontal, ChevronRight, X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const CATEGORY_VISUALS: Record<string, { icon: any; color: string; description: string }> = {
  development: {
    icon: <Code className="w-12 h-12" />,
    color: "from-blue-600 to-cyan-500",
    description: "Code generation, debugging, refactoring, and architecture prompts for software engineers.",
  },
  marketing: {
    icon: <Sparkles className="w-12 h-12" />,
    color: "from-purple-600 to-pink-500",
    description: "Copywriting, SEO, social media strategies, and content creation workflows.",
  },
  design: {
    icon: <PenTool className="w-12 h-12" />,
    color: "from-orange-500 to-red-500",
    description: "Midjourney prompts, UI/UX ideation, and creative direction assets.",
  },
  "data-science": {
    icon: <Database className="w-12 h-12" />,
    color: "from-emerald-500 to-teal-400",
    description: "Data analysis, SQL generation, Python scripts, and visualization prompts.",
  },
};

const DEFAULT_VISUAL = {
  icon: <Sparkles className="w-12 h-12" />,
  color: "from-primary to-secondary",
  description: "Explore curated AI prompts for this category to enhance your workflow.",
};

const AI_TOOLS = ["ChatGPT", "Claude", "Midjourney", "Gemini"];
const SORT_OPTIONS = [
  { value: "popular", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "rating", label: "Highest Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function Category() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const visual = CATEGORY_VISUALS[slug.toLowerCase()] || DEFAULT_VISUAL;
  const title = slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  const [selectedTool, setSelectedTool] = useState<string>("");
  const [priceFilter, setPriceFilter] = useState<"any" | "free" | "paid">("any");
  const [sort, setSort] = useState<string>("popular");

  const [appliedTool, setAppliedTool] = useState<string>("");
  const [appliedPrice, setAppliedPrice] = useState<"any" | "free" | "paid">("any");
  const [appliedSort, setAppliedSort] = useState<string>("popular");

  const isFreeParam = appliedPrice === "free" ? true : appliedPrice === "paid" ? false : undefined;

  const { data, isLoading } = useListPacks({
    category: slug,
    limit: 12,
    aiTool: appliedTool || undefined,
    isFree: isFreeParam,
    sort: appliedSort as any,
  });

  const hasActiveFilters = appliedTool !== "" || appliedPrice !== "any";

  const handleApplyFilters = () => {
    setAppliedTool(selectedTool);
    setAppliedPrice(priceFilter);
    setAppliedSort(sort);
  };

  const handleClearFilters = () => {
    setSelectedTool("");
    setPriceFilter("any");
    setSort("popular");
    setAppliedTool("");
    setAppliedPrice("any");
    setAppliedSort("popular");
  };

  return (
    <PublicLayout>
      <SEO
        canonical={`/categories/${slug}`}
        title={`${slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Category"} Prompt Packs`}
        description={`Browse premium AI prompt packs in the ${slug} category. Find curated prompts for ChatGPT, Claude, Midjourney and more.`}
        keywords={`${slug} AI prompts, ${slug} prompt packs, AI prompt category`}
      />
      {/* Category Hero */}
      <div className="relative overflow-hidden bg-background border-b border-border/50 pt-20 pb-24">
        <div
          className={`absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl ${visual.color} opacity-10 blur-[120px] pointer-events-none`}
        />

        <div className="container mx-auto px-4 relative z-10">
          <Link href="/explore">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-muted-foreground hover:text-foreground gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Explore
            </Button>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/explore" className="hover:text-foreground transition-colors">
              Categories
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground font-medium">{title}</span>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center md:items-start gap-8"
          >
            <div
              className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${visual.color} p-0.5 shrink-0 shadow-2xl`}
            >
              <div className="w-full h-full bg-background rounded-[22px] flex items-center justify-center">
                <div className={`bg-gradient-to-br ${visual.color} bg-clip-text text-transparent`}>
                  {visual.icon}
                </div>
              </div>
            </div>

            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">{title} Prompts</h1>
              <p className="text-xl text-muted-foreground max-w-2xl">{visual.description}</p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="sticky top-24 space-y-8">
              <div className="bg-card p-6 rounded-2xl border border-border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-lg">Filters</h3>
                  <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      AI Tool
                    </h4>
                    <div className="space-y-2">
                      {AI_TOOLS.map((tool) => (
                        <label key={tool} className="flex items-center gap-3 group cursor-pointer">
                          <input
                            type="radio"
                            name="aiTool"
                            checked={selectedTool === tool}
                            onChange={() =>
                              setSelectedTool(selectedTool === tool ? "" : tool)
                            }
                            className="w-4 h-4 rounded-full border-border bg-background text-primary focus:ring-primary"
                          />
                          <span className="text-sm group-hover:text-foreground transition-colors">
                            {tool}
                          </span>
                        </label>
                      ))}
                      {selectedTool && (
                        <button
                          onClick={() => setSelectedTool("")}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors mt-1"
                        >
                          <X className="w-3 h-3" /> Clear tool
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                      Price
                    </h4>
                    <div className="space-y-2">
                      {(
                        [
                          { value: "any", label: "Any Price" },
                          { value: "free", label: "Free" },
                          { value: "paid", label: "Paid" },
                        ] as const
                      ).map(({ value, label }) => (
                        <label key={value} className="flex items-center gap-3 group cursor-pointer">
                          <input
                            type="radio"
                            name="price"
                            checked={priceFilter === value}
                            onChange={() => setPriceFilter(value)}
                            className="w-4 h-4 rounded-full border-border bg-background text-primary focus:ring-primary"
                          />
                          <span className="text-sm group-hover:text-foreground transition-colors">
                            {label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button className="flex-1" onClick={handleApplyFilters}>
                    Apply
                  </Button>
                  {hasActiveFilters && (
                    <Button variant="outline" size="icon" onClick={handleClearFilters} title="Clear filters">
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">
                {isLoading ? "Loading..." : `${data?.total ?? 0} Packs Available`}
                {hasActiveFilters && (
                  <span className="ml-2 text-xs font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Filtered
                  </span>
                )}
              </h2>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setAppliedSort(e.target.value);
                }}
                className="bg-card border border-border rounded-lg text-sm px-3 py-2 focus:outline-none focus:border-primary"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-border bg-card p-4 h-[350px] animate-pulse"
                  >
                    <div className="w-full h-40 bg-muted rounded-xl mb-4" />
                    <div className="w-3/4 h-6 bg-muted rounded mb-2" />
                  </div>
                ))}
              </div>
            ) : data?.packs && data.packs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.packs.map((pack, index) => (
                  <PackCard key={pack.id} pack={pack} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-card rounded-3xl border border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No packs found</h3>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters
                    ? "No packs match the selected filters. Try adjusting your criteria."
                    : "There are no prompt packs in this category yet."}
                </p>
                {hasActiveFilters ? (
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Link href="/explore">
                    <Button variant="outline">Browse All Categories</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
