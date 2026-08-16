"use client";

import { useState } from "react";
import type { Account } from "../features/user/types";

/** Session state shared by product data loading and account UI. */
export function useAuthState() {
  const [account, setAccount] = useState<Account | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [serverHydrated, setServerHydrated] = useState(false);

  return {
    account,
    setAccount,
    authReady,
    setAuthReady,
    serverHydrated,
    setServerHydrated,
  };
}
