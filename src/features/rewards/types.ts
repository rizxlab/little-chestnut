export type Reward = {
  id: string;
  name: string;
  description: string;
  icon: string;
  cost: number;
  status?: "active" | "archived";
  createdAt?: string;
  updatedAt?: string;
};

export type RewardClaim = {
  id: string;
  rewardId: string;
  rewardName: string;
  icon: string;
  cost: number;
  createdAt: string;
};
