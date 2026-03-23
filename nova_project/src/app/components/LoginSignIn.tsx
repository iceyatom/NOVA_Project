"use client";

import Link from "next/link";
import { useLoginStatus } from "../LoginStatusContext";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginSignIn() {
  const { loggedIn, setLoggedIn, account, setAccount, userRole, setUserRole } =
    useLoginStatus();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const newErrors: { email?: string; password?: string } = {};
    if (!username) {
      newErrors.email = "Email address is required.";
    } else if (!username.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!password) {
      newErrors.password = "Password is required.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setAuthError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username.trim().toLowerCase(),
          password,
        }),
      });

      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        account?: {
          email?: string;
          displayName?: string | null;
          role?: string;
        };
      };

      if (!response.ok || !data.ok) {
        setLoggedIn(false);
        setAccount("");
        setUserRole("");
        setAuthError(data.error ?? "Invalid email or password.");
        return;
      }

      setLoggedIn(true);
      setAccount(data.account?.displayName || data.account?.email || username);
      setUserRole(data.account?.role || "");
    } catch {
      setLoggedIn(false);
      setAccount("");
      setAuthError("Unable to login right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="loginCard" aria-label="Login">
      <h1 className="loginTitle">Sign in</h1>
      <form className="loginForm" onSubmit={handleSubmit} noValidate>
        <label className="loginLabel">
          Email Address
          <input
            className={`loginInput ${errors.email ? "inputError" : ""}`}
            type="email"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev: typeof errors) => ({
                ...prev,
                email: undefined,
              }));
              setAuthError("");
            }}
          />
          {errors.email && <p className="errorText">{errors.email}</p>}
        </label>

        <label className="loginLabel">
          Password
          <input
            className={`loginInput ${errors.password ? "inputError" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev: typeof errors) => ({
                ...prev,
                password: undefined,
              }));
              setAuthError("");
            }}
          />
          {errors.password && <p className="errorText">{errors.password}</p>}
        </label>

        {authError && <p className="errorText">{authError}</p>}

        <button
          className="loginButton"
          type="submit"
          style={{ marginTop: "1rem" }}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Logging in..." : "Log in"}
        </button>

        {loggedIn && (
          <button
            className="loginButton"
            type="button"
            style={{ marginTop: "0.5rem", background: "#e53e3e" }}
            onClick={() => {
              setLoggedIn(false);
              setAccount("");
              setUsername("");
              setPassword("");
              setAuthError("");
              router.push("/login");
            }}
          >
            Log out
          </button>
        )}
      </form>

      <div className="authLinks" aria-label="Account actions">
        <span className="authLinksText">New here?</span>
        <Link className="authLink" href="/create_account">
          Create Account
        </Link>
      </div>

      <div
        style={{ marginTop: "2rem", color: loggedIn ? "#059669" : "#32486b" }}
      >
        <strong>Status:</strong>{" "}
        {loggedIn ? `Logged in as ${account}` : "Logged out"}
      </div>
    </section>
  );
}
