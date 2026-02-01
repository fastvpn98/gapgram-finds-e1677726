import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { 
  ArrowRight, 
  Copy, 
  ExternalLink, 
  Users, 
  Calendar, 
  MapPin, 
  Tag as TagIcon,
  Share2,
  Check
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES, PROVINCES, TAGS, AGE_GROUPS } from "@/lib/constants";
import { PlatformLogo, getPlatformName, getPlatformColor } from "@/components/PlatformLogo";
import { AdBanner } from "@/components/AdBanner";
import { Platform } from "@/lib/types";
import { format } from "date-fns-jalali";
import { faIR } from "date-fns-jalali/locale";

interface AdData {
  id: string;
  name: string;
  text: string;
  category: string;
  telegram_link: string;
  image_url: string | null;
  members: number;
  tags: string[];
  cities: string[];
  age_groups: string[];
  platform: Platform;
  ad_type: string;
  created_at: string;
}

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [relatedAds, setRelatedAds] = useState<AdData[]>([]);

  useEffect(() => {
    if (id) {
      fetchAd();
      trackView();
    }
  }, [id]);

  const fetchAd = async () => {
    try {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("id", id)
        .eq("is_approved", true)
        .is("deleted_at", null)
        .single();

      if (error) throw error;
      setAd(data as AdData);

      // Fetch related ads
      if (data) {
        const { data: related } = await supabase
          .from("ads")
          .select("*")
          .eq("category", data.category)
          .eq("is_approved", true)
          .is("deleted_at", null)
          .neq("id", id)
          .limit(4);
        
        setRelatedAds((related || []) as AdData[]);
      }
    } catch (error) {
      console.error("Error fetching ad:", error);
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    if (!id) return;
    try {
      const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
      localStorage.setItem("session_id", sessionId);
      
      await supabase.from("ad_views").insert({
        ad_id: id,
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const trackClick = async () => {
    if (!id) return;
    try {
      const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
      
      await supabase.from("ad_clicks").insert({
        ad_id: id,
        session_id: sessionId,
      });
    } catch (error) {
      console.error("Error tracking click:", error);
    }
  };

  const copyLink = async () => {
    if (!ad) return;
    
    await navigator.clipboard.writeText(ad.telegram_link);
    setCopied(true);
    toast({
      title: "کپی شد!",
      description: "لینک آگهی در کلیپ‌بورد کپی شد",
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const shareAd = async () => {
    if (!ad) return;
    
    const shareData = {
      title: ad.name,
      text: `${ad.name} - ${getPlatformName(ad.platform)}`,
      url: window.location.href,
    };

    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "لینک کپی شد!",
        description: "لینک صفحه آگهی کپی شد",
      });
    }
  };

  const handleVisit = () => {
    trackClick();
    window.open(ad?.telegram_link, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">آگهی یافت نشد</h1>
        <Link to="/">
          <Button>
            <ArrowRight className="ml-2 h-4 w-4" />
            بازگشت به صفحه اصلی
          </Button>
        </Link>
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.value === ad.category);
  const CategoryIcon = category?.icon;
  const platformColor = getPlatformColor(ad.platform);

  // SEO structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: ad.name,
    description: ad.text,
    image: ad.image_url,
    url: window.location.href,
    brand: {
      "@type": "Brand",
      name: getPlatformName(ad.platform),
    },
    offers: {
      "@type": "Offer",
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <>
      <Helmet>
        <title>{`${ad.name} | ${getPlatformName(ad.platform)} - گپ‌گرام`}</title>
        <meta name="description" content={ad.text.substring(0, 160)} />
        <meta name="keywords" content={`${ad.name}, ${getPlatformName(ad.platform)}, ${category?.label || ""}, گروه تلگرام, کانال`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={`${ad.name} | گپ‌گرام`} />
        <meta property="og:description" content={ad.text.substring(0, 160)} />
        <meta property="og:type" content="product" />
        <meta property="og:url" content={window.location.href} />
        {ad.image_url && <meta property="og:image" content={ad.image_url} />}
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={ad.name} />
        <meta name="twitter:description" content={ad.text.substring(0, 160)} />
        
        {/* Canonical */}
        <link rel="canonical" href={window.location.href} />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <main className="min-h-screen gradient-hero py-6">
        <div className="container max-w-6xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6" aria-label="breadcrumb">
            <Link to="/" className="hover:text-primary transition-colors">
              صفحه اصلی
            </Link>
            <span>/</span>
            {category && (
              <>
                <Link 
                  to={`/filter?category=${ad.category}`} 
                  className="hover:text-primary transition-colors"
                >
                  {category.label}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-foreground">{ad.name}</span>
          </nav>

          {/* Top Banner */}
          <AdBanner position="top" className="mb-6" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    {/* Platform Logo */}
                    <div 
                      className="flex-shrink-0 p-3 rounded-xl"
                      style={{ backgroundColor: `${platformColor}15` }}
                    >
                      <PlatformLogo platform={ad.platform} size={48} />
                    </div>

                    <div className="flex-1">
                      <CardTitle className="text-2xl mb-2">{ad.name}</CardTitle>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge 
                          variant="secondary" 
                          className="gap-1"
                          style={{ backgroundColor: `${platformColor}20`, color: platformColor }}
                        >
                          <PlatformLogo platform={ad.platform} size={14} />
                          {getPlatformName(ad.platform)}
                        </Badge>
                        
                        <Badge variant="outline">
                          {ad.ad_type === "channel" ? "کانال" : "گروه"}
                        </Badge>
                        
                        {category && (
                          <Badge variant="secondary" className="gap-1">
                            {CategoryIcon && <CategoryIcon className="h-3 w-3" />}
                            {category.label}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Image */}
                  {ad.image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img
                        src={ad.image_url}
                        alt={ad.name}
                        className="w-full h-auto max-h-96 object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <h2 className="font-semibold text-lg mb-2">توضیحات</h2>
                    <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {ad.text}
                    </p>
                  </div>

                  <Separator />

                  {/* Meta Info */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{ad.members?.toLocaleString("fa-IR") || "۰"} عضو</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {format(new Date(ad.created_at), "d MMMM yyyy", { locale: faIR })}
                      </span>
                    </div>

                    {ad.cities && ad.cities.length > 0 && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {ad.cities.slice(0, 2).map(c => 
                            PROVINCES.find(p => p.value === c)?.label || c
                          ).join("، ")}
                          {ad.cities.length > 2 && ` +${ad.cities.length - 2}`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {ad.tags && ad.tags.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                        <TagIcon className="h-4 w-4" />
                        برچسب‌ها
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {ad.tags.map((tag) => {
                          const tagInfo = TAGS.find((t) => t.value === tag);
                          return (
                            <Link 
                              key={tag} 
                              to={`/filter?tags=${tag}`}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <Badge variant="outline" className="cursor-pointer">
                                {tagInfo?.label || tag}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      size="lg" 
                      className="flex-1 gap-2"
                      style={{ backgroundColor: platformColor }}
                      onClick={handleVisit}
                    >
                      <ExternalLink className="h-5 w-5" />
                      بازدید از {ad.ad_type === "channel" ? "کانال" : "گروه"}
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="flex-1 gap-2"
                      onClick={copyLink}
                    >
                      {copied ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Copy className="h-5 w-5" />
                      )}
                      کپی لینک
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline"
                      onClick={shareAd}
                    >
                      <Share2 className="h-5 w-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Bottom Banner */}
              <AdBanner position="bottom" />
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Sidebar Banner */}
              <AdBanner position="sidebar" />

              {/* Related Ads */}
              {relatedAds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">آگهی‌های مشابه</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {relatedAds.map((relatedAd) => (
                      <Link 
                        key={relatedAd.id} 
                        to={`/ad/${relatedAd.id}`}
                        className="block"
                      >
                        <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                          <PlatformLogo platform={relatedAd.platform} size={32} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{relatedAd.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {relatedAd.members?.toLocaleString("fa-IR")} عضو
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Another Sidebar Banner */}
              <AdBanner position="sidebar" />
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
