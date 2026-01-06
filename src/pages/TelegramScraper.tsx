import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, RefreshCw, ExternalLink, Image as ImageIcon } from "lucide-react";
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
import { CATEGORIES, PROVINCES, AD_TYPES } from "@/lib/constants";

interface ScrapedAd {
  name: string;
  text: string;
  telegramLink: string;
  category: string;
  adType: 'group' | 'channel';
  members?: number;
  imageUrl?: string;
  selected?: boolean;
  cities?: string[];
}

export default function TelegramScraper() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [channelUrl, setChannelUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [scrapedAds, setScrapedAds] = useState<ScrapedAd[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("chat");
  const [defaultAdType, setDefaultAdType] = useState<'group' | 'channel'>("group");

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
        body: { 
          channelUrl: channelUrl.trim(),
          adType: defaultAdType,
        },
      });

      if (error) throw error;

      if (data.success && data.ads) {
        // Get all province values for default cities
        const allCities = PROVINCES.map(p => p.value);
        
        const adsWithSelection = data.ads.map((ad: ScrapedAd) => ({
          ...ad,
          category: defaultCategory,
          adType: defaultAdType,
          selected: false,
          cities: allCities, // Default to all cities
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

  const updateAdCategory = (index: number, category: string) => {
    setScrapedAds(prev => prev.map((ad, i) => 
      i === index ? { ...ad, category } : ad
    ));
  };

  const updateAdType = (index: number, adType: 'group' | 'channel') => {
    setScrapedAds(prev => prev.map((ad, i) => 
      i === index ? { ...ad, adType } : ad
    ));
  };

  const saveSingleAd = async (index: number) => {
    const ad = scrapedAds[index];
    if (!ad) return;

    setIsSaving(`single-${index}`);

    try {
      const adToInsert = {
        user_id: user?.id,
        name: ad.name,
        text: ad.text,
        telegram_link: ad.telegramLink,
        category: ad.category,
        ad_type: ad.adType,
        members: ad.members || 0,
        image_url: ad.imageUrl || null,
        cities: ad.cities || [],
        is_approved: true,
        status: 'active',
      };

      const { error } = await supabase.from('ads').insert(adToInsert);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `آگهی "${ad.name}" ذخیره شد`,
      });

      // Remove the saved ad from list
      setScrapedAds(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "خطا",
        description: "ذخیره آگهی با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
    }
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

    setIsSaving('bulk');

    try {
      const adsToInsert = selectedAds.map(ad => ({
        user_id: user?.id,
        name: ad.name,
        text: ad.text,
        telegram_link: ad.telegramLink,
        category: ad.category,
        ad_type: ad.adType,
        members: ad.members || 0,
        image_url: ad.imageUrl || null,
        cities: ad.cities || [],
        is_approved: true,
        status: 'active',
      }));

      const { error } = await supabase.from('ads').insert(adsToInsert);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${selectedAds.length} آگهی ذخیره شد`,
      });

      // Remove saved ads from list
      setScrapedAds(prev => prev.filter(ad => !ad.selected));
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "خطا",
        description: "ذخیره آگهی‌ها با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsSaving(null);
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع آگهی</Label>
                <Select value={defaultAdType} onValueChange={(val) => setDefaultAdType(val as 'group' | 'channel')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AD_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>دسته‌بندی پیش‌فرض</Label>
                <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                  <SelectTrigger>
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
            </div>

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
          </CardContent>
        </Card>

        {scrapedAds.length > 0 && (
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>آگهی‌های یافت شده ({scrapedAds.length})</CardTitle>
                {selectedCount > 0 && (
                  <Button 
                    onClick={saveSelectedAds} 
                    disabled={isSaving === 'bulk'}
                  >
                    {isSaving === 'bulk' ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <Plus className="h-4 w-4 ml-2" />
                    )}
                    ذخیره {selectedCount} آگهی انتخاب شده
                  </Button>
                )}
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
                      
                      {/* Image preview */}
                      {ad.imageUrl && (
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {!ad.imageUrl && (
                        <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{ad.name}</h3>
                          <div className="flex items-center gap-2">
                            {ad.members && (
                              <Badge variant="outline">
                                {ad.members.toLocaleString('fa-IR')} عضو
                              </Badge>
                            )}
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
                        
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">نوع:</Label>
                            <Select 
                              value={ad.adType} 
                              onValueChange={(val) => updateAdType(index, val as 'group' | 'channel')}
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {AD_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">دسته‌بندی:</Label>
                            <Select 
                              value={ad.category} 
                              onValueChange={(val) => updateAdCategory(index, val)}
                            >
                              <SelectTrigger className="h-8 w-32">
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
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => saveSingleAd(index)}
                            disabled={isSaving === `single-${index}`}
                            className="mr-auto"
                          >
                            {isSaving === `single-${index}` ? (
                              <Loader2 className="h-3 w-3 animate-spin ml-1" />
                            ) : (
                              <Plus className="h-3 w-3 ml-1" />
                            )}
                            اضافه کردن
                          </Button>
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
