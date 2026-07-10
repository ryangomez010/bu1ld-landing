import { Flame, Target } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  fetchReadingStreakStats,
  setWeeklyPaperGoal,
  type ReadingStreakStats,
} from "@/lib/reading-streaks";
import { cn } from "@/lib/utils";

export function ReadingStreakWidget({ userId, className }: { userId: string; className?: string }) {
  const [stats, setStats] = useState<ReadingStreakStats | null>(null);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState("2");

  useEffect(() => {
    void fetchReadingStreakStats(userId).then((s) => {
      setStats(s);
      setGoalInput(String(s.weeklyGoal));
    });
  }, [userId]);

  if (!stats) return null;

  const progress = Math.min(100, Math.round((stats.papersThisWeek / stats.weeklyGoal) * 100));

  const onSaveGoal = async () => {
    const n = Number(goalInput);
    if (!Number.isFinite(n)) return;
    await setWeeklyPaperGoal(userId, n);
    const next = await fetchReadingStreakStats(userId);
    setStats(next);
    setEditingGoal(false);
  };

  return (
    <section
      className={cn(
        "rounded-sm border border-accent-orange/25 bg-accent-orange/5 px-5 py-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-accent-orange flex items-center gap-2">
            <Flame className="h-3.5 w-3.5" />
            Reading streak
          </p>
          <p className="mt-2 font-display text-3xl text-bone">
            {stats.currentStreak}
            <span className="text-lg text-muted-foreground ml-2">
              day{stats.currentStreak !== 1 ? "s" : ""}
            </span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Longest: {stats.longestStreak} day{stats.longestStreak !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="min-w-[140px]">
          <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted-foreground flex items-center gap-1.5">
            <Target className="h-3 w-3" />
            Weekly goal
          </p>
          {editingGoal ? (
            <div className="mt-2 flex gap-2">
              <Input
                type="number"
                min={1}
                max={20}
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                className="h-8 w-16 text-sm"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => void onSaveGoal()}>
                Save
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingGoal(true)}
              className="mt-2 font-display text-2xl text-bone hover:text-accent-blue transition"
            >
              {stats.papersThisWeek}/{stats.weeklyGoal}
            </button>
          )}
          <div className="mt-2 h-1 rounded-full bg-border/60 overflow-hidden">
            <div
              className={cn(
                "h-full transition-all",
                stats.goalMet ? "bg-accent-green" : "bg-accent-orange",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {stats.goalMet ? (
            <p className="mt-2 font-mono text-[8px] tracking-[0.15em] uppercase text-accent-green">
              Goal met this week
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
