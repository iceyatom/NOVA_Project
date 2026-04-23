"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Errors = {
  displayName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type Step = "form" | "verify" | "success";
const RESEND_COOLDOWN_SECONDS = 5 * 60;

function parseIsoToMs(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatCountdown(totalSeconds: number): string {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (safeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification step state
  const [step, setStep] = useState<Step>("form");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendLockedUntil, setResendLockedUntil] = useState<number | null>(
    null,
  );
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (step !== "verify") return;
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step]);

  const resendRemainingSeconds =
    resendLockedUntil !== null
      ? Math.max(0, Math.ceil((resendLockedUntil - nowMs) / 1000))
      : 0;
  const isResendLocked = resendRemainingSeconds > 0;

  const getPhoneError = (value: string): string | undefined => {
    const digitsOnly = value.replace(/\D/g, "");

    if (!digitsOnly) {
      return "Phone number is required.";
    }

    if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
      return "Do not include a leading 1. Enter a 10-digit phone number.";
    }

    if (digitsOnly.length < 10) {
      return "Phone number is too short. Use exactly 10 digits.";
    }

    if (digitsOnly.length > 10) {
      return "Phone number is too long. Use exactly 10 digits.";
    }

    return undefined;
  };

  // Stricter email validation regex: basic check for user@domain.tld
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
  };

  const isStrongPassword = (value: string) => {
    return (
      value.length >= 8 &&
      /[A-Z]/.test(value) &&
      /[a-z]/.test(value) &&
      /\d/.test(value)
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const next: Errors = {};

    if (!displayName.trim()) {
      next.displayName = "Display name is required.";
    }

    const phoneError = getPhoneError(phone);
    if (phoneError) next.phone = phoneError;

    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      next.email =
        "Please enter a valid email address (e.g. user@example.com).";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (!isStrongPassword(password)) {
      next.password =
        "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(next).length > 0) {
      setErrors(next);
      setFeedback(null);
      return;
    }

    setErrors({});
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, phone, email, password }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedEmail(data.email ?? email.trim().toLowerCase());
        const serverLock = parseIsoToMs(data.resendAvailableAt);
        setResendLockedUntil(
          serverLock ?? Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
        );
        setResendMessage(null);
        setStep("verify");
      } else if (res.status === 409) {
        setErrors((p) => ({ ...p, email: data.error }));
      } else {
        setFeedback(data.error || "Account creation failed.");
      }
    } catch {
      setFeedback("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!verifyCode.trim()) {
      setVerifyError("Please enter the 6-digit code.");
      return;
    }
    setVerifyError(null);
    setIsVerifying(true);
    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail, code: verifyCode }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep("success");
      } else {
        setVerifyError(data.error ?? "Verification failed. Please try again.");
      }
    } catch {
      setVerifyError("Network error. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending || isResendLocked) return;

    setResendMessage(null);
    setIsResending(true);
    try {
      const res = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail }),
      });
      const data = await res.json();

      if (res.ok) {
        const serverLock = parseIsoToMs(data.resendAvailableAt);
        setResendLockedUntil(
          serverLock ?? Date.now() + RESEND_COOLDOWN_SECONDS * 1000,
        );
        setResendMessage("A new code has been sent to your email.");
        setVerifyCode("");
        setVerifyError(null);
      } else {
        const serverLock = parseIsoToMs(data.resendAvailableAt);
        if (serverLock) {
          setResendLockedUntil(serverLock);
          const seconds = Math.max(
            1,
            Math.ceil((serverLock - Date.now()) / 1000),
          );
          setResendMessage(
            `Please wait ${formatCountdown(seconds)} before requesting another code.`,
          );
        } else {
          setResendMessage(data.error ?? "Could not resend. Please try again.");
        }
      }
    } catch {
      setResendMessage("Could not resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  if (step === "verify") {
    return (
      <div className="loginPage">
        <section className="loginCard" aria-label="Verify your email">
          <h1 className="loginTitle">Check your email</h1>
          <p className="authLinksText" style={{ marginBottom: "1rem" }}>
            We sent a 6-digit code to <strong>{verifiedEmail}</strong>. Enter it
            below to activate your account.
          </p>

          <form className="loginForm" onSubmit={handleVerify} noValidate>
            <label className="loginLabel">
              Verification Code
              <input
                className={`loginInput ${verifyError ? "inputError" : ""}`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verifyCode}
                autoComplete="one-time-code"
                onChange={(e) => {
                  setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setVerifyError(null);
                }}
              />
              {verifyError && <p className="errorText">{verifyError}</p>}
            </label>

            <button
              className="loginButton"
              type="submit"
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify account"}
            </button>
          </form>

          <div className="authLinks" aria-label="Resend options">
            <span className="authLinksText">Didn&apos;t receive the code?</span>
            <button
              className="authLink"
              type="button"
              onClick={handleResend}
              disabled={isResending || isResendLocked}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {isResending
                ? "Sending..."
                : isResendLocked
                  ? `Resend in ${formatCountdown(resendRemainingSeconds)}`
                  : "Resend code"}
            </button>
          </div>

          {isResendLocked && (
            <p className="authLinksText" style={{ marginTop: "0.5rem" }}>
              You can request another code in{" "}
              <strong>{formatCountdown(resendRemainingSeconds)}</strong>.
            </p>
          )}

          {resendMessage && (
            <p className="authLinksText" style={{ marginTop: "0.5rem" }}>
              {resendMessage}
            </p>
          )}
        </section>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="loginPage">
        <section className="loginCard" aria-label="Account activated">
          <h1 className="loginTitle">Account Activated</h1>
          <p className="authLinksText" style={{ marginBottom: "1rem" }}>
            Your email has been verified and your account is now active.
          </p>
          <Link className="authLink" href="/login">
            Sign in -&gt;
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="loginPage">
      <section className="loginCard" aria-label="Create Account">
        <h1 className="loginTitle">Create Account</h1>

        {feedback && (
          <div className="errorText" style={{ marginBottom: 16 }} role="alert">
            {feedback}
          </div>
        )}

        <form className="loginForm" onSubmit={handleSubmit} noValidate>
          <div className="twoCol">
            <label className="loginLabel">
              Display Name
              <input
                className={`loginInput ${errors.displayName ? "inputError" : ""}`}
                type="text"
                value={displayName}
                autoComplete="name"
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  setErrors((p) => ({ ...p, displayName: undefined }));
                }}
              />
              {errors.displayName && (
                <p className="errorText">{errors.displayName}</p>
              )}
            </label>

            <label className="loginLabel">
              Phone Number
              <input
                className={`loginInput ${errors.phone ? "inputError" : ""}`}
                type="tel"
                value={phone}
                autoComplete="tel"
                inputMode="tel"
                pattern="[0-9]*"
                maxLength={11}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  setErrors((p) => ({ ...p, phone: undefined }));
                }}
              />
              {errors.phone && <p className="errorText">{errors.phone}</p>}
            </label>
          </div>

          <label className="loginLabel">
            Email Address
            <input
              className={`loginInput ${errors.email ? "inputError" : ""}`}
              type="email"
              value={email}
              autoComplete="email"
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: undefined }));
              }}
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
                autoComplete="new-password"
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!e.target.value) {
                    setShowPassword(false);
                  }
                  setErrors((p) => ({ ...p, password: undefined }));
                }}
              />
              {password.length > 0 && (
                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
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

          <label className="loginLabel">
            Confirm Password
            <div className="passwordInputWrap">
              <input
                className={`loginInput passwordInput ${
                  errors.confirmPassword ? "inputError" : ""
                }`}
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                autoComplete="new-password"
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!e.target.value) {
                    setShowConfirmPassword(false);
                  }
                  setErrors((p) => ({ ...p, confirmPassword: undefined }));
                }}
              />
              {confirmPassword.length > 0 && (
                <button
                  type="button"
                  className="passwordToggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showConfirmPassword}
                >
                  {showConfirmPassword ? (
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
            {errors.confirmPassword && (
              <p className="errorText">{errors.confirmPassword}</p>
            )}
          </label>

          <button className="loginButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="authLinks" aria-label="Account actions">
          <span className="authLinksText">Already have an account?</span>
          <Link className="authLink" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
