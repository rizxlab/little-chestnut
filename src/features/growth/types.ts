export type GrowthSource = "主动记录" | "随机行动";

export type GrowthRecord = {
  id: string;
  actionId: string;
  actionName: string;
  icon: string;
  shellValue?: number;
  source: GrowthSource;
  createdAt: string;
};
