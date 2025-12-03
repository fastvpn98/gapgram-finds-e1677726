import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { faIR } from "date-fns/locale";
import { ExternalLink, Copy, Users, MapPin, UserCircle, Check } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { RankedAd } from "@/lib/types";
import { CATEGORIES, CITIES, AGE_GROUPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface AdCardProps {
  ad: RankedAd;
}

export function AdCard({ ad }: AdCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon;

  const cityLabels = ad.cities
    .slice(0, 2)
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
            src={ad.imageUrl}
            alt={ad.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent sm:bg-gradient-to-l" />
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
                {ad.cities.length > 2 && ` +${ad.cities.length - 2}`}
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
              <Button size="sm" asChild className="gap-1 text-xs">
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
