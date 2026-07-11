import { clampText, sanitizeText } from "@/lib/security";
import { readUserJson, writeUserJson, withLocalFallback, persistLocally } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type SkillEndorsement = {
  id: string;
  endorser_id: string;
  profile_id: string;
  skill: string;
  created_at: string;
  endorser_name?: string;
};

const STORAGE = "build:skill-endorsements";

function readLocal(profileId: string): SkillEndorsement[] {
  return readUserJson<SkillEndorsement[]>(STORAGE, profileId, []);
}

function writeLocal(profileId: string, items: SkillEndorsement[]) {
  writeUserJson(STORAGE, profileId, items);
}

export async function fetchEndorsementsForProfile(profileId: string): Promise<SkillEndorsement[]> {
  const supabase = getSupabase();
  if (!supabase) return withLocalFallback([], () => readLocal(profileId));

  const { data, error } = await supabase
    .from("skill_endorsements")
    .select(
      "id, endorser_id, profile_id, skill, created_at, profiles!skill_endorsements_endorser_id_fkey(full_name)",
    )
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error || !data) return withLocalFallback([], () => readLocal(profileId));

  return data.map((row) => {
    const profile = row.profiles as { full_name?: string } | null;
    return {
      id: String(row.id),
      endorser_id: String(row.endorser_id),
      profile_id: String(row.profile_id),
      skill: String(row.skill),
      created_at: String(row.created_at),
      endorser_name: profile?.full_name ?? undefined,
    };
  });
}

export async function endorseSkill(
  endorserId: string,
  profileId: string,
  skill: string,
): Promise<{ error: string | null }> {
  if (endorserId === profileId) return { error: "You cannot endorse yourself." };
  const safe = sanitizeText(skill, 60);
  if (!safe) return { error: "Skill is required." };

  persistLocally(() => {
    const local = readLocal(profileId);
    if (!local.some((e) => e.endorser_id === endorserId && e.skill === safe)) {
      local.push({
        id: `local-se-${Date.now()}`,
        endorser_id: endorserId,
        profile_id: profileId,
        skill: safe,
        created_at: new Date().toISOString(),
      });
      writeLocal(profileId, local);
    }
  });

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("skill_endorsements")
    .upsert(
      { endorser_id: endorserId, profile_id: profileId, skill: safe },
      { onConflict: "endorser_id,profile_id,skill" },
    );
  return { error: error?.message ?? null };
}

export async function removeEndorsement(
  endorserId: string,
  endorsementId: string,
  profileId: string,
): Promise<{ error: string | null }> {
  persistLocally(() =>
    writeLocal(
      profileId,
      readLocal(profileId).filter((e) => e.id !== endorsementId),
    ),
  );

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("skill_endorsements")
    .delete()
    .eq("id", endorsementId)
    .eq("endorser_id", endorserId);
  return { error: error?.message ?? null };
}

export function groupEndorsementsBySkill(
  endorsements: SkillEndorsement[],
): Array<{ skill: string; count: number; endorsers: string[] }> {
  const map = new Map<string, string[]>();
  for (const e of endorsements) {
    const list = map.get(e.skill) ?? [];
    list.push(e.endorser_name ?? "Member");
    map.set(e.skill, list);
  }
  return [...map.entries()]
    .map(([skill, endorsers]) => ({ skill, count: endorsers.length, endorsers }))
    .sort((a, b) => b.count - a.count);
}
