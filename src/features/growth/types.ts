export type GrowthSource = "主动记录" | "随机行动";

export type GrowthArea = {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type GrowthRecord = {
  id: string;
  actionId: string;
  actionName: string;
  icon: string;
  tagIds: string[];
  value: number;
  shellValue?: number;
  source: GrowthSource;
  createdAt: string;
};
