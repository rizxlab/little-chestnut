"use client";

import { useState } from "react";

export function useProfileEditorState() {
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [draftProfileNickname, setDraftProfileNickname] = useState("");
  return {
    showProfileEditor,
    setShowProfileEditor,
    draftProfileNickname,
    setDraftProfileNickname,
  };
}
