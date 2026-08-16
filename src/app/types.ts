import type { GrowthArea, GrowthRecord } from "../features/growth/types";
import type { Reward } from "../features/rewards/types";
import type { MicroAction } from "../features/tasks/types";

export type Tab = "today" | "growth" | "profile";
export type GrowthPeriod = "today" | "week" | "month" | "total";

export type ToastState = {
  id: string;
  title: string;
  message: string;
  undoRecordId?: string;
  undone?: boolean;
  leaving?: boolean;
};

export type ConfirmDialog =
  | { kind: "delete-action"; action: MicroAction }
  | { kind: "delete-area"; area: GrowthArea }
  | { kind: "delete-reward"; reward: Reward }
  | { kind: "reset-data" };

export type GrowthRecordWithArea = GrowthRecord & { area?: GrowthArea };
