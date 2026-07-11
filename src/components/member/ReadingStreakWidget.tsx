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

  if (!stats) {
    return (
      <div className={cn("panel glass surface-card p-5 h-full", className)}>
        <div className="shimmer h-3 w-28 rounded-sm" />
        <div className="shimmer mt-4 h-10 w-24 rounded-sm" />
      </div>
    );
  }

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
    <section className={cn("panel glass surface-card p-5 h-full flex flex-col", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4 flex-1">
        <div>
          <p className="label-xs text-accent-orange flex items-center gap-2">
            <Flame className="h-3.5 w-3.5" aria-hidden />
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
          <p className="label-xs text-muted-foreground flex items-center gap-1.5">
            <Target className="h-3 w-3" aria-hidden />
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
                aria-label="Weekly paper goal"
              />
              <Button type="button" size="sm" variant="outline" onClick={() => void onSaveGoal()}>
                Save
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setEditingGoal(true)}
              aria-label={`Weekly goal: ${stats.papersThisWeek} of ${stats.weeklyGoal} papers. Click to edit.`}
              className="mt-2 font-display text-2xl text-bone hover:text-accent-blue transition"
            >
              {stats.papersThisWeek}/{stats.weeklyGoal}
            </button>
          )}
          <div
            className="mt-2 h-1 rounded-full bg-border/60 overflow-hidden"
            role="progressbar"
            aria-valuenow={stats.papersThisWeek}
            aria-valuemin={0}
            aria-valuemax={stats.weeklyGoal}
            aria-label="Weekly reading progress"
          >
            <div
              className={cn(
                "h-full transition-all",
                stats.goalMet ? "bg-accent-green" : "bg-accent-orange",
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {stats.goalMet ? (
            <p className="mt-2 label-xs text-accent-green">Goal met this week</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
