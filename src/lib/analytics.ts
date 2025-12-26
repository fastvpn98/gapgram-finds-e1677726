import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
};

export async function trackAdView(adId: string, userId?: string) {
  try {
    await supabase.from("ad_views").insert({
      ad_id: adId,
      user_id: userId || null,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("Error tracking ad view:", error);
  }
}

export async function trackAdClick(adId: string, userId?: string) {
  try {
    await supabase.from("ad_clicks").insert({
      ad_id: adId,
      user_id: userId || null,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("Error tracking ad click:", error);
  }
}

export async function trackSiteVisit(pagePath: string, userId?: string) {
  try {
    await supabase.from("site_visits").insert({
      page_path: pagePath,
      user_id: userId || null,
      session_id: getSessionId(),
    });
  } catch (error) {
    console.error("Error tracking site visit:", error);
  }
}

export async function likeAd(adId: string, userId: string) {
  try {
    const { error } = await supabase.from("ad_likes").insert({
      ad_id: adId,
      user_id: userId,
    });
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error liking ad:", error);
    return false;
  }
}

export async function unlikeAd(adId: string, userId: string) {
  try {
    const { error } = await supabase
      .from("ad_likes")
      .delete()
      .eq("ad_id", adId)
      .eq("user_id", userId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error unliking ad:", error);
    return false;
  }
}

export async function getAdLikesCount(adId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("ad_likes")
      .select("*", { count: "exact", head: true })
      .eq("ad_id", adId);
    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error("Error getting likes count:", error);
    return 0;
  }
}

export async function isAdLikedByUser(adId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("ad_likes")
      .select("id")
      .eq("ad_id", adId)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking if ad is liked:", error);
    return false;
  }
}
