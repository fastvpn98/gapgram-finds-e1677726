import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, Plus, RefreshCw, ExternalLink, Image as ImageIcon, Send, Trash2, Download, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PROVINCES, AD_TYPES } from "@/lib/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

interface ScrapedAd {
  name: string;
  text: string;
  telegramLink: string;
  category: string;
  adType: 'group' | 'channel';
  members?: number;
  imageUrl?: string;
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
  const [publishQueue, setPublishQueue] = useState<ScrapedAd[]>([]);
  const [defaultCategory, setDefaultCategory] = useState("chat");
  const [defaultAdType, setDefaultAdType] = useState<'group' | 'channel'>("group");
  const [viewMode, setViewMode] = useState<ViewMode>('scrape');

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
        
        const adsWithDefaults = data.ads.map((ad: ScrapedAd) => ({
          ...ad,
          category: defaultCategory,
          adType: defaultAdType,
          cities: allCities,
        }));
        setScrapedAds(adsWithDefaults);
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

  const addToPublishQueue = (index: number) => {
    const ad = scrapedAds[index];
    if (!ad) return;
    
    // Check if already in queue
    if (publishQueue.some(q => q.telegramLink === ad.telegramLink)) {
      toast({
        title: "توجه",
        description: "این آگهی قبلاً به لیست انتشار اضافه شده",
      });
      return;
    }
    
    setPublishQueue(prev => [...prev, ad]);
    setScrapedAds(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "اضافه شد",
      description: `آگهی "${ad.name}" به لیست انتشار اضافه شد`,
    });
  };

  const removeFromPublishQueue = (index: number) => {
    const ad = publishQueue[index];
    setPublishQueue(prev => prev.filter((_, i) => i !== index));
    setScrapedAds(prev => [...prev, ad]);
  };

  const updateQueuedAd = (index: number, updates: Partial<ScrapedAd>) => {
    setPublishQueue(prev => prev.map((ad, i) => 
      i === index ? { ...ad, ...updates } : ad
    ));
  };

  const publishAd = async (index: number) => {
    const ad = publishQueue[index];
    if (!ad) return;

    setIsSaving(true);

    try {
      const { error } = await supabase.from('ads').insert({
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
      });

      if (error) throw error;

      toast({
        title: "موفق",
        description: `آگهی "${ad.name}" منتشر شد`,
      });

      setPublishQueue(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Publish error:', error);
      toast({
        title: "خطا",
        description: "انتشار آگهی با مشکل مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const publishAllAds = async () => {
    if (publishQueue.length === 0) {
      toast({
        title: "خطا",
        description: "لیست انتشار خالی است",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      const adsToInsert = publishQueue.map(ad => ({
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
        description: `${publishQueue.length} آگهی منتشر شد`,
      });

      setPublishQueue([]);
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar */}
        <Sidebar className="border-l" side="right">
          <SidebarContent className="p-4">
            <div className="mb-4">
              <Button variant="ghost" asChild className="w-full justify-start gap-2 mb-4">
                <Link to="/admin">
                  <ArrowRight className="h-4 w-4" />
                  پنل ادمین
                </Link>
              </Button>
            </div>
            
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setViewMode('scrape')}
                      className={`w-full justify-start gap-3 p-3 ${viewMode === 'scrape' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <Download className="h-5 w-5" />
                      <div className="flex-1 text-right">
                        <div className="font-medium">استخراج</div>
                        <div className="text-xs text-muted-foreground">
                          {scrapedAds.length} آگهی
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => setViewMode('publish')}
                      className={`w-full justify-start gap-3 p-3 ${viewMode === 'publish' ? 'bg-primary/10 text-primary' : ''}`}
                    >
                      <FileText className="h-5 w-5" />
                      <div className="flex-1 text-right">
                        <div className="font-medium">انتشار و ثبت</div>
                        <div className="text-xs text-muted-foreground">
                          {publishQueue.length} آگهی در صف
                        </div>
                      </div>
                      {publishQueue.length > 0 && (
                        <Badge variant="default" className="mr-auto">
                          {publishQueue.length}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        {/* Main Content */}
        <main className="flex-1 gradient-hero py-8 overflow-auto">
          <div className="container max-w-4xl">
            {viewMode === 'scrape' ? (
              <>
                {/* Scrape Section */}
                <Card className="shadow-card animate-slide-up mb-6">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Download className="h-6 w-6" />
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

                {/* Scraped Ads List */}
                {scrapedAds.length > 0 && (
                  <Card className="shadow-card animate-slide-up">
                    <CardHeader>
                      <CardTitle>آگهی‌های یافت شده ({scrapedAds.length})</CardTitle>
                      <CardDescription>
                        روی "افزودن" کلیک کنید تا آگهی به بخش انتشار منتقل شود
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {scrapedAds.map((ad, index) => (
                          <div 
                            key={index}
                            className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                          >
                            <div className="flex items-start gap-3">
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
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </div>
                                </div>
                                
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                  {ad.text}
                                </p>
                                
                                <div className="flex justify-end mt-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => addToPublishQueue(index)}
                                    className="gap-1"
                                  >
                                    <Plus className="h-4 w-4" />
                                    افزودن به انتشار
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
              </>
            ) : (
              <>
                {/* Publish Section */}
                <Card className="shadow-card animate-slide-up mb-6">
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          <Send className="h-6 w-6" />
                          انتشار و ثبت آگهی
                        </CardTitle>
                        <CardDescription>
                          {publishQueue.length} آگهی در صف انتشار - ویرایش کنید و منتشر نمایید
                        </CardDescription>
                      </div>
                      {publishQueue.length > 0 && (
                        <Button 
                          onClick={publishAllAds} 
                          disabled={isSaving}
                          size="lg"
                          className="gap-2"
                        >
                          {isSaving ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                          انتشار همه ({publishQueue.length})
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                </Card>

                {publishQueue.length === 0 ? (
                  <Card className="shadow-card">
                    <CardContent className="py-12 text-center">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        هنوز آگهی‌ای به لیست انتشار اضافه نشده
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => setViewMode('scrape')}
                      >
                        رفتن به بخش استخراج
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {publishQueue.map((ad, index) => (
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
                                  onChange={(e) => updateQueuedAd(index, { name: e.target.value })}
                                  placeholder="نام گروه یا کانال"
                                />
                              </div>

                              {/* Description */}
                              <div className="space-y-2">
                                <Label>توضیحات</Label>
                                <Textarea
                                  value={ad.text}
                                  onChange={(e) => updateQueuedAd(index, { text: e.target.value })}
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
                                    onValueChange={(val) => updateQueuedAd(index, { adType: val as 'group' | 'channel' })}
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
                                    onValueChange={(val) => updateQueuedAd(index, { category: val })}
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
                                    onChange={(e) => updateQueuedAd(index, { members: parseInt(e.target.value) || 0 })}
                                    placeholder="0"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>لینک</Label>
                                  <Input
                                    value={ad.telegramLink}
                                    onChange={(e) => updateQueuedAd(index, { telegramLink: e.target.value })}
                                    dir="ltr"
                                    className="text-left"
                                  />
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex justify-between items-center pt-2 border-t">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => removeFromPublishQueue(index)}
                                  className="text-destructive hover:text-destructive gap-1"
                                >
                                  <Trash2 className="h-4 w-4" />
                                  حذف از لیست
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={() => publishAd(index)}
                                  disabled={isSaving}
                                  className="gap-1"
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Send className="h-4 w-4" />
                                  )}
                                  انتشار این آگهی
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
