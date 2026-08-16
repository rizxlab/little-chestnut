export type ActionTimeWindow = "morning" | "noon" | "evening" | "anytime";
export type TimerPhase = "idle" | "preparing" | "running" | "success";

export type MicroAction = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  tagIds: string[];
  value: number;
  shellValue?: number;
  repeatable: boolean;
  timeWindow?: ActionTimeWindow;
  timerSeconds?: number;
  temporary?: boolean;
  temporaryDays?: number;
  expiresOn?: string;
  createdAt?: string;
  updatedAt?: string;
};
