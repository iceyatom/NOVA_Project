"use client";
import { createContext, useContext, useState } from "react";

const LoginStatusContext = createContext({
  loggedIn: false,
  setLoggedIn: (v: boolean) => {},
  account: "",
  setAccount: (v: string) => {},
  accountEmail: "",
  setAccountEmail: (v: string) => {},
  userRole: "",
  setUserRole: (v: string) => {},
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
      }}
    >
      {children}
    </LoginStatusContext.Provider>
  );
}
