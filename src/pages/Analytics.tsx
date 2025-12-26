import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Eye, MousePointer, Users, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/constants";

interface AdStats {
  id: string;
  name: string;
  category: string;
  views: number;
  clicks: number;
  likes: number;
}

interface OverallStats {
  totalViews: number;
  totalClicks: number;
  totalVisits: number;
  totalAds: number;
  totalLikes: number;
}

export default function Analytics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const [adStats, setAdStats] = useState<AdStats[]>([]);
  const [overall, setOverall] = useState<OverallStats>({
    totalViews: 0,
    totalClicks: 0,
    totalVisits: 0,
    totalAds: 0,
    totalLikes: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !isAdmin) {
      toast({
        title: "دسترسی ندارید",
        description: "فقط ادمین‌ها به آمار دسترسی دارند",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [user, authLoading, isAdmin, roleLoading, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    try {
      // Fetch all ads
      const { data: ads, error: adsError } = await supabase
        .from("ads")
        .select("id, name, category");
      if (adsError) throw adsError;

      // Fetch view counts
      const { data: views, error: viewsError } = await supabase
        .from("ad_views")
        .select("ad_id");
      if (viewsError) throw viewsError;

      // Fetch click counts
      const { data: clicks, error: clicksError } = await supabase
        .from("ad_clicks")
        .select("ad_id");
      if (clicksError) throw clicksError;

      // Fetch site visits
      const { count: visitsCount, error: visitsError } = await supabase
        .from("site_visits")
        .select("*", { count: "exact", head: true });
      if (visitsError) throw visitsError;

      // Fetch likes
      const { data: likes, error: likesError } = await supabase
        .from("ad_likes")
        .select("ad_id");
      if (likesError) throw likesError;

      // Calculate stats per ad
      const viewCounts = views?.reduce((acc, v) => {
        acc[v.ad_id] = (acc[v.ad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const clickCounts = clicks?.reduce((acc, c) => {
        acc[c.ad_id] = (acc[c.ad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const likeCounts = likes?.reduce((acc, l) => {
        acc[l.ad_id] = (acc[l.ad_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const statsPerAd: AdStats[] = (ads || []).map((ad) => ({
        id: ad.id,
        name: ad.name,
        category: ad.category,
        views: viewCounts[ad.id] || 0,
        clicks: clickCounts[ad.id] || 0,
        likes: likeCounts[ad.id] || 0,
      }));

      // Sort by views
      statsPerAd.sort((a, b) => b.views - a.views);

      setAdStats(statsPerAd);
      setOverall({
        totalViews: views?.length || 0,
        totalClicks: clicks?.length || 0,
        totalVisits: visitsCount || 0,
        totalAds: ads?.length || 0,
        totalLikes: likes?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "خطا",
        description: "خطا در بارگذاری آمار",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            آمار و آنالیتیکز
          </h1>
          <p className="text-muted-foreground mt-2">مشاهده آمار کلی سایت و آگهی‌ها</p>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                بازدید سایت
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalVisits.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Eye className="h-4 w-4" />
                بازدید آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalViews.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <MousePointer className="h-4 w-4" />
                کلیک روی آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalClicks.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                لایک‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalLikes.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                تعداد آگهی‌ها
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalAds.toLocaleString("fa-IR")}</div>
            </CardContent>
          </Card>
        </div>

        {/* Top Ads Table */}
        <Card>
          <CardHeader>
            <CardTitle>پربازدیدترین آگهی‌ها</CardTitle>
          </CardHeader>
          <CardContent>
            {adStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">آگهی‌ای وجود ندارد</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-right py-3 px-2">نام آگهی</th>
                      <th className="text-right py-3 px-2">دسته‌بندی</th>
                      <th className="text-center py-3 px-2">بازدید</th>
                      <th className="text-center py-3 px-2">کلیک</th>
                      <th className="text-center py-3 px-2">لایک</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adStats.slice(0, 20).map((ad) => {
                      const category = CATEGORIES.find((c) => c.value === ad.category);
                      return (
                        <tr key={ad.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{ad.name}</td>
                          <td className="py-3 px-2 text-muted-foreground">
                            {category?.label || ad.category}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {ad.views.toLocaleString("fa-IR")}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {ad.clicks.toLocaleString("fa-IR")}
                          </td>
                          <td className="py-3 px-2 text-center">
                            {ad.likes.toLocaleString("fa-IR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
