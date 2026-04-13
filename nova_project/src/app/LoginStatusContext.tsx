"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

type AuthStatus = "loading" | "authenticated" | "anonymous";

type SessionAccount = {
  email: string;
  displayName: string | null;
  role: string;
};

const LoginStatusContext = createContext({
  loggedIn: false,
  setLoggedIn: (_v: boolean) => {},
  account: "",
  setAccount: (_v: string) => {},
  accountEmail: "",
  setAccountEmail: (_v: string) => {},
  userRole: "",
  setUserRole: (_v: string) => {},
  authStatus: "loading" as AuthStatus,
  logout: () => {},
});

export function useLoginStatus() {
  return useContext(LoginStatusContext);
}

export function LoginStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");

  const hydrateAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
      });
      const data = (await res.json()) as {
        authenticated: boolean;
        account?: SessionAccount;
      };

      if (data.authenticated && data.account) {
        setLoggedIn(true);
        setAccount(data.account.displayName || data.account.email);
        setAccountEmail(data.account.email);
        setUserRole(data.account.role);
        setAuthStatus("authenticated");
      } else {
        setLoggedIn(false);
        setAccount("");
        setAccountEmail("");
        setUserRole("");
        setAuthStatus("anonymous");
      }
    } catch {
      setLoggedIn(false);
      setAccount("");
      setAccountEmail("");
      setUserRole("");
      setAuthStatus("anonymous");
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Cookie will be cleared client-side regardless
    }
    setLoggedIn(false);
    setAccount("");
    setAccountEmail("");
    setUserRole("");
    setAuthStatus("anonymous");
  }, []);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  return (
    <LoginStatusContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        account,
        setAccount,
        accountEmail,
        setAccountEmail,
        userRole,
        setUserRole,
        authStatus,
        logout,
      }}
    >
      {children}
    </LoginStatusContext.Provider>
  );
}
