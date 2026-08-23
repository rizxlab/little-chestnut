import type { GrowthRecord, GrowthSource } from "../../growth/types";
import { randomToken } from "../../../shared/utils/runtime";
import { shellValueFor } from "./task-rules";
import type { MicroAction } from "../types";

export type TaskCompletionResult = {
  records: GrowthRecord[];
  count: number;
  shellGain: number;
};

export function completeTask(
  action: MicroAction,
  options: {
    count: number;
    source: GrowthSource;
    timestamp?: number;
  },
): TaskCompletionResult {
  const count = action.repeatable === false
    ? 1
    : Math.max(1, Math.floor(options.count));
  const shellValue = shellValueFor(action);
  const timestamp = options.timestamp ?? Date.now();
  const records = Array.from({ length: count }, (_, index): GrowthRecord => ({
    id: `${timestamp}-${index}-${randomToken()}`,
    actionId: action.id,
    actionName: action.name,
    icon: action.icon,
    shellValue,
    source: options.source,
    createdAt: new Date(timestamp + index).toISOString(),
  })).reverse();

  return { records, count, shellGain: shellValue * count };
}
