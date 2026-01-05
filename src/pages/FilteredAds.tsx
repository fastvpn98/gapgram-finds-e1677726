import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, MapPin, Tag, UserCircle, Grid3X3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdCard } from "@/components/AdCard";
import { AdListSkeleton } from "@/components/AdCardSkeleton";
import { getAds } from "@/lib/ads";
import { CATEGORIES, PROVINCES, AGE_GROUPS, TAGS } from "@/lib/constants";

type SortOption = "relevance" | "most-members" | "least-members" | "newest" | "oldest";

export default function FilteredAds() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: ads = [], isLoading: loading } = useQuery({
    queryKey: ["ads"],
    queryFn: getAds,
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });

  const query = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as SortOption) || "relevance";
  
  // Filter params
  const filterTag = searchParams.get("tag") || "";
  const filterProvince = searchParams.get("province") || "";
  const filterAge = searchParams.get("age") || "";
  const filterCategory = searchParams.get("category") || "";
  const filterType = searchParams.get("type") || "";

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Get filter display info
  const getFilterInfo = () => {
    if (filterTag) {
      const predefinedTag = TAGS.find((t) => t.value === filterTag);
      return {
        icon: Tag,
        label: predefinedTag ? predefinedTag.label : filterTag,
        type: "تگ"
      };
    }
    if (filterProvince) {
      const province = PROVINCES.find((p) => p.value === filterProvince);
      return {
        icon: MapPin,
        label: province?.label || filterProvince,
        type: "استان"
      };
    }
    if (filterAge) {
      const age = AGE_GROUPS.find((a) => a.value === filterAge);
      return {
        icon: UserCircle,
        label: age?.label || filterAge,
        type: "گروه سنی"
      };
    }
    if (filterCategory) {
      const cat = CATEGORIES.find((c) => c.value === filterCategory);
      return {
        icon: cat?.icon || Grid3X3,
        label: cat?.label || filterCategory,
        type: "دسته‌بندی"
      };
    }
    return null;
  };

  const filterInfo = getFilterInfo();
  const FilterIcon = filterInfo?.icon || Tag;

  const filteredAndSortedAds = useMemo(() => {
    let result = [...ads];

    // Filter by type
    if (filterType && filterType !== "all") {
      result = result.filter((ad) => ad.adType === filterType);
    }

    // Filter by tag
    if (filterTag) {
      result = result.filter((ad) => ad.tags.includes(filterTag));
    }

    // Filter by province
    if (filterProvince) {
      result = result.filter((ad) => ad.provinces.includes(filterProvince));
    }

    // Filter by age group
    if (filterAge) {
      result = result.filter(
        (ad) => ad.ageGroups.includes("all") || ad.ageGroups.includes(filterAge)
      );
    }

    // Filter by category
    if (filterCategory) {
      result = result.filter((ad) => ad.category === filterCategory);
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
  }, [ads, filterTag, filterProvince, filterAge, filterCategory, filterType, query, sort]);

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header with filter info */}
      <section className="border-b bg-card/50 py-6 sm:py-8">
        <div className="container">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            بازگشت به صفحه اصلی
          </Button>
          
          {filterInfo && (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                <FilterIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{filterInfo.type}</p>
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {filterInfo.label}
                </h1>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Search and Sort */}
      <section className="sticky top-16 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container py-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجو در نتایج..."
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
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container py-6 flex-1">
        <div className="space-y-4">
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
                  آگهی‌ای با این فیلتر یافت نشد.
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/")}
                >
                  مشاهده همه آگهی‌ها
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
