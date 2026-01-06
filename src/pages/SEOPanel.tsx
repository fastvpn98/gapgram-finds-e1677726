import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRight, 
  Loader2, 
  Search, 
  Globe, 
  FileText, 
  Link2, 
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  ogImage: string;
  robots: string;
}

interface SitemapEntry {
  url: string;
  lastmod: string;
  priority: string;
}

export default function SEOPanel() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  const [seoData, setSeoData] = useState<SEOData>({
    title: "تلگروپ - بهترین گروه‌ها و کانال‌های تلگرام",
    description: "جستجو و کشف بهترین گروه‌ها و کانال‌های تلگرام در دسته‌بندی‌های مختلف. ثبت رایگان گروه و کانال تلگرام.",
    keywords: ["گروه تلگرام", "کانال تلگرام", "لینکدونی", "تبلیغات تلگرام"],
    canonicalUrl: "https://telegroup.ir",
    ogImage: "/og-image.png",
    robots: "index, follow"
  });
  
  const [sitemapEntries, setSitemapEntries] = useState<SitemapEntry[]>([]);
  const [isLoadingSitemap, setIsLoadingSitemap] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");

  useEffect(() => {
    if (isAdmin) {
      generateSitemap();
    }
  }, [isAdmin]);

  const generateSitemap = async () => {
    setIsLoadingSitemap(true);
    try {
      // Fetch all approved ads for sitemap
      const { data: ads, error } = await supabase
        .from('ads')
        .select('id, name, updated_at, category')
        .eq('is_approved', true)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const entries: SitemapEntry[] = [
        { url: "/", lastmod: new Date().toISOString().split('T')[0], priority: "1.0" },
        { url: "/submit", lastmod: new Date().toISOString().split('T')[0], priority: "0.8" },
      ];

      // Add category pages
      const categories = [...new Set(ads?.map(ad => ad.category) || [])];
      categories.forEach(cat => {
        entries.push({
          url: `/filter?category=${cat}`,
          lastmod: new Date().toISOString().split('T')[0],
          priority: "0.7"
        });
      });

      // Add individual ad pages (if you have them)
      ads?.forEach(ad => {
        entries.push({
          url: `/ad/${ad.id}`,
          lastmod: ad.updated_at.split('T')[0],
          priority: "0.6"
        });
      });

      setSitemapEntries(entries);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      toast({
        title: "خطا",
        description: "خطا در تولید نقشه سایت",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSitemap(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !seoData.keywords.includes(newKeyword.trim())) {
      setSeoData(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setSeoData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: `${label} کپی شد`,
    });
  };

  const generateMetaTags = () => {
    return `<!-- Primary Meta Tags -->
<title>${seoData.title}</title>
<meta name="title" content="${seoData.title}">
<meta name="description" content="${seoData.description}">
<meta name="keywords" content="${seoData.keywords.join(', ')}">
<meta name="robots" content="${seoData.robots}">
<link rel="canonical" href="${seoData.canonicalUrl}">

<!-- Open Graph / Facebook -->
<meta property="og:type" content="website">
<meta property="og:url" content="${seoData.canonicalUrl}">
<meta property="og:title" content="${seoData.title}">
<meta property="og:description" content="${seoData.description}">
<meta property="og:image" content="${seoData.ogImage}">

<!-- Twitter -->
<meta property="twitter:card" content="summary_large_image">
<meta property="twitter:url" content="${seoData.canonicalUrl}">
<meta property="twitter:title" content="${seoData.title}">
<meta property="twitter:description" content="${seoData.description}">
<meta property="twitter:image" content="${seoData.ogImage}">`;
  };

  const generateSitemapXML = () => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(entry => `  <url>
    <loc>${seoData.canonicalUrl}${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <priority>${entry.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  };

  const generateRobotsTxt = () => {
    return `User-agent: *
Allow: /

Sitemap: ${seoData.canonicalUrl}/sitemap.xml

# Block admin pages
Disallow: /admin
Disallow: /telegram-scraper
Disallow: /manage-roles
Disallow: /analytics`;
  };

  const generateStructuredData = () => {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": seoData.title,
      "description": seoData.description,
      "url": seoData.canonicalUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${seoData.canonicalUrl}/filter?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }, null, 2);
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
    <div className="min-h-screen gradient-hero py-8">
      <div className="container max-w-5xl">
        <Button variant="ghost" asChild className="mb-6 gap-2">
          <Link to="/admin">
            <ArrowRight className="h-4 w-4" />
            بازگشت به پنل ادمین
          </Link>
        </Button>

        <Card className="shadow-card animate-slide-up mb-6">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Search className="h-6 w-6" />
              پنل مدیریت سئو
            </CardTitle>
            <CardDescription>
              تنظیمات سئو برای بهینه‌سازی موتورهای جستجو
            </CardDescription>
          </CardHeader>
        </Card>

        <Tabs defaultValue="meta" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="meta" className="gap-2">
              <FileText className="h-4 w-4" />
              متا تگ‌ها
            </TabsTrigger>
            <TabsTrigger value="sitemap" className="gap-2">
              <Globe className="h-4 w-4" />
              نقشه سایت
            </TabsTrigger>
            <TabsTrigger value="robots" className="gap-2">
              <Link2 className="h-4 w-4" />
              Robots.txt
            </TabsTrigger>
            <TabsTrigger value="structured" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              داده ساختاریافته
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meta">
            <Card>
              <CardHeader>
                <CardTitle>تنظیمات متا تگ‌ها</CardTitle>
                <CardDescription>
                  این تگ‌ها برای نمایش در نتایج جستجو استفاده می‌شوند
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">عنوان سایت (کمتر از ۶۰ کاراکتر)</Label>
                    <Input
                      id="title"
                      value={seoData.title}
                      onChange={(e) => setSeoData(prev => ({ ...prev, title: e.target.value }))}
                      maxLength={60}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{seoData.title.length}/60 کاراکتر</span>
                      {seoData.title.length <= 60 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> مناسب
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" /> خیلی طولانی
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">توضیحات (کمتر از ۱۶۰ کاراکتر)</Label>
                    <Textarea
                      id="description"
                      value={seoData.description}
                      onChange={(e) => setSeoData(prev => ({ ...prev, description: e.target.value }))}
                      maxLength={160}
                      rows={3}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{seoData.description.length}/160 کاراکتر</span>
                      {seoData.description.length <= 160 ? (
                        <span className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 className="h-3 w-3" /> مناسب
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="h-3 w-3" /> خیلی طولانی
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>کلمات کلیدی</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newKeyword}
                        onChange={(e) => setNewKeyword(e.target.value)}
                        placeholder="کلمه کلیدی جدید"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      />
                      <Button onClick={addKeyword} variant="outline">افزودن</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {seoData.keywords.map((keyword, i) => (
                        <Badge 
                          key={i} 
                          variant="secondary" 
                          className="cursor-pointer"
                          onClick={() => removeKeyword(keyword)}
                        >
                          {keyword} ×
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="canonical">آدرس Canonical</Label>
                    <Input
                      id="canonical"
                      value={seoData.canonicalUrl}
                      onChange={(e) => setSeoData(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <Label>کد متا تگ‌ها (کپی کنید)</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(generateMetaTags(), 'متا تگ‌ها')}
                    >
                      <Copy className="h-4 w-4 ml-2" />
                      کپی کد
                    </Button>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">
                    {generateMetaTags()}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sitemap">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>نقشه سایت (Sitemap)</CardTitle>
                    <CardDescription>
                      لیست تمام صفحات سایت برای موتورهای جستجو
                    </CardDescription>
                  </div>
                  <Button onClick={generateSitemap} disabled={isLoadingSitemap}>
                    {isLoadingSitemap ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 ml-2" />
                    )}
                    بازسازی
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-primary">{sitemapEntries.length}</div>
                    <div className="text-sm text-muted-foreground">تعداد صفحات</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {sitemapEntries.filter(e => e.priority === "1.0" || e.priority === "0.8").length}
                    </div>
                    <div className="text-sm text-muted-foreground">صفحات مهم</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {sitemapEntries.filter(e => e.url.includes('/ad/')).length}
                    </div>
                    <div className="text-sm text-muted-foreground">صفحات آگهی</div>
                  </Card>
                </div>

                <div className="flex items-center justify-between">
                  <Label>کد Sitemap.xml</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generateSitemapXML(), 'نقشه سایت')}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    کپی کد
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto max-h-80" dir="ltr">
                  {generateSitemapXML()}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="robots">
            <Card>
              <CardHeader>
                <CardTitle>فایل Robots.txt</CardTitle>
                <CardDescription>
                  دستورالعمل‌ها برای ربات‌های موتورهای جستجو
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>محتوای فایل robots.txt</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(generateRobotsTxt(), 'Robots.txt')}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    کپی کد
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto" dir="ltr">
                  {generateRobotsTxt()}
                </pre>

                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    راهنمای استفاده
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• این فایل را در ریشه سایت با نام robots.txt ذخیره کنید</li>
                    <li>• آدرس نقشه سایت در این فایل مشخص شده است</li>
                    <li>• صفحات مدیریتی از ایندکس خارج شده‌اند</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="structured">
            <Card>
              <CardHeader>
                <CardTitle>داده ساختاریافته (JSON-LD)</CardTitle>
                <CardDescription>
                  اطلاعات ساختاریافته برای نمایش بهتر در نتایج جستجو
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>کد JSON-LD</Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(`<script type="application/ld+json">\n${generateStructuredData()}\n</script>`, 'JSON-LD')}
                  >
                    <Copy className="h-4 w-4 ml-2" />
                    کپی کد
                  </Button>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-x-auto" dir="ltr">
                  {`<script type="application/ld+json">\n${generateStructuredData()}\n</script>`}
                </pre>

                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <h4 className="font-semibold flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    مزایای داده ساختاریافته
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• نمایش جعبه جستجو در نتایج گوگل</li>
                    <li>• درک بهتر محتوا توسط موتورهای جستجو</li>
                    <li>• افزایش نرخ کلیک (CTR)</li>
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <Button asChild variant="outline" className="gap-2">
                    <a 
                      href="https://search.google.com/test/rich-results" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                      تست در ابزار گوگل
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
