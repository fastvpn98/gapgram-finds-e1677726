import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns-jalali";
import { 
  PlusCircle, 
  Pencil, 
  Trash2, 
  Loader2, 
  MessageCircle,
  ExternalLink,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getUserAds, deleteAd } from "@/lib/ads";
import { RankedAd } from "@/lib/types";
import { CATEGORIES } from "@/lib/constants";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const { data: ads = [], isLoading } = useQuery({
    queryKey: ["userAds", user?.id],
    queryFn: () => getUserAds(user!.id),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAd,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAds"] });
      toast({ title: "آگهی حذف شد", description: "آگهی شما با موفقیت حذف شد." });
    },
    onError: () => {
      toast({ title: "خطا", description: "مشکلی در حذف آگهی رخ داد.", variant: "destructive" });
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const handleDelete = (adId: string) => {
    setDeletingId(adId);
    deleteMutation.mutate(adId);
  };

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "کاربر";
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const initials = displayName.slice(0, 2).toUpperCase();
  const memberSince = user.created_at ? format(new Date(user.created_at), "d MMMM yyyy") : "";

  return (
    <main className="flex-1 container py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Profile Section */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <CardTitle className="text-xl">{displayName}</CardTitle>
                  <CardDescription className="text-base">{user.email}</CardDescription>
                  {memberSince && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      عضویت از {memberSince}
                    </p>
                  )}
                </div>
              </div>
              <Button variant="outline" asChild>
                <Link to="/change-password">تغییر رمز عبور</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Ads Section */}
        <Card className="shadow-card">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-xl">آگهی‌های من</CardTitle>
              <CardDescription>{ads.length} آگهی ثبت شده</CardDescription>
            </div>
            <Button asChild className="gap-2">
              <Link to="/submit-ad">
                <PlusCircle className="h-4 w-4" />
                ثبت آگهی جدید
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ads.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-lg">هنوز آگهی ثبت نکرده‌اید</h3>
                  <p className="text-muted-foreground">
                    اولین آگهی خود را ثبت کنید و کانال یا گروه تلگرام خود را معرفی کنید.
                  </p>
                </div>
                <Button asChild className="gap-2">
                  <Link to="/submit-ad">
                    <PlusCircle className="h-4 w-4" />
                    ثبت آگهی
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {ads.map((ad) => (
                  <AdListItem 
                    key={ad.id} 
                    ad={ad} 
                    onDelete={handleDelete}
                    isDeleting={deletingId === ad.id}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

interface AdListItemProps {
  ad: RankedAd;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

function AdListItem({ ad, onDelete, isDeleting }: AdListItemProps) {
  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon || MessageCircle;

  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
        <img
          src={ad.imageUrl}
          alt={ad.name}
          className="h-full w-full object-cover"
        />
      </div>
      
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <h3 className="font-medium truncate">{ad.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="gap-1 text-xs">
                <CategoryIcon className="h-3 w-3" />
                {category?.label || ad.category}
              </Badge>
              <span>•</span>
              <span>{ad.members?.toLocaleString("fa-IR")} عضو</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-1">{ad.text}</p>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <a href={ad.telegramLink} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
        <Button variant="ghost" size="icon" asChild className="h-9 w-9">
          <Link to={`/edit-ad/${ad.id}`}>
            <Pencil className="h-4 w-4" />
          </Link>
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10">
              {isDeleting ? (
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
                آیا مطمئن هستید که می‌خواهید «{ad.name}» را حذف کنید؟ این عمل قابل بازگشت نیست.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>انصراف</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => onDelete(ad.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
