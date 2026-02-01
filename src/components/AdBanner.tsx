import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AdBannerProps {
  position: "top" | "sidebar" | "bottom";
  className?: string;
}

// Placeholder for admin-managed banners
// In a real implementation, this would fetch from database
export function AdBanner({ position, className = "" }: AdBannerProps) {
  const bannerConfig = {
    top: {
      height: "h-24 md:h-28",
      text: "فضای تبلیغاتی بالا",
    },
    sidebar: {
      height: "h-64",
      text: "فضای تبلیغاتی کناری",
    },
    bottom: {
      height: "h-24 md:h-28",
      text: "فضای تبلیغاتی پایین",
    },
  };

  const config = bannerConfig[position];

  return (
    <Card className={`overflow-hidden border-dashed border-2 border-muted-foreground/20 bg-muted/30 ${className}`}>
      <CardContent className={`flex items-center justify-center ${config.height} p-4`}>
        <div className="text-center text-muted-foreground">
          <p className="text-sm font-medium">{config.text}</p>
          <p className="text-xs mt-1">برای رزرو با مدیریت تماس بگیرید</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Admin placeholder for future banner management
interface BannerSlot {
  id: string;
  position: "top" | "sidebar" | "bottom";
  imageUrl?: string;
  link?: string;
  isActive: boolean;
}

export function BannerPlaceholder({ 
  slot, 
  onEdit 
}: { 
  slot: BannerSlot; 
  onEdit?: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              بنر {slot.position === "top" ? "بالا" : slot.position === "sidebar" ? "کناری" : "پایین"}
            </p>
            <p className="text-sm text-muted-foreground">
              {slot.isActive ? "فعال" : "غیرفعال"}
            </p>
          </div>
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit}>
              ویرایش
            </Button>
          )}
        </div>
        {slot.imageUrl && (
          <img 
            src={slot.imageUrl} 
            alt="Banner" 
            className="mt-4 rounded-lg w-full h-32 object-cover"
          />
        )}
        {slot.link && (
          <a 
            href={slot.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary mt-2 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            {slot.link}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
