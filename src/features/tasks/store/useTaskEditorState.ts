"use client";

import { useState } from "react";
import type { ActionTimeWindow, MicroAction } from "../types";

export function useTaskEditorState() {
  const [editingAction, setEditingAction] = useState<MicroAction | null>(null);
  const [showActionManager, setShowActionManager] = useState(false);
  const [showActionEditor, setShowActionEditor] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftIcon, setDraftIcon] = useState("🌱");
  const [draftPresetId, setDraftPresetId] = useState<string | null>("custom");
  const [showActionIconPicker, setShowActionIconPicker] = useState(false);
  const [draftTags, setDraftTags] = useState<string[]>(["body"]);
  const [draftValue, setDraftValue] = useState(1);
  const [draftShellValue, setDraftShellValue] = useState(1);
  const [draftRepeatable, setDraftRepeatable] = useState(true);
  const [draftTemporary, setDraftTemporary] = useState(false);
  const [draftTemporaryDays, setDraftTemporaryDays] = useState(1);
  const [draftTimeWindow, setDraftTimeWindow] = useState<ActionTimeWindow>("anytime");
  const [draftUsesTimer, setDraftUsesTimer] = useState(false);
  const [draftTimerSeconds, setDraftTimerSeconds] = useState(5);
  const [timerAction, setTimerAction] = useState<MicroAction | null>(null);
  const [timerPhase, setTimerPhase] = useState<"idle" | "preparing" | "running" | "success">("idle");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [timerMultiplier, setTimerMultiplier] = useState(1);
  const [timerRingResetting, setTimerRingResetting] = useState(false);

  return {
    editingAction, setEditingAction,
    showActionManager, setShowActionManager,
    showActionEditor, setShowActionEditor,
    draftName, setDraftName,
    draftIcon, setDraftIcon,
    draftPresetId, setDraftPresetId,
    showActionIconPicker, setShowActionIconPicker,
    draftTags, setDraftTags,
    draftValue, setDraftValue,
    draftShellValue, setDraftShellValue,
    draftRepeatable, setDraftRepeatable,
    draftTemporary, setDraftTemporary,
    draftTemporaryDays, setDraftTemporaryDays,
    draftTimeWindow, setDraftTimeWindow,
    draftUsesTimer, setDraftUsesTimer,
    draftTimerSeconds, setDraftTimerSeconds,
    timerAction, setTimerAction,
    timerPhase, setTimerPhase,
    timerSecondsLeft, setTimerSecondsLeft,
    timerMultiplier, setTimerMultiplier,
    timerRingResetting, setTimerRingResetting,
  };
}
