import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Search, Trash2, Edit, Loader2, ExternalLink, MessageCircle, RotateCcw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  deleted_at: string | null;
}

export default function ManageAds() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const { canApproveAds, loading: roleLoading } = useUserRole();
  const [activeAds, setActiveAds] = useState<Ad[]>([]);
  const [deletedAds, setDeletedAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("active");

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

  const fetchAds = async () => {
    try {
      // Fetch active ads (deleted_at is null)
      const { data: active, error: activeError } = await supabase
        .from("ads")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (activeError) throw activeError;

      // Fetch deleted ads (deleted_at is not null)
      const { data: deleted, error: deletedError } = await supabase
        .from("ads")
        .select("*")
        .not("deleted_at", "is", null)
        .order("deleted_at", { ascending: false });

      if (deletedError) throw deletedError;

      setActiveAds(active || []);
      setDeletedAds(deleted || []);
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

      // Move ad from active to deleted
      const deletedAd = activeAds.find(ad => ad.id === adId);
      if (deletedAd) {
        setActiveAds(activeAds.filter(ad => ad.id !== adId));
        setDeletedAds([{ ...deletedAd, deleted_at: new Date().toISOString() }, ...deletedAds]);
      }
      
      // Invalidate the ads query cache so the home page refreshes
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

      // Move ad from deleted to active
      const restoredAd = deletedAds.find(ad => ad.id === adId);
      if (restoredAd) {
        setDeletedAds(deletedAds.filter(ad => ad.id !== adId));
        setActiveAds([{ ...restoredAd, deleted_at: null }, ...activeAds]);
      }
      
      // Invalidate the ads query cache
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

  const filterAds = (ads: Ad[]) => {
    return ads.filter((ad) => {
      const matchesSearch = ad.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ad.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || ad.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || ad.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  };

  const filteredActiveAds = filterAds(activeAds);
  const filteredDeletedAds = filterAds(deletedAds);

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">مدیریت آگهی‌ها</h1>
          <p className="text-muted-foreground mt-2">حذف و ویرایش آگهی‌ها</p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="active" className="gap-2">
              آگهی‌های فعال
              <Badge variant="secondary" className="mr-1">{activeAds.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="deleted" className="gap-2">
              آگهی‌های حذف شده
              <Badge variant="secondary" className="mr-1">{deletedAds.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card className="my-6">
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="جستجو در آگهی‌ها..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="وضعیت" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                    <SelectItem value="pending">در انتظار</SelectItem>
                    <SelectItem value="approved">تأیید شده</SelectItem>
                    <SelectItem value="rejected">رد شده</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="دسته‌بندی" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه دسته‌ها</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Active Ads Tab */}
          <TabsContent value="active">
            <div className="text-sm text-muted-foreground mb-4">
              {filteredActiveAds.length} آگهی فعال
            </div>
            <div className="space-y-4">
              {filteredActiveAds.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    آگهی فعالی یافت نشد
                  </CardContent>
                </Card>
              ) : (
                filteredActiveAds.map((ad) => (
                  <AdManageCard
                    key={ad.id}
                    ad={ad}
                    onDelete={() => softDeleteAd(ad.id)}
                    processing={processing === ad.id}
                    isDeleted={false}
                  />
                ))
              )}
            </div>
          </TabsContent>

          {/* Deleted Ads Tab */}
          <TabsContent value="deleted">
            <div className="text-sm text-muted-foreground mb-4">
              {filteredDeletedAds.length} آگهی حذف شده
            </div>
            <div className="space-y-4">
              {filteredDeletedAds.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    آگهی حذف شده‌ای یافت نشد
                  </CardContent>
                </Card>
              ) : (
                filteredDeletedAds.map((ad) => (
                  <AdManageCard
                    key={ad.id}
                    ad={ad}
                    onRestore={() => restoreAd(ad.id)}
                    processing={processing === ad.id}
                    isDeleted={true}
                  />
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AdManageCardProps {
  ad: Ad;
  onDelete?: () => void;
  onRestore?: () => void;
  processing: boolean;
  isDeleted: boolean;
}

function AdManageCard({ ad, onDelete, onRestore, processing, isDeleted }: AdManageCardProps) {
  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon || MessageCircle;

  return (
    <Card className={isDeleted ? "opacity-75" : ""}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <h3 className="font-medium truncate">{ad.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">
                    {ad.ad_type === "channel" ? "کانال" : "گروه"}
                  </Badge>
                  <Badge variant="secondary" className="gap-1 text-xs">
                    <CategoryIcon className="h-3 w-3" />
                    {category?.label || ad.category}
                  </Badge>
                  <span className="text-muted-foreground">
                    {ad.members?.toLocaleString("fa-IR")} عضو
                  </span>
                  <Badge
                    variant={
                      ad.status === "approved"
                        ? "default"
                        : ad.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {ad.status === "approved"
                      ? "تأیید شده"
                      : ad.status === "rejected"
                      ? "رد شده"
                      : "در انتظار"}
                  </Badge>
                  {isDeleted && (
                    <Badge variant="destructive">حذف شده</Badge>
                  )}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2">{ad.text}</p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="icon" asChild className="h-9 w-9">
              <a href={ad.telegram_link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            
            {!isDeleted && (
              <>
                <Button variant="ghost" size="icon" asChild className="h-9 w-9">
                  <Link to={`/edit-ad/${ad.id}`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={processing}
                    >
                      {processing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف آگهی</AlertDialogTitle>
                      <AlertDialogDescription>
                        آیا مطمئن هستید که می‌خواهید «{ad.name}» را حذف کنید؟ این آگهی به بخش حذف شده‌ها منتقل می‌شود.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>انصراف</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        حذف
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}

            {isDeleted && onRestore && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onRestore}
                disabled={processing}
                className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
