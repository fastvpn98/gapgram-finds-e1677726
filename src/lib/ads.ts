import { supabase } from "@/integrations/supabase/client";
import { RankedAd, AdFormData } from "./types";

// Safe error logging utility - only logs details in development
function logSafeError(context: string, error: unknown) {
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, error);
  } else {
    console.error(`[${context}] Operation failed`);
  }
}

// Seed data for initial database population
const seedAds: Omit<RankedAd, "id" | "createdAt">[] = [
  {
    name: "فروشگاه آنلاین دیجی‌کالا",
    text: "بزرگترین فروشگاه آنلاین ایران با میلیون‌ها محصول متنوع. تخفیف‌های ویژه هر روز!",
    category: "shopping",
    telegramLink: "https://t.me/digikala",
    imageUrl: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=400&h=300&fit=crop",
    members: 250000,
    tags: ["popular", "verified", "discount"],
    provinces: ["tehran", "khorasan-e-razavi", "isfahan"],
    ageGroups: ["youth", "adults"],
    relevanceScore: 0.95,
    adType: "channel",
  },
  {
    name: "استخدام برنامه‌نویس",
    text: "جذب نیرو در شرکت‌های معتبر IT. فرصت‌های شغلی برای توسعه‌دهندگان وب و موبایل.",
    category: "jobs",
    telegramLink: "https://t.me/devjobs_ir",
    imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&h=300&fit=crop",
    members: 85000,
    tags: ["new", "active", "trusted"],
    provinces: ["tehran", "alborz"],
    ageGroups: ["youth", "adults"],
    relevanceScore: 0.88,
    adType: "group",
  },
  {
    name: "آموزش زبان انگلیسی",
    text: "یادگیری زبان انگلیسی با بهترین اساتید. کلاس‌های آنلاین و حضوری.",
    category: "education",
    telegramLink: "https://t.me/english_learn_ir",
    imageUrl: "https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=300&fit=crop",
    members: 120000,
    tags: ["verified", "popular", "premium"],
    provinces: ["tehran", "khorasan-e-razavi", "fars"],
    ageGroups: ["youth", "adults", "middle"],
    relevanceScore: 0.92,
    adType: "channel",
  },
  {
    name: "گیمرهای ایران",
    text: "بزرگترین کامیونیتی گیمرهای ایرانی. اخبار بازی، تورنومنت‌ها و گفتگو.",
    category: "entertainment",
    telegramLink: "https://t.me/gamers_iran",
    imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop",
    members: 180000,
    tags: ["popular", "active", "free"],
    provinces: ["tehran", "isfahan", "azarbayjan-e-sharghi"],
    ageGroups: ["youth"],
    relevanceScore: 0.85,
    adType: "group",
  },
  {
    name: "سلامت و تندرستی",
    text: "مشاوره پزشکی آنلاین، نکات سلامتی و تغذیه سالم از متخصصین.",
    category: "health",
    telegramLink: "https://t.me/health_tips_ir",
    imageUrl: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&h=300&fit=crop",
    members: 95000,
    tags: ["verified", "trusted", "premium"],
    provinces: ["tehran", "khorasan-e-razavi", "qom"],
    ageGroups: ["adults", "middle", "senior"],
    relevanceScore: 0.82,
    adType: "channel",
  },
  {
    name: "اخبار روز ایران",
    text: "آخرین اخبار سیاسی، اقتصادی و اجتماعی ایران و جهان. به‌روزرسانی ۲۴ ساعته.",
    category: "news",
    telegramLink: "https://t.me/news_iran_daily",
    imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=300&fit=crop",
    members: 320000,
    tags: ["popular", "active", "verified"],
    provinces: ["tehran"],
    ageGroups: ["all"],
    relevanceScore: 0.98,
    adType: "channel",
  },
  {
    name: "موسیقی پاپ ایران",
    text: "جدیدترین آهنگ‌های پاپ فارسی، کنسرت‌ها و اخبار هنرمندان محبوب.",
    category: "music",
    telegramLink: "https://t.me/pop_music_ir",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
    members: 210000,
    tags: ["popular", "free", "active"],
    provinces: ["tehran", "fars", "isfahan"],
    ageGroups: ["youth", "adults"],
    relevanceScore: 0.89,
    adType: "channel",
  },
  {
    name: "رستوران‌های تهران",
    text: "معرفی بهترین رستوران‌ها، کافه‌ها و غذاخوری‌های تهران با تخفیف ویژه.",
    category: "food",
    telegramLink: "https://t.me/tehran_restaurants",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
    members: 75000,
    tags: ["discount", "new", "trusted"],
    provinces: ["tehran"],
    ageGroups: ["youth", "adults", "middle"],
    relevanceScore: 0.78,
    adType: "group",
  },
  {
    name: "خرید و فروش خودرو",
    text: "بازار خودرو ایران. خرید، فروش و معاوضه انواع خودرو صفر و کارکرده.",
    category: "automotive",
    telegramLink: "https://t.me/car_market_ir",
    imageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400&h=300&fit=crop",
    members: 145000,
    tags: ["popular", "verified", "active"],
    provinces: ["tehran", "alborz", "azarbayjan-e-sharghi", "khorasan-e-razavi"],
    ageGroups: ["adults", "middle"],
    relevanceScore: 0.86,
    adType: "group",
  },
  {
    name: "املاک و مستغلات",
    text: "خرید، فروش و اجاره آپارتمان، ویلا و زمین در سراسر ایران.",
    category: "realestate",
    telegramLink: "https://t.me/realestate_ir",
    imageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop",
    members: 190000,
    tags: ["verified", "trusted", "premium"],
    provinces: ["tehran", "alborz", "isfahan", "fars"],
    ageGroups: ["adults", "middle", "senior"],
    relevanceScore: 0.91,
    adType: "channel",
  },
  {
    name: "تکنولوژی و گجت",
    text: "بررسی جدیدترین گوشی‌ها، لپ‌تاپ‌ها و گجت‌های تکنولوژی روز دنیا.",
    category: "tech",
    telegramLink: "https://t.me/tech_gadgets_ir",
    imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=400&h=300&fit=crop",
    members: 165000,
    tags: ["new", "popular", "verified"],
    provinces: ["tehran", "khorasan-e-razavi"],
    ageGroups: ["youth", "adults"],
    relevanceScore: 0.93,
    adType: "channel",
  },
  {
    name: "همشهری تهران",
    text: "گروه اجتماعی شهروندان تهران. رویدادها، مشکلات شهری و گفتگوی همشهری‌ها.",
    category: "social",
    telegramLink: "https://t.me/hamshahri_tehran",
    imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop",
    members: 55000,
    tags: ["active", "free", "trusted"],
    provinces: ["tehran"],
    ageGroups: ["all"],
    relevanceScore: 0.75,
    adType: "group",
  },
];

function mapDbAdToRankedAd(dbAd: {
  id: string;
  name: string;
  text: string;
  category: string;
  telegram_link: string;
  image_url: string | null;
  members: number | null;
  tags: string[] | null;
  cities: string[] | null;
  age_groups: string[] | null;
  min_age: number | null;
  max_age: number | null;
  relevance_score: number | null;
  created_at: string;
  ad_type?: string;
}): RankedAd {
  return {
    id: dbAd.id,
    name: dbAd.name,
    text: dbAd.text,
    category: dbAd.category,
    telegramLink: dbAd.telegram_link,
    imageUrl: dbAd.image_url || "https://picsum.photos/400/300",
    members: dbAd.members || 0,
    tags: dbAd.tags || [],
    provinces: dbAd.cities || [],  // DB column is still 'cities' but we use it as provinces
    ageGroups: dbAd.age_groups || [],
    minAge: dbAd.min_age ?? undefined,
    maxAge: dbAd.max_age ?? undefined,
    relevanceScore: dbAd.relevance_score || 0.5,
    createdAt: dbAd.created_at,
    adType: (dbAd.ad_type as 'group' | 'channel') || 'group',
  };
}

export async function getAds(): Promise<RankedAd[]> {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    logSafeError("getAds", error);
    return [];
  }

  // If no ads exist, seed the database
  if (!data || data.length === 0) {
    await seedDatabase();
    const { data: seededData } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    return (seededData || []).map(mapDbAdToRankedAd);
  }

  return data.map(mapDbAdToRankedAd);
}

async function seedDatabase() {
  const adsToInsert = seedAds.map((ad) => ({
    name: ad.name,
    text: ad.text,
    category: ad.category,
    telegram_link: ad.telegramLink,
    image_url: ad.imageUrl,
    members: ad.members,
    tags: ad.tags,
    cities: ad.provinces,  // DB column is still 'cities'
    age_groups: ad.ageGroups,
    relevance_score: ad.relevanceScore,
    ad_type: ad.adType,
  }));

  const { error } = await supabase.from("ads").insert(adsToInsert);
  if (error) {
    logSafeError("seedDatabase", error);
  }
}

export async function addAd(data: AdFormData, userId: string): Promise<RankedAd | null> {
  const { data: newAd, error } = await supabase
    .from("ads")
    .insert({
      user_id: userId,
      name: data.name,
      text: data.text,
      category: data.category,
      telegram_link: data.telegramLink,
      image_url: data.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
      members: data.members,
      tags: data.tags || [],
      cities: data.provinces || [],  // DB column is still 'cities'
      age_groups: data.ageGroups || [],
      min_age: data.minAge,
      max_age: data.maxAge,
      relevance_score: Math.random() * 0.3 + 0.7,
      ad_type: data.adType,
    })
    .select()
    .single();

  if (error) {
    logSafeError("addAd", error);
    return null;
  }

  return mapDbAdToRankedAd(newAd);
}

export async function getUserAds(userId: string): Promise<RankedAd[]> {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logSafeError("getUserAds", error);
    return [];
  }

  return (data || []).map(mapDbAdToRankedAd);
}

export async function deleteAd(adId: string): Promise<boolean> {
  const { error } = await supabase.from("ads").delete().eq("id", adId);
  
  if (error) {
    logSafeError("deleteAd", error);
    return false;
  }
  
  return true;
}

export async function getAdById(adId: string): Promise<RankedAd | null> {
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", adId)
    .maybeSingle();

  if (error || !data) {
    logSafeError("getAdById", error);
    return null;
  }

  return mapDbAdToRankedAd(data);
}

export async function updateAd(adId: string, data: Partial<AdFormData>): Promise<RankedAd | null> {
  const updateData: Record<string, unknown> = {};
  
  if (data.name !== undefined) updateData.name = data.name;
  if (data.text !== undefined) updateData.text = data.text;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.telegramLink !== undefined) updateData.telegram_link = data.telegramLink;
  if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
  if (data.members !== undefined) updateData.members = data.members;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.provinces !== undefined) updateData.cities = data.provinces;  // DB column is still 'cities'
  if (data.ageGroups !== undefined) updateData.age_groups = data.ageGroups;
  if (data.minAge !== undefined) updateData.min_age = data.minAge;
  if (data.maxAge !== undefined) updateData.max_age = data.maxAge;
  if (data.adType !== undefined) updateData.ad_type = data.adType;

  const { data: updatedAd, error } = await supabase
    .from("ads")
    .update(updateData)
    .eq("id", adId)
    .select()
    .single();

  if (error || !updatedAd) {
    logSafeError("updateAd", error);
    return null;
  }

  return mapDbAdToRankedAd(updatedAd);
}
