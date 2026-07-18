import { LABS, type InstitutionLab } from "@/data/institution";
import { clampText } from "@/lib/security";
import { getSupabase } from "@/lib/supabase";
import { isDemoMode } from "@/lib/supabase-fallback";
import type { Lab } from "@/lib/types";

function institutionToLab(lab: InstitutionLab): Lab {
  return {
    id: `seed-${lab.slug}`,
    slug: lab.slug,
    name: lab.name,
    short_name: lab.shortName,
    tagline: lab.tagline,
    summary: lab.summary,
    focus: lab.focus,
    methods: lab.methods,
    open_roles: lab.openRoles,
    color: lab.color,
    published: true,
    lead_id: null,
    created_at: new Date(0).toISOString(),
    updated_at: new Date(0).toISOString(),
  };
}

function normalizeLab(row: Record<string, unknown>): Lab {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    short_name: String(row.short_name),
    tagline: row.tagline != null ? String(row.tagline) : "",
    summary: String(row.summary),
    focus: (row.focus as string[]) ?? [],
    methods: (row.methods as string[]) ?? [],
    open_roles: (row.open_roles as string[]) ?? [],
    color: String(row.color ?? "bone"),
    published: Boolean(row.published ?? true),
    lead_id: row.lead_id != null ? String(row.lead_id) : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export function seedLabsAsDb(): Lab[] {
  return LABS.map(institutionToLab);
}

export async function fetchPublishedLabs(): Promise<Lab[]> {
  const supabase = getSupabase();
  if (!supabase) return seedLabsAsDb();
  try {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("published", true)
      .order("name", { ascending: true })
      .abortSignal(AbortSignal.timeout(8000));
    if (error || !data?.length) {
      // Institution catalog is the public definition of the six labs — not fabricated metrics.
      return seedLabsAsDb();
    }
    return data.map((row) => normalizeLab(row as Record<string, unknown>));
  } catch {
    return seedLabsAsDb();
  }
}

export async function fetchLabBySlug(slug: string): Promise<Lab | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const seed = LABS.find((l) => l.slug === slug);
    return seed ? institutionToLab(seed) : null;
  }
  try {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("slug", slug)
      .eq("published", true)
      .abortSignal(AbortSignal.timeout(8000))
      .maybeSingle();
    if (error || !data) {
      const seed = LABS.find((l) => l.slug === slug);
      return seed ? institutionToLab(seed) : null;
    }
    return normalizeLab(data as Record<string, unknown>);
  } catch {
    const seed = LABS.find((l) => l.slug === slug);
    return seed ? institutionToLab(seed) : null;
  }
}

export async function fetchAllLabsAdmin(): Promise<Lab[]> {
  const supabase = getSupabase();
  if (!supabase) return isDemoMode() ? seedLabsAsDb() : [];
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .order("name", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => normalizeLab(row as Record<string, unknown>));
}

export type LabInput = {
  slug: string;
  name: string;
  short_name: string;
  tagline?: string;
  summary: string;
  focus?: string[];
  methods?: string[];
  open_roles?: string[];
  color?: string;
  published?: boolean;
};

export async function upsertLabAdmin(
  input: LabInput,
  existingId?: string,
): Promise<{ lab: Lab | null; error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { lab: null, error: "Lab management is temporarily unavailable." };

  const slug = clampText(input.slug, 80)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  const name = clampText(input.name, 160);
  const short_name = clampText(input.short_name, 80);
  const summary = clampText(input.summary, 4000);
  if (slug.length < 2) return { lab: null, error: "Slug is required." };
  if (name.length < 3) return { lab: null, error: "Name is required." };
  if (summary.length < 20) return { lab: null, error: "Summary must be at least 20 characters." };

  const payload = {
    slug,
    name,
    short_name,
    tagline: clampText(input.tagline ?? "", 280),
    summary,
    focus: (input.focus ?? [])
      .map((f) => clampText(f, 200))
      .filter(Boolean)
      .slice(0, 20),
    methods: (input.methods ?? [])
      .map((m) => clampText(m, 200))
      .filter(Boolean)
      .slice(0, 20),
    open_roles: (input.open_roles ?? [])
      .map((r) => clampText(r, 120))
      .filter(Boolean)
      .slice(0, 12),
    color: ["blue", "green", "red", "bone", "violet", "orange"].includes(input.color ?? "")
      ? input.color!
      : "bone",
    published: Boolean(input.published),
  };

  const query = existingId
    ? supabase
        .from("labs")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", existingId)
        .select("*")
        .maybeSingle()
    : supabase.from("labs").insert(payload).select("*").maybeSingle();

  const { data, error } = await query;
  if (error || !data) return { lab: null, error: error?.message ?? "Failed to save lab." };
  return { lab: normalizeLab(data as Record<string, unknown>), error: null };
}

export async function setLabPublished(
  id: string,
  published: boolean,
): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (!supabase) return { error: "This action is temporarily unavailable." };
  if (id.startsWith("seed-"))
    return { error: "This lab is a catalog preview and cannot be published yet." };
  const { error } = await supabase
    .from("labs")
    .update({ published, updated_at: new Date().toISOString() })
    .eq("id", id);
  return { error: error?.message ?? null };
}
