import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, X, Clock, Eye, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/constants";

interface PendingAd {
  id: string;
  name: string;
  text: string;
  category: string;
  telegram_link: string;
  members: number;
  status: string;
  created_at: string;
  user_id: string;
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { canApproveAds, loading: roleLoading } = useUserRole();
  const [ads, setAds] = useState<PendingAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    } else if (!roleLoading && !canApproveAds) {
      toast({
        title: "دسترسی ندارید",
        description: "شما مجوز دسترسی به پنل مدیریت را ندارید",
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

  const updateAdStatus = async (adId: string, status: "approved" | "rejected") => {
    setProcessing(adId);
    try {
      const { error } = await supabase
        .from("ads")
        .update({
          status,
          is_approved: status === "approved",
        })
        .eq("id", adId);

      if (error) throw error;

      toast({
        title: status === "approved" ? "تأیید شد" : "رد شد",
        description: `آگهی با موفقیت ${status === "approved" ? "تأیید" : "رد"} شد`,
      });

      fetchAds();
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

  if (authLoading || roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingAds = ads.filter((ad) => ad.status === "pending");
  const approvedAds = ads.filter((ad) => ad.status === "approved");
  const rejectedAds = ads.filter((ad) => ad.status === "rejected");

  return (
    <div className="min-h-screen gradient-hero py-8">
      <div className="container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">پنل مدیریت</h1>
          <p className="text-muted-foreground mt-2">مدیریت و تأیید آگهی‌ها</p>
        </div>

        <Tabs defaultValue="pending" className="space-y-6" dir="rtl">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="pending" className="gap-2">
              <Clock className="h-4 w-4" />
              در انتظار ({pendingAds.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="gap-2">
              <Check className="h-4 w-4" />
              تأیید شده ({approvedAds.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-2">
              <X className="h-4 w-4" />
              رد شده ({rejectedAds.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingAds.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  آگهی در انتظار تأیید وجود ندارد
                </CardContent>
              </Card>
            ) : (
              pendingAds.map((ad) => (
                <AdApprovalCard
                  key={ad.id}
                  ad={ad}
                  onApprove={() => updateAdStatus(ad.id, "approved")}
                  onReject={() => updateAdStatus(ad.id, "rejected")}
                  processing={processing === ad.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedAds.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  آگهی تأیید شده‌ای وجود ندارد
                </CardContent>
              </Card>
            ) : (
              approvedAds.map((ad) => (
                <AdApprovalCard
                  key={ad.id}
                  ad={ad}
                  onApprove={() => updateAdStatus(ad.id, "approved")}
                  onReject={() => updateAdStatus(ad.id, "rejected")}
                  processing={processing === ad.id}
                  showActions={false}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedAds.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  آگهی رد شده‌ای وجود ندارد
                </CardContent>
              </Card>
            ) : (
              rejectedAds.map((ad) => (
                <AdApprovalCard
                  key={ad.id}
                  ad={ad}
                  onApprove={() => updateAdStatus(ad.id, "approved")}
                  onReject={() => updateAdStatus(ad.id, "rejected")}
                  processing={processing === ad.id}
                  showActions
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

interface AdApprovalCardProps {
  ad: PendingAd;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
  showActions?: boolean;
}

function AdApprovalCard({
  ad,
  onApprove,
  onReject,
  processing,
  showActions = true,
}: AdApprovalCardProps) {
  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{ad.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {category && (
                <Badge variant="secondary" className="gap-1">
                  {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                  {category.label}
                </Badge>
              )}
              <Badge variant="outline">{ad.members} عضو</Badge>
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
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{ad.text}</p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <a
            href={ad.telegram_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <Eye className="h-4 w-4" />
            مشاهده در تلگرام
          </a>
        </div>
        {showActions && (
          <div className="flex gap-2">
            <Button
              onClick={onApprove}
              disabled={processing}
              className="gap-2"
              variant={ad.status === "approved" ? "secondary" : "default"}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              تأیید
            </Button>
            <Button
              onClick={onReject}
              disabled={processing}
              variant="destructive"
              className="gap-2"
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              رد
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
