"use client";

import { useState } from "react";
import Link from "next/link";

type Errors = {
  displayName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
};

type Step = "form" | "verify" | "success";

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
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

  const isValidPhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  // Stricter email validation regex: basic check for user@domain.tld
  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    const next: Errors = {};

    if (!displayName.trim()) {
      next.displayName = "Display name is required.";
    }

    if (!phone.trim()) {
      next.phone = "Phone number is required.";
    } else if (!isValidPhone(phone)) {
      next.phone = "Please enter a valid phone number.";
    }

    if (!email.trim()) {
      next.email = "Email address is required.";
    } else if (!isValidEmail(email)) {
      next.email =
        "Please enter a valid email address (e.g. user@example.com).";
    }

    if (!password) {
      next.password = "Password is required.";
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
        body: JSON.stringify({ displayName, phone, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedEmail(data.email ?? email.trim().toLowerCase());
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
    setResendMessage(null);
    setIsResending(true);
    try {
      await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifiedEmail }),
      });
      setResendMessage("A new code has been sent to your email.");
      setVerifyCode("");
      setVerifyError(null);
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
              {isVerifying ? "Verifying…" : "Verify account"}
            </button>
          </form>

          <div className="authLinks" aria-label="Resend options">
            <span className="authLinksText">Didn&apos;t receive the code?</span>
            <button
              className="authLink"
              type="button"
              onClick={handleResend}
              disabled={isResending}
              style={{ background: "none", border: "none", cursor: "pointer" }}
            >
              {isResending ? "Sending…" : "Resend code"}
            </button>
          </div>

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
            Sign in →
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
                pattern="[0-9()+\-\s]*"
                onChange={(e) => {
                  setPhone(e.target.value);
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
            <input
              className={`loginInput ${errors.password ? "inputError" : ""}`}
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => {
                setPassword(e.target.value);
                setErrors((p) => ({ ...p, password: undefined }));
              }}
            />
            {errors.password && <p className="errorText">{errors.password}</p>}
          </label>

          <label className="loginLabel">
            Confirm Password
            <input
              className={`loginInput ${
                errors.confirmPassword ? "inputError" : ""
              }`}
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrors((p) => ({ ...p, confirmPassword: undefined }));
              }}
            />
            {errors.confirmPassword && (
              <p className="errorText">{errors.confirmPassword}</p>
            )}
          </label>

          <label className="loginLabel">
            Account Role
            <select
              className="loginInput"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="CUSTOMER">Customer</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <button className="loginButton" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
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
