import { createContext, useContext, useState } from "react";

export type AuthUser = {
  displayName: string;
  email: string;
} | null;

export type AuthContextType = {
  isAuthenticated: boolean;
  user: AuthUser;
  setAuth: (auth: { isAuthenticated: boolean; user: AuthUser }) => void;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  setAuth: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
