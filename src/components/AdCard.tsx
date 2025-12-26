import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { ExternalLink, Copy, Users, MapPin, UserCircle, Check, Heart, Tag } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RankedAd } from "@/lib/types";
import { CATEGORIES, CITIES, AGE_GROUPS, TAGS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { trackAdClick, likeAd, unlikeAd, getAdLikesCount, isAdLikedByUser } from "@/lib/analytics";

interface AdCardProps {
  ad: RankedAd;
}

const MAX_CITIES_DISPLAY = 5;

export function AdCard({ ad }: AdCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);

  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon;

  // Show max 5 cities
  const displayCities = ad.cities.slice(0, MAX_CITIES_DISPLAY);
  const remainingCitiesCount = ad.cities.length - MAX_CITIES_DISPLAY;
  const cityLabels = displayCities
    .map((c) => CITIES.find((city) => city.value === c)?.label)
    .filter(Boolean);

  const ageLabel = ad.ageGroups.includes("all")
    ? "همه سنین"
    : ad.ageGroups
        .slice(0, 1)
        .map((a) => AGE_GROUPS.find((age) => age.value === a)?.label)
        .filter(Boolean)
        .join("، ");

  const timeAgo = formatDistanceToNow(new Date(ad.createdAt), {
    addSuffix: true,
    locale: faIR,
  });

  // Get tag labels (both predefined and custom)
  const tagLabels = ad.tags.map((tag) => {
    const predefinedTag = TAGS.find((t) => t.value === tag);
    return predefinedTag ? predefinedTag.label : tag;
  });

  useEffect(() => {
    loadLikeData();
  }, [ad.id, user]);

  const loadLikeData = async () => {
    const count = await getAdLikesCount(ad.id);
    setLikesCount(count);
    
    if (user) {
      const isLiked = await isAdLikedByUser(ad.id, user.id);
      setLiked(isLiked);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "ورود لازم است",
        description: "برای لایک کردن باید وارد شوید",
        variant: "destructive",
      });
      return;
    }

    setLikeLoading(true);
    try {
      if (liked) {
        const success = await unlikeAd(ad.id, user.id);
        if (success) {
          setLiked(false);
          setLikesCount((prev) => prev - 1);
        }
      } else {
        const success = await likeAd(ad.id, user.id);
        if (success) {
          setLiked(true);
          setLikesCount((prev) => prev + 1);
        }
      }
    } catch (error) {
      toast({
        title: "خطا",
        description: "عملیات با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(ad.telegramLink);
      setCopied(true);
      toast({
        title: "کپی شد!",
        description: "لینک تلگرام در کلیپ‌بورد کپی شد.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "خطا",
        description: "کپی لینک با مشکل مواجه شد.",
        variant: "destructive",
      });
    }
  };

  const handleVisit = async () => {
    await trackAdClick(ad.id, user?.id);
  };

  const formatMembers = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-card-hover animate-fade-in">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-48 sm:h-auto sm:w-48 flex-shrink-0 overflow-hidden">
          <img
            src={ad.imageUrl || "/placeholder.svg"}
            alt={ad.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent sm:bg-gradient-to-l" />
          
          {/* Like button overlay */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLike}
            disabled={likeLoading}
            className={cn(
              "absolute top-2 right-2 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm",
              liked && "text-red-500"
            )}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-current")} />
          </Button>
          <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {likesCount.toLocaleString("fa-IR")}
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <h3 className="text-lg font-bold leading-tight text-foreground line-clamp-1">
                  {ad.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{timeAgo}</p>
              </div>
              {category && (
                <Badge variant="secondary" className="gap-1 flex-shrink-0">
                  {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                  {category.label}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 pb-2">
            <p className="text-sm text-muted-foreground line-clamp-2">{ad.text}</p>
            
            {/* Tags display */}
            {tagLabels.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tagLabels.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex flex-wrap items-center gap-2 pt-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {formatMembers(ad.members)} عضو
            </Badge>
            {cityLabels.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <MapPin className="h-3 w-3" />
                {cityLabels.join("، ")}
                {remainingCitiesCount > 0 && ` +${remainingCitiesCount}`}
              </Badge>
            )}
            {ageLabel && (
              <Badge variant="outline" className="gap-1 text-xs">
                <UserCircle className="h-3 w-3" />
                {ageLabel}
              </Badge>
            )}

            <div className="mr-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyLink}
                className={cn(
                  "gap-1 text-xs",
                  copied && "text-success"
                )}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "کپی شد" : "کپی لینک"}
              </Button>
              <Button size="sm" asChild className="gap-1 text-xs" onClick={handleVisit}>
                <a href={ad.telegramLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  بازدید
                </a>
              </Button>
            </div>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
