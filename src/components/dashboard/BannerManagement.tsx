import { useState } from "react";
import { Image, Upload, Trash2, Link as LinkIcon, Save, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface BannerSlot {
  id: string;
  position: "top" | "sidebar" | "bottom";
  imageUrl: string;
  link: string;
  isActive: boolean;
}

// Placeholder data - in real implementation this would come from database
const initialBanners: BannerSlot[] = [
  { id: "1", position: "top", imageUrl: "", link: "", isActive: false },
  { id: "2", position: "sidebar", imageUrl: "", link: "", isActive: false },
  { id: "3", position: "bottom", imageUrl: "", link: "", isActive: false },
];

const positionLabels = {
  top: "بنر بالا (صفحه جزئیات آگهی)",
  sidebar: "بنر کناری (صفحه جزئیات آگهی)",
  bottom: "بنر پایین (صفحه جزئیات آگهی)",
};

export function BannerManagement() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<BannerSlot[]>(initialBanners);
  const [saving, setSaving] = useState(false);

  const handleBannerChange = (id: string, field: keyof BannerSlot, value: string | boolean) => {
    setBanners((prev) =>
      prev.map((banner) =>
        banner.id === id ? { ...banner, [field]: value } : banner
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Simulate save - in real implementation this would save to database
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast({
      title: "ذخیره شد",
      description: "تنظیمات بنرها ذخیره شد",
    });
    
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">مدیریت بنرهای تبلیغاتی</h3>
          <p className="text-sm text-muted-foreground">
            بنرهای تبلیغاتی در صفحه جزئیات آگهی نمایش داده می‌شوند
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          ذخیره تغییرات
        </Button>
      </div>

      <div className="grid gap-6">
        {banners.map((banner) => (
          <Card key={banner.id}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    {positionLabels[banner.position]}
                  </CardTitle>
                  <CardDescription>
                    {banner.position === "top" && "نمایش در بالای صفحه جزئیات"}
                    {banner.position === "sidebar" && "نمایش در ستون کناری"}
                    {banner.position === "bottom" && "نمایش در پایین محتوا"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor={`active-${banner.id}`} className="text-sm">
                    {banner.isActive ? "فعال" : "غیرفعال"}
                  </Label>
                  <Switch
                    id={`active-${banner.id}`}
                    checked={banner.isActive}
                    onCheckedChange={(checked) =>
                      handleBannerChange(banner.id, "isActive", checked)
                    }
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`image-${banner.id}`} className="flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    آدرس تصویر
                  </Label>
                  <Input
                    id={`image-${banner.id}`}
                    placeholder="https://example.com/banner.jpg"
                    value={banner.imageUrl}
                    onChange={(e) =>
                      handleBannerChange(banner.id, "imageUrl", e.target.value)
                    }
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`link-${banner.id}`} className="flex items-center gap-2">
                    <LinkIcon className="h-4 w-4" />
                    لینک مقصد
                  </Label>
                  <Input
                    id={`link-${banner.id}`}
                    placeholder="https://example.com"
                    value={banner.link}
                    onChange={(e) =>
                      handleBannerChange(banner.id, "link", e.target.value)
                    }
                    dir="ltr"
                  />
                </div>
              </div>

              {banner.imageUrl && (
                <div className="rounded-lg border overflow-hidden bg-muted/50">
                  <img
                    src={banner.imageUrl}
                    alt={`پیش‌نمایش ${positionLabels[banner.position]}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="py-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">نکته</h4>
              <p className="text-sm text-muted-foreground mt-1">
                برای بهترین نتیجه، تصاویر بنر بالا و پایین را با نسبت ۴:۱ (مثلاً ۱۲۰۰×۳۰۰ پیکسل) 
                و بنر کناری را با نسبت ۱:۲ (مثلاً ۳۰۰×۶۰۰ پیکسل) آپلود کنید.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
