import { readUserJson, writeUserJson } from "@/lib/storage";
import { getSupabase } from "@/lib/supabase";

export type ReadingStreakStats = {
  currentStreak: number;
  longestStreak: number;
  papersThisWeek: number;
  weeklyGoal: number;
  goalMet: boolean;
};

const ACTIVITY_STORAGE = "build:reading-activity";
const GOAL_STORAGE = "build:weekly-paper-goal";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function weekStartIso(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

type ActivityRow = { activity_date: string; papers_read: number };

function readLocalActivity(userId: string): ActivityRow[] {
  return readUserJson<ActivityRow[]>(ACTIVITY_STORAGE, userId, []);
}

function writeLocalActivity(userId: string, rows: ActivityRow[]) {
  writeUserJson(ACTIVITY_STORAGE, userId, rows);
}

function computeStreak(rows: ActivityRow[]): { current: number; longest: number } {
  const dates = new Set(rows.filter((r) => r.papers_read > 0).map((r) => r.activity_date));
  if (!dates.size) return { current: 0, longest: 0 };

  let longest = 0;
  let current = 0;
  const sorted = [...dates].sort();
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]!);
    const cur = new Date(sorted[i]!);
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86_400_000);
    if (diffDays === 1) run++;
    else {
      longest = Math.max(longest, run);
      run = 1;
    }
  }
  longest = Math.max(longest, run);

  const today = todayIso();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayIso = yesterday.toISOString().slice(0, 10);

  if (dates.has(today)) {
    current = 1;
    const d = new Date(today);
    while (true) {
      d.setDate(d.getDate() - 1);
      const iso = d.toISOString().slice(0, 10);
      if (dates.has(iso)) current++;
      else break;
    }
  } else if (dates.has(yesterdayIso)) {
    current = 1;
    const d = new Date(yesterdayIso);
    while (true) {
      d.setDate(d.getDate() - 1);
      const iso = d.toISOString().slice(0, 10);
      if (dates.has(iso)) current++;
      else break;
    }
  }

  return { current, longest };
}

export async function fetchWeeklyPaperGoal(userId: string): Promise<number> {
  const supabase = getSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("profiles")
      .select("weekly_paper_goal")
      .eq("id", userId)
      .maybeSingle();
    if (data?.weekly_paper_goal) return Number(data.weekly_paper_goal);
  }
  return readUserJson<number>(GOAL_STORAGE, userId, 2);
}

export async function setWeeklyPaperGoal(
  userId: string,
  goal: number,
): Promise<{ error: string | null }> {
  const safe = Math.min(20, Math.max(1, Math.round(goal)));
  writeUserJson(GOAL_STORAGE, userId, safe);

  const supabase = getSupabase();
  if (!supabase) return { error: null };

  const { error } = await supabase
    .from("profiles")
    .update({ weekly_paper_goal: safe, updated_at: new Date().toISOString() })
    .eq("id", userId);
  return { error: error?.message ?? null };
}

export async function recordPaperRead(userId: string): Promise<void> {
  const today = todayIso();
  const local = readLocalActivity(userId);
  const existing = local.find((r) => r.activity_date === today);
  if (existing) existing.papers_read += 1;
  else local.push({ activity_date: today, papers_read: 1 });
  writeLocalActivity(userId, local);

  const supabase = getSupabase();
  if (!supabase) return;

  const { data } = await supabase
    .from("reading_activity")
    .select("papers_read")
    .eq("user_id", userId)
    .eq("activity_date", today)
    .maybeSingle();

  const count = (data?.papers_read ?? 0) + 1;
  await supabase
    .from("reading_activity")
    .upsert(
      { user_id: userId, activity_date: today, papers_read: count },
      { onConflict: "user_id,activity_date" },
    );
}

export async function fetchReadingStreakStats(userId: string): Promise<ReadingStreakStats> {
  const supabase = getSupabase();
  let rows = readLocalActivity(userId);

  if (supabase) {
    const { data } = await supabase
      .from("reading_activity")
      .select("activity_date, papers_read")
      .eq("user_id", userId)
      .order("activity_date", { ascending: false })
      .limit(90);
    if (data?.length) {
      const map = new Map(rows.map((r) => [r.activity_date, r.papers_read]));
      for (const row of data) {
        const date = String(row.activity_date);
        const count = Number(row.papers_read);
        map.set(date, Math.max(map.get(date) ?? 0, count));
      }
      rows = [...map.entries()].map(([activity_date, papers_read]) => ({
        activity_date,
        papers_read,
      }));
    }
  }

  const weekStart = weekStartIso();
  const papersThisWeek = rows
    .filter((r) => r.activity_date >= weekStart)
    .reduce((sum, r) => sum + r.papers_read, 0);
  const weeklyGoal = await fetchWeeklyPaperGoal(userId);
  const { current, longest } = computeStreak(rows);

  return {
    currentStreak: current,
    longestStreak: longest,
    papersThisWeek,
    weeklyGoal,
    goalMet: papersThisWeek >= weeklyGoal,
  };
}
