"use client";

import Link from "next/link";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLoginStatus } from "../LoginStatusContext";
import LoginLoading from "../login/loading";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  locked?: boolean;
  lockoutUntil?: string;
  account?: {
    email?: string;
    displayName?: string | null;
  };
};

const MIN_AUTH_DELAY_MS = 3000;
const LOCKOUT_STORAGE_PREFIX = "login-lockout:";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getLockoutStorageKey(email: string): string {
  return `${LOCKOUT_STORAGE_PREFIX}${normalizeEmail(email)}`;
}

function formatLockoutTime(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export default function LoginSignIn() {
  const { loggedIn, setLoggedIn, account, setAccount } = useLoginStatus();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const activeRequestRef = useRef(false);

  const normalizedEmail = useMemo(() => normalizeEmail(username), [username]);
  const isLocked = !!lockoutUntil && lockoutUntil > Date.now();
  const remainingLockoutMs = isLocked ? lockoutUntil - Date.now() : 0;

  useEffect(() => {
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      setLockoutUntil(null);
      return;
    }

    const stored = window.localStorage.getItem(
      getLockoutStorageKey(normalizedEmail),
    );

    if (!stored) {
      setLockoutUntil(null);
      return;
    }

    const parsed = Number(stored);

    if (!Number.isFinite(parsed) || parsed <= Date.now()) {
      window.localStorage.removeItem(getLockoutStorageKey(normalizedEmail));
      setLockoutUntil(null);
      return;
    }

    setLockoutUntil(parsed);
  }, [normalizedEmail]);

  useEffect(() => {
    if (!lockoutUntil) return;

    const interval = window.setInterval(() => {
      if (Date.now() >= lockoutUntil) {
        if (normalizedEmail && normalizedEmail.includes("@")) {
          window.localStorage.removeItem(getLockoutStorageKey(normalizedEmail));
        }
        setLockoutUntil(null);
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [lockoutUntil, normalizedEmail]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isSubmitting || activeRequestRef.current || isLocked) {
      return;
    }

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
    activeRequestRef.current = true;

    const email = normalizeEmail(username);
    const delayPromise = new Promise((resolve) =>
      window.setTimeout(resolve, MIN_AUTH_DELAY_MS),
    );

    try {
      const responsePromise = fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const [response] = await Promise.all([responsePromise, delayPromise]);
      const data = (await response.json()) as LoginResponse;

      if (!response.ok || !data.ok) {
        setLoggedIn(false);
        setAccount("");

        if (data.locked && data.lockoutUntil) {
          const lockoutTimestamp = new Date(data.lockoutUntil).getTime();
          setLockoutUntil(lockoutTimestamp);
          window.localStorage.setItem(
            getLockoutStorageKey(email),
            String(lockoutTimestamp),
          );
          setAuthError(
            data.error ??
              "Your account is temporarily locked. Please try again later.",
          );
          return;
        }

        setAuthError(data.error ?? "Invalid email or password.");
        return;
      }

      window.localStorage.removeItem(getLockoutStorageKey(email));
      setLockoutUntil(null);
      setLoggedIn(true);
      setAccount(data.account?.displayName || data.account?.email || username);
      setAuthError("");
    } catch {
      await delayPromise;
      setLoggedIn(false);
      setAccount("");
      setAuthError("Unable to login right now. Please try again.");
    } finally {
      activeRequestRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return <LoginLoading />;
  }

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
              setErrors((prev) => ({ ...prev, email: undefined }));
              setAuthError("");
            }}
            disabled={isLocked}
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
              setErrors((prev) => ({ ...prev, password: undefined }));
              setAuthError("");
            }}
            disabled={isLocked}
          />
          {errors.password && <p className="errorText">{errors.password}</p>}
        </label>

        {isLocked && (
          <p className="errorText" role="alert" aria-live="assertive">
            Your account is temporarily locked. Please wait{" "}
            {formatLockoutTime(remainingLockoutMs)} before trying again.
          </p>
        )}

        {authError && <p className="errorText">{authError}</p>}

        <button
          className="loginButton"
          type="submit"
          style={{ marginTop: "1rem" }}
          disabled={isLocked}
        >
          Log in
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
              setLockoutUntil(null);
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
