import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, RefreshCw, Trash2, ExternalLink, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/constants";

interface ScrapedAd {
  name: string;
  text: string;
  telegramLink: string;
  category: string;
  adType: 'group' | 'channel';
  members?: number;
  selected?: boolean;
}

export default function TelegramScraper() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [channelUrl, setChannelUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapedAds, setScrapedAds] = useState<ScrapedAd[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("social");

  const handleScrape = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "خطا",
        description: "لینک کانال را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setScrapedAds([]);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-telegram', {
        body: { channelUrl: channelUrl.trim() },
      });

      if (error) throw error;

      if (data.success && data.ads) {
        const adsWithSelection = data.ads.map((ad: ScrapedAd) => ({
          ...ad,
          category: defaultCategory,
          selected: true,
        }));
        setScrapedAds(adsWithSelection);
        toast({
          title: "موفق",
          description: `${data.ads.length} آگهی پیدا شد`,
        });
      } else {
        throw new Error(data.error || 'خطا در استخراج');
      }
    } catch (error) {
      console.error('Scrape error:', error);
      toast({
        title: "خطا",
        description: "استخراج آگهی‌ها با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAdSelection = (index: number) => {
    setScrapedAds(prev => prev.map((ad, i) => 
      i === index ? { ...ad, selected: !ad.selected } : ad
    ));
  };

  const toggleAllAds = () => {
    const allSelected = scrapedAds.every(ad => ad.selected);
    setScrapedAds(prev => prev.map(ad => ({ ...ad, selected: !allSelected })));
  };

  const updateAdCategory = (index: number, category: string) => {
    setScrapedAds(prev => prev.map((ad, i) => 
      i === index ? { ...ad, category } : ad
    ));
  };

  const saveSelectedAds = async () => {
    const selectedAds = scrapedAds.filter(ad => ad.selected);
    if (selectedAds.length === 0) {
      toast({
        title: "خطا",
        description: "حداقل یک آگهی انتخاب کنید",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const adsToInsert = selectedAds.map(ad => ({
        user_id: user?.id,
        name: ad.name,
        text: ad.text,
        telegram_link: ad.telegramLink,
        category: ad.category,
        ad_type: ad.adType,
        members: ad.members || 0,
        is_approved: true, // Auto-approve scraped ads
        status: 'active',
      }));

      const { error } = await supabase.from('ads').insert(adsToInsert);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${selectedAds.length} آگهی ذخیره شد`,
      });

      setScrapedAds([]);
      setChannelUrl("");
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "خطا",
        description: "ذخیره آگهی‌ها با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>دسترسی محدود</CardTitle>
            <CardDescription>فقط مدیران به این بخش دسترسی دارند</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/">بازگشت به صفحه اصلی</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedCount = scrapedAds.filter(ad => ad.selected).length;

  return (
    <div className="min-h-screen gradient-hero py-8">
      <div className="container max-w-4xl">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link to="/admin">
            <ArrowRight className="h-4 w-4" />
            بازگشت به پنل ادمین
          </Link>
        </Button>

        <Card className="shadow-card animate-slide-up mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <RefreshCw className="h-6 w-6" />
              استخراج آگهی از تلگرام
            </CardTitle>
            <CardDescription>
              لینک کانال لینکدونی را وارد کنید تا آگهی‌ها استخراج شوند
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-url">لینک کانال تلگرام</Label>
              <div className="flex gap-2">
                <Input
                  id="channel-url"
                  placeholder="https://t.me/channel_name"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
                <Button onClick={handleScrape} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  استخراج
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>دسته‌بندی پیش‌فرض</Label>
              <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
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
            </div>
          </CardContent>
        </Card>

        {scrapedAds.length > 0 && (
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>آگهی‌های یافت شده ({scrapedAds.length})</CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={toggleAllAds}>
                    {scrapedAds.every(ad => ad.selected) ? 'لغو همه' : 'انتخاب همه'}
                  </Button>
                  <Button 
                    onClick={saveSelectedAds} 
                    disabled={isSaving || selectedCount === 0}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    ذخیره {selectedCount} آگهی
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scrapedAds.map((ad, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border transition-colors ${
                      ad.selected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={ad.selected}
                        onCheckedChange={() => toggleAdSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{ad.name}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant={ad.adType === 'channel' ? 'default' : 'secondary'}>
                              {ad.adType === 'channel' ? 'کانال' : 'گروه'}
                            </Badge>
                            <a 
                              href={ad.telegramLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ad.text}
                        </p>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">دسته‌بندی:</Label>
                          <Select 
                            value={ad.category} 
                            onValueChange={(val) => updateAdCategory(index, val)}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>
                                  <div className="flex items-center gap-2">
                                    <cat.icon className="h-3 w-3" />
                                    {cat.label}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
