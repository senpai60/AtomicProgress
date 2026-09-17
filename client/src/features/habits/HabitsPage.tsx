import PageWrapper from "@/components/layout/PageWrapper";
import { useEffect, useState } from "react";
import { Habit } from "./habits.types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sun,
  Moon,
  Flame,
  Zap,
  CalendarClock,
  Trash2,
  Plus,
  Bell,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

// Helper to assign aesthetic icons and badge themes based on habit name/type
const getHabitVisuals = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("wake") || lower.includes("morning") || lower.includes("start")) {
    return {
      icon: Sun,
      iconColor: "text-amber-400",
      bgGlow: "bg-amber-500/10 border-amber-500/20",
      pillBadge: "Morning Routine",
    };
  }
  if (lower.includes("end") || lower.includes("sleep") || lower.includes("night")) {
    return {
      icon: Moon,
      iconColor: "text-indigo-400",
      bgGlow: "bg-indigo-500/10 border-indigo-500/20",
      pillBadge: "Evening Routine",
    };
  }
  if (lower.includes("workout") || lower.includes("gym") || lower.includes("exercise")) {
    return {
      icon: Zap,
      iconColor: "text-emerald-400",
      bgGlow: "bg-emerald-500/10 border-emerald-500/20",
      pillBadge: "Health & Fitness",
    };
  }
  return {
    icon: Flame,
    iconColor: "text-orange-400",
    bgGlow: "bg-orange-500/10 border-orange-500/20",
    pillBadge: "Atomic Habit",
  };
};

const HabitsPage = () => {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const loadHabits = async () => {
      if (window.api?.getHabits) {
        const data = await window.api.getHabits();
        setHabits(data);
      }
    };
    loadHabits();
  }, []);

  return (
    <PageWrapper className="max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="size-3 text-primary animate-pulse" />
              Routines & Automation
            </span>
            <span className="text-xs text-muted-foreground">
              {habits.length} {habits.length === 1 ? "routine" : "routines"} active
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Habits & Scheduled Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Maintain daily consistency with automated reminders and progress tracking.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 shadow-sm font-medium">
            <Plus className="size-4" />
            <span>New Habit</span>
          </Button>
        </div>
      </div>

      {/* Quick Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-xs">
          <div className="flex size-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Active Routines</div>
            <div className="text-lg font-semibold tracking-tight">{habits.length} Total</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-xs">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Daily Scheduled Reports</div>
            <div className="text-lg font-semibold tracking-tight">Configured</div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 rounded-xl border border-border/50 bg-card/60 backdrop-blur-xs">
          <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Consistency Target</div>
            <div className="text-lg font-semibold tracking-tight">100% Daily</div>
          </div>
        </div>
      </div>

      {/* Habits Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {habits?.map((habit) => {
          const visual = getHabitVisuals(habit.name);
          const IconComponent = visual.icon;

          return (
            <Card
              key={habit.id}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl border ${visual.bgGlow} shrink-0 transition-transform group-hover:scale-105 duration-200`}
                    >
                      <IconComponent className={`size-5 ${visual.iconColor}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                        {habit.name}
                      </CardTitle>
                      <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
                        {visual.pillBadge}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                    title="Delete habit"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="py-2 space-y-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg border border-border/30">
                  <Bell className="size-3.5 text-muted-foreground/80" />
                  <span className="truncate">Automated daily summary report</span>
                </div>

                {/* 7-day routine tracker indicator */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1 font-medium">
                    <span>Weekly Rhythm</span>
                    <span className="text-emerald-400 font-semibold">Active</span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    {["M", "T", "W", "T", "F", "S", "S"].map((day, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-1 flex-1 py-1 rounded-md bg-secondary/50 border border-border/40 text-[10px] text-muted-foreground font-mono"
                      >
                        <span>{day}</span>
                        <div
                          className={`size-1.5 rounded-full ${
                            i < 5 ? "bg-primary/80" : "bg-muted-foreground/30"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-center gap-2 text-xs font-medium rounded-xl border-border/80 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200"
                >
                  <CalendarClock className="size-3.5" />
                  <span>Set up scheduled reports</span>
                </Button>
              </CardFooter>
            </Card>
          );
        })}

        {/* Add New Habit Quick Card */}
        <button
          type="button"
          className="group flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-dashed border-border/80 hover:border-primary/60 bg-muted/10 hover:bg-muted/30 p-6 min-h-[220px] transition-all duration-200 text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <div className="flex size-10 items-center justify-center rounded-xl border border-dashed border-border group-hover:border-primary/60 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-200">
            <Plus className="size-5" />
          </div>
          <div className="text-center">
            <span className="text-sm font-medium block">Add New Habit</span>
            <span className="text-xs text-muted-foreground">
              Configure routine & tracking
            </span>
          </div>
        </button>
      </div>
    </PageWrapper>
  );
};

export default HabitsPage;
