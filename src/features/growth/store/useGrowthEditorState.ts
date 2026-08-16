"use client";

import { useState } from "react";
import { AREA_COLORS } from "../constants";
import type { GrowthArea } from "../types";

export function useGrowthEditorState() {
  const [editingArea, setEditingArea] = useState<GrowthArea | null>(null);
  const [showAreaManager, setShowAreaManager] = useState(false);
  const [showAreaEditor, setShowAreaEditor] = useState(false);
  const [growthAreaDetailId, setGrowthAreaDetailId] = useState<string | null>(null);
  const [draftAreaName, setDraftAreaName] = useState("");
  const [draftAreaIcon, setDraftAreaIcon] = useState("🌿");
  const [draftAreaColor, setDraftAreaColor] = useState(AREA_COLORS[0]);
  const [returnToManager, setReturnToManager] = useState(false);

  return {
    editingArea, setEditingArea,
    showAreaManager, setShowAreaManager,
    showAreaEditor, setShowAreaEditor,
    growthAreaDetailId, setGrowthAreaDetailId,
    draftAreaName, setDraftAreaName,
    draftAreaIcon, setDraftAreaIcon,
    draftAreaColor, setDraftAreaColor,
    areaEditorReturnToManager: returnToManager,
    setAreaEditorReturnToManager: setReturnToManager,
  };
}
