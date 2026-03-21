"use client";
import { createContext, useContext, useState } from "react";

const LoginStatusContext = createContext({
  loggedIn: false,
  setLoggedIn: (v: boolean) => {},
  account: "",
  setAccount: (v: string) => {},
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
  const [userRole, setUserRole] = useState("");
  return (
    <LoginStatusContext.Provider
      value={{ loggedIn, setLoggedIn, account, setAccount, userRole, setUserRole }}
    >
      {children}
    </LoginStatusContext.Provider>
  );
}
