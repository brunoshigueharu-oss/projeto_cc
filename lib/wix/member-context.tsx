// lib/wix/member-context.tsx
"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isLoggedIn, getCurrentMember, logout as apiLogout, type WixMember } from "./members-auth";

type MemberContextValue = {
  member: WixMember | null;
  loggedIn: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: (returnTo?: string) => Promise<void>;
};

const MemberContext = createContext<MemberContextValue | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [member, setMember] = useState<WixMember | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const wasActive = isLoggedIn();
      const currentMember = wasActive ? await getCurrentMember() : null;
      setMember(currentMember);
      setLoggedIn(wasActive && currentMember !== null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refresh() sets state synchronously on mount (setLoading/setLoggedIn); accepted as one-time cost for initial auth check, not a hot path.
    refresh();
  }, [refresh]);

  const logout = useCallback(async (returnTo?: string) => {
    setMember(null);
    setLoggedIn(false);
    await apiLogout(returnTo);
  }, []);

  return (
    <MemberContext.Provider value={{ member, loggedIn, loading, refresh, logout }}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember(): MemberContextValue {
  const ctx = useContext(MemberContext);
  if (!ctx) throw new Error("useMember must be used within <MemberProvider>");
  return ctx;
}
