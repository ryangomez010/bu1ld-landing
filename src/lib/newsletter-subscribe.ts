import { getSupabase } from "@/lib/supabase";
import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";

const STORAGE = "build:newsletter-subscribe";

function localSubscribed(userId: string): boolean {
  return readUserJson<boolean>(STORAGE, userId, true);
}

export async function isNewsletterSubscribed(userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("newsletter_subscriptions")
      .select("subscribed")
      .eq("user_id", userId)
      .maybeSingle();
    if (data) return !!data.subscribed;
    return withLocalFallback(true, () => localSubscribed(userId));
  }
  return withLocalFallback(true, () => localSubscribed(userId));
}

export async function setNewsletterSubscribed(userId: string, subscribed: boolean): Promise<void> {
  persistLocally(() => writeUserJson(STORAGE, userId, subscribed));

  const supabase = getSupabase();
  if (!supabase) return;

  await supabase.from("newsletter_subscriptions").upsert({
    user_id: userId,
    subscribed,
    updated_at: new Date().toISOString(),
  });
}
