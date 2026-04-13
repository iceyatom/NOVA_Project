"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLoginStatus } from "../LoginStatusContext";
import LoginLoading from "../login/loading";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  locked?: boolean;
  lockoutUntil?: string;
  mfaRequired?: boolean;
  challengeId?: number;
  debugCode?: string;
};

type MfaVerifyResponse = {
  ok?: boolean;
  error?: string;
  account?: {
    email?: string;
    displayName?: string | null;
    role?: string;
  };
};

type MfaResendResponse = {
  ok?: boolean;
  error?: string;
  challengeId?: number;
  debugCode?: string;
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
  const router = useRouter();
  const {
    loggedIn,
    setLoggedIn,
    account,
    setAccount,
    setAccountEmail,
    setUserRole,
  } = useLoginStatus();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  // MFA step state
  const [mfaStep, setMfaStep] = useState(false);
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [debugCode, setDebugCode] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

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
        setAccountEmail("");
        setUserRole("");

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

      // Transition to MFA step
      if (data.mfaRequired && data.challengeId) {
        setChallengeId(data.challengeId);
        setDebugCode(data.debugCode ?? null);
        setMfaStep(true);
        return;
      }

      // Fallback (shouldn't happen with new flow, but safe)
      setLoggedIn(true);
      setAccount(username);
      setAccountEmail(email);
      router.push("/account");
    } catch {
      await delayPromise;
      setLoggedIn(false);
      setAccount("");
      setAccountEmail("");
      setUserRole("");
      setAuthError("Unable to login right now. Please try again.");
    } finally {
      activeRequestRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleMfaVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isVerifying || !challengeId) return;

    const trimmed = mfaCode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setMfaError("Please enter a valid 6-digit code.");
      return;
    }

    setIsVerifying(true);
    setMfaError("");

    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: trimmed }),
      });

      const data = (await res.json()) as MfaVerifyResponse;

      if (!res.ok || !data.ok) {
        setMfaError(data.error ?? "Verification failed.");
        return;
      }

      setLoggedIn(true);
      setAccount(data.account?.displayName || data.account?.email || username);
      setAccountEmail(data.account?.email || normalizedEmail);
      setUserRole(data.account?.role || "");
      router.push("/account");
    } catch {
      setMfaError("Unable to verify code. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMfaResend = async () => {
    if (isResending || !challengeId) return;

    setIsResending(true);
    setMfaError("");

    try {
      const res = await fetch("/api/auth/mfa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      const data = (await res.json()) as MfaResendResponse;

      if (!res.ok || !data.ok) {
        setMfaError(data.error ?? "Unable to resend code.");
        return;
      }

      setChallengeId(data.challengeId ?? challengeId);
      setDebugCode(data.debugCode ?? null);
      setMfaCode("");
      setMfaError("");
    } catch {
      setMfaError("Unable to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleBackToLogin = () => {
    setMfaStep(false);
    setChallengeId(null);
    setDebugCode(null);
    setMfaCode("");
    setMfaError("");
  };

  if (isSubmitting) {
    return <LoginLoading />;
  }

  // MFA verification step
  if (mfaStep) {
    return (
      <section className="loginCard" aria-label="MFA Verification">
        <h1 className="loginTitle">Verification Code</h1>
        <p
          style={{
            textAlign: "center",
            color: "var(--muted)",
            marginBottom: "1rem",
          }}
        >
          Enter the 6-digit code sent to your device.
        </p>

        <form className="loginForm" onSubmit={handleMfaVerify} noValidate>
          <label className="loginLabel">
            6-Digit Code
            <input
              className="loginInput mfaCodeInput"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={mfaCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setMfaCode(val);
                setMfaError("");
              }}
              autoFocus
              autoComplete="one-time-code"
              disabled={isVerifying}
            />
          </label>

          {mfaError && <p className="errorText">{mfaError}</p>}

          {debugCode && (
            <div className="mfaDebugCallout">
              Dev code: <strong>{debugCode}</strong>
            </div>
          )}

          <div className="mfaActions">
            <button
              className="loginButton"
              type="submit"
              disabled={isVerifying || mfaCode.length !== 6}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
            <button
              className="loginButton"
              type="button"
              style={{ background: "#6b7280" }}
              disabled={isResending}
              onClick={handleMfaResend}
            >
              {isResending ? "Sending..." : "Resend Code"}
            </button>
          </div>

          <button
            className="loginButton"
            type="button"
            style={{ marginTop: "0.5rem", background: "#e53e3e" }}
            onClick={handleBackToLogin}
          >
            Back to Login
          </button>
        </form>
      </section>
    );
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
          <div className="passwordInputWrap">
            <input
              className={`loginInput passwordInput ${
                errors.password ? "inputError" : ""
              }`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!e.target.value) {
                  setShowPassword(false);
                }
                setErrors((prev) => ({ ...prev, password: undefined }));
                setAuthError("");
              }}
              disabled={isLocked}
            />
            {password.length > 0 && (
              <button
                type="button"
                className="passwordToggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                disabled={isLocked}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                    <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c5 0 9.27 3.11 11 7a11.92 11.92 0 0 1-4.05 5.19" />
                    <path d="M6.61 6.61A11.95 11.95 0 0 0 1 12c1.73 3.89 6 7 11 7a10.94 10.94 0 0 0 5-.91" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            )}
          </div>
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
              setAccountEmail("");
              setUserRole("");
              setUsername("");
              setPassword("");
              setShowPassword(false);
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
