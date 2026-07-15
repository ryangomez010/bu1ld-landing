import { logSecurityEvent } from "@/lib/account-security";
import { upsertProfile } from "@/lib/profile";
import { validateImageMagicBytes } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isSafeUrl } from "@/lib/urls";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<{ url: string | null; error: string | null }> {
  if (!ALLOWED.has(file.type)) {
    return { url: null, error: "Use JPEG, PNG, WebP, or GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { url: null, error: "Image must be under 2 MB." };
  }
  if (!(await validateImageMagicBytes(file, file.type))) {
    return { url: null, error: "File content does not match an allowed image type." };
  }

  const supabase = getSupabase();
  if (!supabase) return { url: null, error: "Avatar uploads are temporarily unavailable." };

  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) return { url: null, error: uploadError.message };

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = data.publicUrl;
  if (!isSafeUrl(url)) return { url: null, error: "Invalid avatar URL." };

  await upsertProfile(userId, { avatar_url: url });
  await logSecurityEvent(userId, "avatar_updated", { path });

  return { url, error: null };
}

export async function removeAvatar(userId: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "Avatar uploads are temporarily unavailable." };

  const { data: files } = await supabase.storage.from("avatars").list(userId);
  if (files?.length) {
    await supabase.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
  }

  await upsertProfile(userId, { avatar_url: null });
  await logSecurityEvent(userId, "avatar_removed");
  return { error: null };
}
