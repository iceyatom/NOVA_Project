"use client";
import { createContext, useContext, useState, useEffect } from "react";

type LoginStatusContextValue = {
  loggedIn: boolean;
  setLoggedIn: (value: boolean) => void;
  account: string;
  setAccount: (value: string) => void;
  accountId: number;
  setAccountId: (value: number) => void;
  accountEmail: string;
  setAccountEmail: (value: string) => void;
  userRole: string;
  setUserRole: (value: string) => void;
};

const LoginStatusContext = createContext<LoginStatusContextValue>({
  loggedIn: false,
  setLoggedIn: () => {},
  account: "",
  setAccount: () => {},
  accountId: 0,
  setAccountId: () => {},
  accountEmail: "",
  setAccountEmail: () => {},
  userRole: "",
  setUserRole: () => {},
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
  const [accountId, setAccountId] = useState(0);
  const [accountEmail, setAccountEmail] = useState("");
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.ok && data.account) {
          setLoggedIn(true);
          setAccount(data.account.displayName ?? data.account.email);
          setAccountId(
            typeof data.account.id === "number" ? data.account.id : 0,
          );
          setAccountEmail(data.account.email);
          setUserRole(data.account.role);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <LoginStatusContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        account,
        setAccount,
        accountId,
        setAccountId,
        accountEmail,
        setAccountEmail,
        userRole,
        setUserRole,
      }}
    >
      {children}
    </LoginStatusContext.Provider>
  );
}
