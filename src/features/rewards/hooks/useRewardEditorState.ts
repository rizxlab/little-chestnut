"use client";

import { useState } from "react";
import type { Reward } from "../types";

export function useRewardEditorState() {
  const [pendingReward, setPendingReward] = useState<Reward | null>(null);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [showRewardManager, setShowRewardManager] = useState(false);
  const [showRewardEditor, setShowRewardEditor] = useState(false);
  const [draftRewardName, setDraftRewardName] = useState("");
  const [draftRewardDescription, setDraftRewardDescription] = useState("");
  const [draftRewardIcon, setDraftRewardIcon] = useState("🎁");
  const [draftRewardCost, setDraftRewardCost] = useState(10);

  return {
    pendingReward, setPendingReward,
    editingReward, setEditingReward,
    showRewardManager, setShowRewardManager,
    showRewardEditor, setShowRewardEditor,
    draftRewardName, setDraftRewardName,
    draftRewardDescription, setDraftRewardDescription,
    draftRewardIcon, setDraftRewardIcon,
    draftRewardCost, setDraftRewardCost,
  };
}
