import { PublicLayout } from "@/components/layout/public-layout";
import { SEO } from "@/components/shared/seo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PackCard } from "@/components/shared/pack-card";
import { useSearchPacks } from "@workspace/api-client-react";
import { Search as SearchIcon, X, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { useDebounce } from "@/hooks/use-debounce";

export default function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 500);
  const [activeTab, setActiveTab] = useState("packs");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto focus
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // Load recent searches
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const { data, isLoading } = useSearchPacks(
    { q: debouncedQuery, limit: 12 },
    { query: { enabled: !!debouncedQuery } as any }
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveRecentSearch(query);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
  };

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentSearches.filter(t => t !== term);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  return (
    <PublicLayout>
      <SEO
        canonical="/search"
        title="Search Prompt Packs"
        description="Search thousands of premium AI prompt packs for ChatGPT, Claude, Midjourney and more. Find exactly what you need."
        keywords="search AI prompts, find prompt packs, AI prompt search"
        noindex={false}
      />
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Search Header */}
          <form onSubmit={handleSearchSubmit} className="relative mb-10">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for prompts, creators, or keywords..."
              className="w-full h-16 pl-16 pr-14 bg-card border-2 border-border focus:border-primary rounded-2xl text-xl outline-none shadow-lg transition-colors placeholder:text-muted-foreground/60"
            />
            {query && (
              <button 
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 bg-muted hover:bg-muted-foreground/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Tabs */}
          <div className="flex items-center gap-6 border-b border-border/50 mb-8">
            <button 
              className={`pb-4 px-2 text-lg font-medium transition-colors border-b-2 ${activeTab === "packs" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("packs")}
            >
              Packs
            </button>
            <button 
              className={`pb-4 px-2 text-lg font-medium transition-colors border-b-2 ${activeTab === "creators" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              onClick={() => setActiveTab("creators")}
            >
              Creators
            </button>
          </div>

          {/* Content Area */}
          <div className="min-h-[400px]">
            {!query && recentSearches.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Recent Searches
                </h3>
                <div className="flex flex-wrap gap-3">
                  {recentSearches.map(term => (
                    <div 
                      key={term}
                      onClick={() => handleRecentClick(term)}
                      className="group flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <span className="text-sm">{term}</span>
                      <button onClick={(e) => removeRecent(term, e)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!query && recentSearches.length === 0 && (
              <div className="text-center py-20">
                <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                <h2 className="text-xl font-medium text-foreground mb-2">What are you looking for?</h2>
                <p className="text-muted-foreground">Search for specific tools like "ChatGPT", "Midjourney", or use cases like "SEO", "Marketing".</p>
              </div>
            )}

            {query && isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border bg-card p-4 h-[350px] animate-pulse">
                    <div className="w-full h-40 bg-muted rounded-xl mb-4" />
                    <div className="w-3/4 h-6 bg-muted rounded mb-2" />
                    <div className="w-1/2 h-4 bg-muted rounded mb-4" />
                  </div>
                ))}
              </div>
            )}

            {query && !isLoading && data?.packs && data.packs.length > 0 && activeTab === "packs" && (
              <div>
                <p className="text-muted-foreground mb-6">Found {data.total} results for "{query}"</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.packs.map((pack, index) => (
                    <PackCard key={pack.id} pack={pack} index={index} />
                  ))}
                </div>
              </div>
            )}

            {query && !isLoading && data?.packs && data.packs.length === 0 && activeTab === "packs" && (
              <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/30">
                <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-xl font-bold mb-2">No results found for "{query}"</h3>
                <p className="text-muted-foreground mb-6">Try using different keywords or check your spelling.</p>
                <Button variant="outline" onClick={() => setQuery("")}>Clear Search</Button>
              </div>
            )}

            {query && activeTab === "creators" && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">Creator search coming soon.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
}
