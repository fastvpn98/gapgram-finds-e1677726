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

// Database mapping function

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
  platform?: string;
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
    platform: (dbAd.platform as 'telegram' | 'eitaa' | 'bale' | 'rubika') || 'telegram',
  };
}

export async function getAds(): Promise<RankedAd[]> {
  // Only fetch approved ads that are not deleted for public display
  // NOTE: No auto-seeding - ads must be created manually by users or admins
  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("is_approved", true)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    logSafeError("getAds", error);
    return [];
  }

  return (data || []).map(mapDbAdToRankedAd);
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
      platform: data.platform,
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
  if (data.platform !== undefined) updateData.platform = data.platform;

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
