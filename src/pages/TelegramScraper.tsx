import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, RefreshCw, ExternalLink, Image as ImageIcon, Send, ChevronLeft, Check } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
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

type ViewMode = 'scrape' | 'publish';

export default function TelegramScraper() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [channelUrl, setChannelUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapedAds, setScrapedAds] = useState<ScrapedAd[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("chat");
  const [defaultAdType, setDefaultAdType] = useState<'group' | 'channel'>("group");
  const [viewMode, setViewMode] = useState<ViewMode>('scrape');
  const [editingAdIndex, setEditingAdIndex] = useState<number | null>(null);

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
        const allCities = PROVINCES.map(p => p.value);
        
        const adsWithSelection = data.ads.map((ad: ScrapedAd) => ({
          ...ad,
          category: defaultCategory,
          adType: defaultAdType,
          selected: false,
          cities: allCities,
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

  const selectAllAds = () => {
    const allSelected = scrapedAds.every(ad => ad.selected);
    setScrapedAds(prev => prev.map(ad => ({ ...ad, selected: !allSelected })));
  };

  const updateAd = (index: number, updates: Partial<ScrapedAd>) => {
    setScrapedAds(prev => prev.map((ad, i) => 
      i === index ? { ...ad, ...updates } : ad
    ));
  };

  const goToPublish = () => {
    const selectedAds = scrapedAds.filter(ad => ad.selected);
    if (selectedAds.length === 0) {
      toast({
        title: "خطا",
        description: "حداقل یک آگهی انتخاب کنید",
        variant: "destructive",
      });
      return;
    }
    setViewMode('publish');
  };

  const goBackToScrape = () => {
    setViewMode('scrape');
    setEditingAdIndex(null);
  };

  const publishSelectedAds = async () => {
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
        image_url: ad.imageUrl || null,
        cities: ad.cities || [],
        is_approved: true,
        status: 'active',
      }));

      const { error } = await supabase.from('ads').insert(adsToInsert);

      if (error) throw error;

      toast({
        title: "موفق",
        description: `${selectedAds.length} آگهی منتشر شد`,
      });

      // Remove published ads and go back
      setScrapedAds(prev => prev.filter(ad => !ad.selected));
      setViewMode('scrape');
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "خطا",
        description: "انتشار آگهی‌ها با مشکل مواجه شد",
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
  const selectedAdsForPublish = scrapedAds.filter(ad => ad.selected);

  // Publish View
  if (viewMode === 'publish') {
    return (
      <div className="min-h-screen gradient-hero py-8">
        <div className="container max-w-4xl">
          <Button variant="ghost" onClick={goBackToScrape} className="mb-6 gap-2">
            <ChevronLeft className="h-4 w-4" />
            بازگشت به استخراج
          </Button>

          <Card className="shadow-card animate-slide-up mb-6">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Send className="h-6 w-6" />
                    انتشار آگهی‌ها
                  </CardTitle>
                  <CardDescription>
                    {selectedAdsForPublish.length} آگهی آماده انتشار - ویرایش کنید و منتشر نمایید
                  </CardDescription>
                </div>
                <Button 
                  onClick={publishSelectedAds} 
                  disabled={isSaving || selectedAdsForPublish.length === 0}
                  size="lg"
                  className="gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                  انتشار {selectedAdsForPublish.length} آگهی
                </Button>
              </div>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {selectedAdsForPublish.map((ad, idx) => {
              const originalIndex = scrapedAds.findIndex(a => a.telegramLink === ad.telegramLink);
              const isEditing = editingAdIndex === originalIndex;
              
              return (
                <Card key={ad.telegramLink} className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {ad.imageUrl ? (
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                          <Label>نام آگهی</Label>
                          <Input
                            value={ad.name}
                            onChange={(e) => updateAd(originalIndex, { name: e.target.value })}
                            placeholder="نام گروه یا کانال"
                          />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label>توضیحات</Label>
                          <Textarea
                            value={ad.text}
                            onChange={(e) => updateAd(originalIndex, { text: e.target.value })}
                            placeholder="توضیحات آگهی"
                            rows={3}
                          />
                        </div>

                        {/* Type and Category */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="space-y-2">
                            <Label>نوع</Label>
                            <Select 
                              value={ad.adType} 
                              onValueChange={(val) => updateAd(originalIndex, { adType: val as 'group' | 'channel' })}
                            >
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
                            <Label>دسته‌بندی</Label>
                            <Select 
                              value={ad.category} 
                              onValueChange={(val) => updateAd(originalIndex, { category: val })}
                            >
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

                          <div className="space-y-2">
                            <Label>تعداد اعضا</Label>
                            <Input
                              type="number"
                              value={ad.members || ''}
                              onChange={(e) => updateAd(originalIndex, { members: parseInt(e.target.value) || 0 })}
                              placeholder="0"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>لینک</Label>
                            <Input
                              value={ad.telegramLink}
                              onChange={(e) => updateAd(originalIndex, { telegramLink: e.target.value })}
                              dir="ltr"
                              className="text-left"
                            />
                          </div>
                        </div>

                        {/* Remove from publish */}
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => toggleAdSelection(originalIndex)}
                          >
                            حذف از لیست انتشار
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Scrape View
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
                <Button onClick={handleScrape} disabled={isLoading} className="gap-2">
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
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <CardTitle>آگهی‌های یافت شده ({scrapedAds.length})</CardTitle>
                  <Button variant="outline" size="sm" onClick={selectAllAds}>
                    <Check className="h-4 w-4 ml-1" />
                    {scrapedAds.every(ad => ad.selected) ? 'لغو انتخاب همه' : 'انتخاب همه'}
                  </Button>
                </div>
                {selectedCount > 0 && (
                  <Button onClick={goToPublish} className="gap-2">
                    <Send className="h-4 w-4" />
                    انتشار {selectedCount} آگهی
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scrapedAds.map((ad, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                      ad.selected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => toggleAdSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={ad.selected}
                        onCheckedChange={() => toggleAdSelection(index)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      {/* Image preview */}
                      {ad.imageUrl ? (
                        <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                          <img 
                            src={ad.imageUrl} 
                            alt={ad.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-lg flex-shrink-0 bg-muted flex items-center justify-center">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h3 className="font-semibold truncate">{ad.name}</h3>
                          <div className="flex items-center gap-2">
                            {ad.members && (
                              <Badge variant="outline" className="text-xs">
                                {ad.members.toLocaleString('fa-IR')} عضو
                              </Badge>
                            )}
                            <a 
                              href={ad.telegramLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {ad.text}
                        </p>
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
