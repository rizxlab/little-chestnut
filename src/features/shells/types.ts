export type ShellTransaction = {
  id: string;
  type: "task-earned" | "reward-spent" | "adjustment";
  amount: number;
  taskCompletionId?: string;
  rewardClaimId?: string;
  createdAt: string;
};

export type ChestnutShellWallet = {
  balance: number;
  totalEarned: number;
  history: ShellTransaction[];
};
