"use client";
import { createContext, useContext, useState } from "react";

const LoginStatusContext = createContext({
  loggedIn: false,
  setLoggedIn: (v: boolean) => {},
  account: "",
  setAccount: (v: string) => {},
});

export function useLoginStatus() {
  return useContext(LoginStatusContext);
}

export function LoginStatusProvider({ children }: { children: React.ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [account, setAccount] = useState("");
  return (
    <LoginStatusContext.Provider value={{ loggedIn, setLoggedIn, account, setAccount }}>
      {children}
    </LoginStatusContext.Provider>
  );
}
