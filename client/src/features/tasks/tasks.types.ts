export interface DailyRoutineTask {
  id: string;
  name: string;
  taskType: "session" | "check";
  frequency: "daily";
  streak: number;
  isDoneToday: boolean;
  startTime?: string; // 24 hour format HH:mm
  endTime?: string; // 24 hour format HH:mm
  taskStatus: "pending" | "in-progress" | "done" | "skip" | "paused";
  sessionDuration?: number; // minutes
}
