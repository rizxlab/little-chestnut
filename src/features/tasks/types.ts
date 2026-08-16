export type ActionTimeWindow = "morning" | "noon" | "evening" | "anytime";

export type Task = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  tagIds: string[];
  /** @deprecated Kept only while migrating pre-tag records. */
  areaId?: string;
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

/** @deprecated Use Task in new feature code. */
export type MicroAction = Task;
