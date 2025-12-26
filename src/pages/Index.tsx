import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdCard } from "@/components/AdCard";
import { AdListSkeleton } from "@/components/AdCardSkeleton";
import { FilterSidebar } from "@/components/FilterSidebar";
import { WelcomeModal } from "@/components/WelcomeModal";
import { getAds } from "@/lib/ads";
import { RankedAd } from "@/lib/types";
import { CATEGORIES, CITIES, AGE_GROUPS, TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { trackSiteVisit } from "@/lib/analytics";

type SortOption = "relevance" | "most-members" | "least-members" | "newest" | "oldest";

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [ads, setAds] = useState<RankedAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasEntered, setHasEntered] = useState(() => {
    return sessionStorage.getItem("hasSeenWelcome") === "true";
  });

  const handleEnter = () => {
    setHasEntered(true);
    trackSiteVisit("/");
  };

  const category = searchParams.get("category") || "";
  const query = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortOption) || "relevance";
  const selectedCities = searchParams.get("cities")?.split(",").filter(Boolean) || [];
  const selectedAgeGroups = searchParams.get("ageGroups")?.split(",").filter(Boolean) || [];
  const selectedTags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

  useEffect(() => {
    const fetchAds = async () => {
      setLoading(true);
      const data = await getAds();
      setAds(data);
      setLoading(false);
    };
    fetchAds();
  }, []);

  const updateFilter = (key: string, value: string | string[]) => {
    const newParams = new URLSearchParams(searchParams);
    if (Array.isArray(value)) {
      if (value.length > 0) {
        newParams.set(key, value.join(","));
      } else {
        newParams.delete(key);
      }
    } else if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const clearFilter = (key: string, value?: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      const current = newParams.get(key)?.split(",").filter(Boolean) || [];
      const updated = current.filter((v) => v !== value);
      if (updated.length > 0) {
        newParams.set(key, updated.join(","));
      } else {
        newParams.delete(key);
      }
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const filteredAndSortedAds = useMemo(() => {
    let result = [...ads];

    // Filter by category
    if (category) {
      result = result.filter((ad) => ad.category === category);
    }

    // Filter by search query
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (ad) =>
          ad.name.toLowerCase().includes(q) ||
          ad.text.toLowerCase().includes(q)
      );
    }

    // Filter by cities
    if (selectedCities.length > 0) {
      result = result.filter((ad) =>
        ad.cities.some((c) => selectedCities.includes(c))
      );
    }

    // Filter by age groups
    if (selectedAgeGroups.length > 0) {
      result = result.filter(
        (ad) =>
          ad.ageGroups.includes("all") ||
          ad.ageGroups.some((a) => selectedAgeGroups.includes(a))
      );
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      result = result.filter((ad) =>
        ad.tags.some((t) => selectedTags.includes(t))
      );
    }

    // Sort
    switch (sort) {
      case "most-members":
        result.sort((a, b) => b.members - a.members);
        break;
      case "least-members":
        result.sort((a, b) => a.members - b.members);
        break;
      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "relevance":
      default:
        result.sort((a, b) => b.relevanceScore - a.relevanceScore);
        break;
    }

    return result;
  }, [ads, category, query, selectedCities, selectedAgeGroups, selectedTags, sort]);

  const activeFilters = [
    ...selectedCities.map((c) => ({
      key: "cities",
      value: c,
      label: CITIES.find((city) => city.value === c)?.label || c,
    })),
    ...selectedAgeGroups.map((a) => ({
      key: "ageGroups",
      value: a,
      label: AGE_GROUPS.find((age) => age.value === a)?.label || a,
    })),
    ...selectedTags.map((t) => ({
      key: "tags",
      value: t,
      label: TAGS.find((tag) => tag.value === t)?.label || t,
    })),
  ];

  const hasFilters = category || activeFilters.length > 0;

  return (
    <div className="min-h-screen gradient-hero">
      {/* Welcome Modal */}
      <WelcomeModal onEnter={handleEnter} />
      
      {/* Hero Section */}
      <section className="border-b bg-card/50 py-8 sm:py-12">
        <div className="container text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            مرکز آگهی‌های تلگرام
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            بهترین گروه‌ها و کانال‌های تلگرام را کشف کنید. جستجو، فیلتر و عضویت آسان.
          </p>
        </div>
      </section>

      {/* Category Buttons */}
      <section className="border-b bg-card/80 py-4">
        <div className="container">
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant={!category ? "default" : "outline"}
              onClick={() => clearFilter("category")}
              className="gap-2"
            >
              <LayoutGrid className="h-4 w-4" />
              همه
            </Button>
            {CATEGORIES.map((cat) => (
              <Button
                key={cat.value}
                variant={category === cat.value ? "default" : "outline"}
                onClick={() => updateFilter("category", cat.value)}
                className="gap-2"
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-6">
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Sidebar - Desktop */}
          {category && (
            <aside className="hidden w-64 flex-shrink-0 lg:block">
              <div className="sticky top-20 rounded-xl border bg-card p-4 shadow-card">
                <h2 className="mb-4 font-bold text-foreground">فیلترها</h2>
                <FilterSidebar
                  selectedCities={selectedCities}
                  selectedAgeGroups={selectedAgeGroups}
                  selectedTags={selectedTags}
                  onCitiesChange={(v) => updateFilter("cities", v)}
                  onAgeGroupsChange={(v) => updateFilter("ageGroups", v)}
                  onTagsChange={(v) => updateFilter("tags", v)}
                />
              </div>
            </aside>
          )}

          {/* Content */}
          <div className="flex-1 space-y-4">
            {/* Search and Sort Bar */}
            <div className="sticky top-16 z-10 flex flex-wrap items-center gap-3 rounded-xl border bg-card/95 p-3 shadow-card backdrop-blur supports-[backdrop-filter]:bg-card/60">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="جستجو در آگهی‌ها..."
                  value={query}
                  onChange={(e) => updateFilter("q", e.target.value)}
                  className="pr-10"
                />
              </div>

              <Select
                value={sort}
                onValueChange={(v) => updateFilter("sort", v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="مرتب‌سازی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">مرتبط‌ترین</SelectItem>
                  <SelectItem value="most-members">بیشترین عضو</SelectItem>
                  <SelectItem value="least-members">کمترین عضو</SelectItem>
                  <SelectItem value="newest">جدیدترین</SelectItem>
                  <SelectItem value="oldest">قدیمی‌ترین</SelectItem>
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              {category && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <SheetHeader>
                      <SheetTitle>فیلترها</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4">
                      <FilterSidebar
                        selectedCities={selectedCities}
                        selectedAgeGroups={selectedAgeGroups}
                        selectedTags={selectedTags}
                        onCitiesChange={(v) => updateFilter("cities", v)}
                        onAgeGroupsChange={(v) => updateFilter("ageGroups", v)}
                        onTagsChange={(v) => updateFilter("tags", v)}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {/* Active Filters */}
            {activeFilters.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">فیلترها:</span>
                {activeFilters.map((filter, i) => (
                  <Badge
                    key={`${filter.key}-${filter.value}-${i}`}
                    variant="secondary"
                    className="gap-1 pl-1"
                  >
                    {filter.label}
                    <button
                      onClick={() => clearFilter(filter.key, filter.value)}
                      className="rounded-full p-0.5 hover:bg-foreground/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchParams(new URLSearchParams())}
                  className="text-xs text-muted-foreground"
                >
                  پاک کردن همه
                </Button>
              </div>
            )}

            {/* Results count */}
            {!loading && (
              <p className="text-sm text-muted-foreground">
                {filteredAndSortedAds.length} آگهی یافت شد
              </p>
            )}

            {/* Ad List */}
            {loading ? (
              <AdListSkeleton />
            ) : filteredAndSortedAds.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedAds.map((ad) => (
                  <AdCard key={ad.id} ad={ad} />
                ))}
              </div>
            ) : (
              <Alert className="animate-fade-in">
                <AlertDescription className="text-center py-8">
                  <p className="text-lg font-medium">هیچ آگهی یافت نشد</p>
                  <p className="mt-2 text-muted-foreground">
                    فیلترهای خود را تغییر دهید یا دسته‌بندی دیگری را انتخاب کنید.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
