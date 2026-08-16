"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import type { Account } from "../../profile/types";
import { getSessionAccount, loginAccount, logoutAccount, readAccountData, writeAccountData } from "../../../services/api/account-api";
import { createAppDataSnapshot, normalizeAppData } from "../../../services/persistence/app-data";
import { readAccountFallback, readGuestData, saveBrowserData } from "../../../services/persistence/browser-storage";
import type { useAppDataState } from "../../../stores/useAppDataState";

type AppDataState = ReturnType<typeof useAppDataState>;

export function useAccountSync(data: AppDataState) {
  const [account, setAccount] = useState<Account | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [serverHydrated, setServerHydrated] = useState(false);
  const [ready, setReady] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginPending, setLoginPending] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  function applyAccountData(value: unknown) {
    const next = normalizeAppData(value);
    data.setAreas(next.areas);
    data.setActions(next.actions);
    data.setRecords(next.records);
    data.setShellBalance(next.shellBalance);
    data.setShellsEarned(next.shellsEarned);
    data.setRewards(next.rewards);
    data.setRewardClaims(next.rewardClaims);
    data.setNickname(next.profile.nickname);
    data.setLanguage(next.preferences.language);
    data.setTheme(next.preferences.theme);
    data.setCardMilestoneFirst(next.preferences.cardMilestoneFirst);
    data.setCardMilestoneSecond(next.preferences.cardMilestoneSecond);
  }

  async function hydrateAccount(nextAccount: Account) {
    setReady(false);
    setServerHydrated(false);
    const serverData = await readAccountData();
    const fallback = readAccountFallback(nextAccount.username);
    applyAccountData(serverData ?? fallback);
    setAccount(nextAccount);
    setReady(true);
    setServerHydrated(true);
  }

  function hydrateGuest() {
    applyAccountData(readGuestData());
    data.setNickname("");
    setAccount(null);
    setReady(true);
    setServerHydrated(false);
  }

  const persistedData = useMemo(
    () => createAppDataSnapshot({
      areas: data.areas,
      actions: data.actions,
      records: data.records,
      shellBalance: data.shellBalance,
      shellsEarned: data.shellsEarned,
      rewards: data.rewards,
      rewardClaims: data.rewardClaims,
      profile: { nickname: data.nickname },
      preferences: {
        language: data.language,
        theme: data.theme,
        cardMilestoneFirst: data.cardMilestoneFirst,
        cardMilestoneSecond: data.cardMilestoneSecond,
      },
      accountUsername: account?.username,
    }),
    [
      account?.username,
      data.actions,
      data.areas,
      data.cardMilestoneFirst,
      data.cardMilestoneSecond,
      data.language,
      data.nickname,
      data.records,
      data.rewardClaims,
      data.rewards,
      data.shellBalance,
      data.shellsEarned,
      data.theme,
    ],
  );

  // Session bootstrap is intentionally one-shot. Login and logout own later changes.
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const sessionAccount = await getSessionAccount();
        if (sessionAccount) await hydrateAccount(sessionAccount);
        else hydrateGuest();
      } catch {
        hydrateGuest();
      } finally {
        if (active) setAuthReady(true);
      }
    })();
    return () => { active = false; };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  useEffect(() => {
    if (!ready) return;
    saveBrowserData(account?.username ?? null, persistedData);
    if (!account || !serverHydrated) return;
    const timer = window.setTimeout(() => {
      void writeAccountData(persistedData)
        .catch(() => null);
    }, 320);
    return () => window.clearTimeout(timer);
  }, [account, persistedData, ready, serverHydrated]);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!loginUsername.trim() || !loginPassword) return false;
    setLoginPending(true);
    setLoginError("");
    try {
      const nextAccount = await loginAccount(loginUsername.trim(), loginPassword);
      await hydrateAccount(nextAccount);
      setLoginPassword("");
      return true;
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : "暂时无法登录");
      return false;
    } finally {
      setLoginPending(false);
    }
  }

  async function logout() {
    if (account && serverHydrated) {
      await writeAccountData(persistedData).catch(() => null);
    }
    await logoutAccount();
    hydrateGuest();
    setShowLogin(false);
    setLoginPassword("");
  }

  return {
    account,
    authReady,
    loginUsername,
    setLoginUsername,
    loginPassword,
    setLoginPassword,
    loginError,
    setLoginError,
    loginPending,
    showLogin,
    setShowLogin,
    login,
    logout,
  };
}
