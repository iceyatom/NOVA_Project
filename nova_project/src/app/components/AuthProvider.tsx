"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type AuthUser = {
  id: number;
  email: string;
  role: string;
  displayName?: string | null;
};

type AuthContextValue = {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  const value = useMemo(() => ({ user, setUser }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}