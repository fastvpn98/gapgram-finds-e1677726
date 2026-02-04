import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Trash2,
  Edit,
  Loader2,
  ExternalLink,
  RotateCcw,
  Check,
  X,
  CheckSquare,
  Square,
  Clock,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/constants";

interface Ad {
  id: string;
  name: string;
  text: string;
  category: string;
  telegram_link: string;
  members: number;
  status: string;
  is_approved: boolean;
  created_at: string;
  user_id: string;
  ad_type: string;
  platform: string;
  deleted_at: string | null;
}

type SortField = "created_at" | "name" | "members" | "status";
type SortOrder = "asc" | "desc";

export default function UnifiedAdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { canApproveAds, loading: roleLoading } = useUserRole();
  
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("pending");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !canApproveAds) {
      toast({
        title: "دسترسی ندارید",
        description: "شما مجوز دسترسی به این صفحه را ندارید",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, authLoading, canApproveAds, roleLoading, navigate, toast]);

  useEffect(() => {
    if (canApproveAds) {
      fetchAds();
    }
  }, [canApproveAds]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [activeTab]);

  const fetchAds = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error("Error fetching ads:", error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری آگهی‌ها",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort ads
  const getFilteredAds = useMemo(() => {
    let filtered = ads.filter((ad) => {
      const matchesSearch = 
        ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || ad.category === categoryFilter;
      
      // Tab-based filtering
      if (activeTab === "pending") {
        return ad.status === "pending" && !ad.deleted_at && matchesSearch && matchesCategory;
      } else if (activeTab === "approved") {
        return ad.status === "approved" && !ad.deleted_at && matchesSearch && matchesCategory;
      } else if (activeTab === "rejected") {
        return ad.status === "rejected" && !ad.deleted_at && matchesSearch && matchesCategory;
      } else if (activeTab === "deleted") {
        return ad.deleted_at !== null && matchesSearch && matchesCategory;
      } else {
        // "all" tab
        const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
        return !ad.deleted_at && matchesSearch && matchesStatus && matchesCategory;
      }
    });

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortField === "created_at") {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      } else if (sortField === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === "members") {
        comparison = (a.members || 0) - (b.members || 0);
      } else if (sortField === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [ads, searchQuery, categoryFilter, statusFilter, activeTab, sortField, sortOrder]);

  // Stats
  const stats = useMemo(() => ({
    pending: ads.filter(ad => ad.status === "pending" && !ad.deleted_at).length,
    approved: ads.filter(ad => ad.status === "approved" && !ad.deleted_at).length,
    rejected: ads.filter(ad => ad.status === "rejected" && !ad.deleted_at).length,
    deleted: ads.filter(ad => ad.deleted_at !== null).length,
    total: ads.filter(ad => !ad.deleted_at).length,
  }), [ads]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(getFilteredAds.map((ad) => ad.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  // Single ad operations
  const updateAdStatus = async (adId: string, status: "approved" | "rejected") => {
    setProcessing(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ status, is_approved: status === "approved" })
        .eq("id", adId);

      if (error) throw error;

      toast({
        title: status === "approved" ? "تأیید شد" : "رد شد",
        description: `آگهی با موفقیت ${status === "approved" ? "تأیید" : "رد"} شد`,
      });

      setAds((prev) =>
        prev.map((ad) =>
          ad.id === adId ? { ...ad, status, is_approved: status === "approved" } : ad
        )
      );
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error updating ad:", error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی آگهی",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const softDeleteAd = async (adId: string) => {
    setProcessing(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", adId);

      if (error) throw error;

      toast({
        title: "حذف شد",
        description: "آگهی با موفقیت حذف شد",
      });

      setAds((prev) =>
        prev.map((ad) =>
          ad.id === adId ? { ...ad, deleted_at: new Date().toISOString() } : ad
        )
      );
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast({
        title: "خطا",
        description: "خطا در حذف آگهی",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const restoreAd = async (adId: string) => {
    setProcessing(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ deleted_at: null })
        .eq("id", adId);

      if (error) throw error;

      toast({
        title: "بازیابی شد",
        description: "آگهی با موفقیت بازیابی شد",
      });

      setAds((prev) =>
        prev.map((ad) => (ad.id === adId ? { ...ad, deleted_at: null } : ad))
      );
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error restoring ad:", error);
      toast({
        title: "خطا",
        description: "خطا در بازیابی آگهی",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const permanentDeleteAd = async (adId: string) => {
    setProcessing(adId);
    try {
      const { error } = await supabase.from("ads").delete().eq("id", adId);

      if (error) throw error;

      toast({
        title: "حذف دائم",
        description: "آگهی برای همیشه حذف شد",
      });

      setAds((prev) => prev.filter((ad) => ad.id !== adId));
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error permanently deleting ad:", error);
      toast({
        title: "خطا",
        description: "خطا در حذف دائم آگهی",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  // Bulk operations
  const bulkUpdateStatus = async (status: "approved" | "rejected") => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ status, is_approved: status === "approved" })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: status === "approved" ? "تأیید شدند" : "رد شدند",
        description: `${selectedIds.size} آگهی با موفقیت ${status === "approved" ? "تأیید" : "رد"} شدند`,
      });

      setAds((prev) =>
        prev.map((ad) =>
          selectedIds.has(ad.id)
            ? { ...ad, status, is_approved: status === "approved" }
            : ad
        )
      );
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error updating ads:", error);
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی آگهی‌ها",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkSoftDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ deleted_at: new Date().toISOString() })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "حذف شدند",
        description: `${selectedIds.size} آگهی با موفقیت حذف شدند`,
      });

      setAds((prev) =>
        prev.map((ad) =>
          selectedIds.has(ad.id)
            ? { ...ad, deleted_at: new Date().toISOString() }
            : ad
        )
      );
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error deleting ads:", error);
      toast({
        title: "خطا",
        description: "خطا در حذف آگهی‌ها",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkRestore = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from("ads")
        .update({ deleted_at: null })
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "بازیابی شدند",
        description: `${selectedIds.size} آگهی با موفقیت بازیابی شدند`,
      });

      setAds((prev) =>
        prev.map((ad) =>
          selectedIds.has(ad.id) ? { ...ad, deleted_at: null } : ad
        )
      );
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error restoring ads:", error);
      toast({
        title: "خطا",
        description: "خطا در بازیابی آگهی‌ها",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const bulkPermanentDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .in("id", Array.from(selectedIds));

      if (error) throw error;

      toast({
        title: "حذف دائم",
        description: `${selectedIds.size} آگهی برای همیشه حذف شدند`,
      });

      setAds((prev) => prev.filter((ad) => !selectedIds.has(ad.id)));
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    } catch (error) {
      console.error("Error permanently deleting ads:", error);
      toast({
        title: "خطا",
        description: "خطا در حذف دائم آگهی‌ها",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const getStatusBadge = (status: string, isDeleted: boolean) => {
    if (isDeleted) {
      return <Badge variant="destructive" className="gap-1"><Trash2 className="h-3 w-3" /> حذف شده</Badge>;
    }
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20 gap-1"><Check className="h-3 w-3" /> تأیید شده</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><X className="h-3 w-3" /> رد شده</Badge>;
      case "pending":
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> در انتظار</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCategoryLabel = (value: string) => {
    return CATEGORIES.find((c) => c.value === value)?.label || value;
  };

  const allSelected = getFilteredAds.length > 0 && getFilteredAds.every((ad) => selectedIds.has(ad.id));
  const someSelected = selectedIds.size > 0;

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero py-8" dir="rtl">
      <div className="container max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">مرکز مدیریت آگهی‌ها</h1>
          <p className="text-muted-foreground mt-2">
            تأیید، رد، ویرایش و حذف آگهی‌ها در یک پنل یکپارچه
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">در انتظار</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.approved}</p>
                  <p className="text-xs text-muted-foreground">تأیید شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-red-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <X className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">رد شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-500/10 border-gray-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <Trash2 className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.deleted}</p>
                  <p className="text-xs text-muted-foreground">حذف شده</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">کل فعال</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <TabsList className="grid grid-cols-5 w-auto">
              <TabsTrigger value="pending" className="gap-1.5 px-4">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">در انتظار</span>
                <Badge variant="secondary" className="mr-1 h-5 px-1.5">{stats.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="gap-1.5 px-4">
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">تأیید شده</span>
                <Badge variant="secondary" className="mr-1 h-5 px-1.5">{stats.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1.5 px-4">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline">رد شده</span>
                <Badge variant="secondary" className="mr-1 h-5 px-1.5">{stats.rejected}</Badge>
              </TabsTrigger>
              <TabsTrigger value="deleted" className="gap-1.5 px-4">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">حذف شده</span>
                <Badge variant="secondary" className="mr-1 h-5 px-1.5">{stats.deleted}</Badge>
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-1.5 px-4">
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">همه</span>
              </TabsTrigger>
            </TabsList>
            
            <Button onClick={fetchAds} variant="outline" size="sm" className="gap-2" disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              بروزرسانی
            </Button>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در نام یا متن آگهی..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="h-4 w-4" />
                          {cat.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeTab === "all" && (
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="وضعیت" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">همه</SelectItem>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="approved">تأیید شده</SelectItem>
                      <SelectItem value="rejected">رد شده</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                      مرتب‌سازی
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("desc"); }}>
                      جدیدترین
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("asc"); }}>
                      قدیمی‌ترین
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("asc"); }}>
                      نام (الف تا ی)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSortField("members"); setSortOrder("desc"); }}>
                      بیشترین اعضا
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          {getFilteredAds.length > 0 && (
            <Card>
              <CardContent className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (allSelected ? deselectAll() : selectAll())}
                    className="gap-2"
                  >
                    {allSelected ? (
                      <><CheckSquare className="h-4 w-4" /> لغو انتخاب</>
                    ) : (
                      <><Square className="h-4 w-4" /> انتخاب همه ({getFilteredAds.length})</>
                    )}
                  </Button>

                  {someSelected && (
                    <>
                      <span className="text-sm text-muted-foreground border-r pr-3">
                        {selectedIds.size} آگهی انتخاب شده
                      </span>

                      {activeTab !== "deleted" && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700" disabled={bulkProcessing}>
                                <Check className="h-4 w-4" /> تأیید
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>تأیید {selectedIds.size} آگهی</AlertDialogTitle>
                                <AlertDialogDescription>
                                  این آگهی‌ها در صفحه اصلی نمایش داده خواهند شد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={() => bulkUpdateStatus("approved")}>
                                  تأیید همه
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="secondary" className="gap-2" disabled={bulkProcessing}>
                                <X className="h-4 w-4" /> رد
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>رد {selectedIds.size} آگهی</AlertDialogTitle>
                                <AlertDialogDescription>
                                  این آگهی‌ها در صفحه اصلی نمایش داده نخواهند شد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={() => bulkUpdateStatus("rejected")}>
                                  رد همه
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2" disabled={bulkProcessing}>
                                <Trash2 className="h-4 w-4" /> حذف
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف {selectedIds.size} آگهی</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آگهی‌ها به سطل زباله منتقل می‌شوند و امکان بازیابی وجود دارد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={bulkSoftDelete}>
                                  حذف همه
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}

                      {activeTab === "deleted" && (
                        <>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="gap-2" disabled={bulkProcessing}>
                                <RotateCcw className="h-4 w-4" /> بازیابی
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>بازیابی {selectedIds.size} آگهی</AlertDialogTitle>
                                <AlertDialogDescription>
                                  آگهی‌ها از سطل زباله بازیابی خواهند شد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction onClick={bulkRestore}>
                                  بازیابی همه
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="gap-2" disabled={bulkProcessing}>
                                <AlertTriangle className="h-4 w-4" /> حذف دائم
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>حذف دائم {selectedIds.size} آگهی</AlertDialogTitle>
                                <AlertDialogDescription className="text-destructive">
                                  این عمل غیرقابل بازگشت است! آگهی‌ها برای همیشه حذف خواهند شد.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>انصراف</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={bulkPermanentDelete}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  حذف دائم
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ads Table */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : getFilteredAds.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>آگهی‌ای یافت نشد</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12 text-center">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={() => allSelected ? deselectAll() : selectAll()}
                          />
                        </TableHead>
                        <TableHead className="min-w-[200px]">آگهی</TableHead>
                        <TableHead className="w-[120px]">دسته‌بندی</TableHead>
                        <TableHead className="w-[100px] text-center">اعضا</TableHead>
                        <TableHead className="w-[120px] text-center">وضعیت</TableHead>
                        <TableHead className="w-[140px]">تاریخ</TableHead>
                        <TableHead className="w-[140px] text-center">عملیات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getFilteredAds.map((ad) => (
                        <TableRow
                          key={ad.id}
                          className={selectedIds.has(ad.id) ? "bg-muted/50" : ""}
                        >
                          <TableCell className="text-center">
                            <Checkbox
                              checked={selectedIds.has(ad.id)}
                              onCheckedChange={() => toggleSelect(ad.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium line-clamp-1">{ad.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {ad.text}
                              </p>
                              <div className="flex items-center gap-2 text-xs">
                                <Badge variant="outline" className="text-[10px]">
                                  {ad.platform}
                                </Badge>
                                <Badge variant="outline" className="text-[10px]">
                                  {ad.ad_type === "channel" ? "کانال" : "گروه"}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryLabel(ad.category)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>{(ad.members || 0).toLocaleString("fa-IR")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {getStatusBadge(ad.status, !!ad.deleted_at)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(ad.created_at).toLocaleDateString("fa-IR")}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={processing === ad.id}
                                >
                                  {processing === ad.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <a
                                    href={ad.telegram_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="gap-2"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    مشاهده در تلگرام
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(`/edit-ad/${ad.id}`)}>
                                  <Edit className="h-4 w-4 ml-2" />
                                  ویرایش
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                
                                {!ad.deleted_at && (
                                  <>
                                    {ad.status !== "approved" && (
                                      <DropdownMenuItem onClick={() => updateAdStatus(ad.id, "approved")}>
                                        <Check className="h-4 w-4 ml-2 text-green-600" />
                                        تأیید
                                      </DropdownMenuItem>
                                    )}
                                    {ad.status !== "rejected" && (
                                      <DropdownMenuItem onClick={() => updateAdStatus(ad.id, "rejected")}>
                                        <X className="h-4 w-4 ml-2 text-red-600" />
                                        رد
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => softDeleteAd(ad.id)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 ml-2" />
                                      حذف
                                    </DropdownMenuItem>
                                  </>
                                )}

                                {ad.deleted_at && (
                                  <>
                                    <DropdownMenuItem onClick={() => restoreAd(ad.id)}>
                                      <RotateCcw className="h-4 w-4 ml-2" />
                                      بازیابی
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => permanentDeleteAd(ad.id)}
                                      className="text-destructive"
                                    >
                                      <AlertTriangle className="h-4 w-4 ml-2" />
                                      حذف دائم
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </div>
  );
}
