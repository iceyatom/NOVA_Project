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

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      next.email = "Please enter a valid email address (e.g. user@example.com).";
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
      setSuccess(false);
      return;
    }

    setErrors({});
    setFeedback(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/create_account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, phone, email, password, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback("Account created successfully! You may now sign in.");
        setSuccess(true);
        setDisplayName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setRole("CUSTOMER");
      } else {
        setFeedback(data.error || "Account creation failed.");
        setSuccess(false);
      }
    } catch (err) {
      setFeedback("An error occurred. Please try again later.");
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="loginPage">
        <section className="loginCard" aria-label="Account created">
          <h1 className="loginTitle">Account Created</h1>
          <p className="authLinksText" style={{ marginBottom: "1rem" }}>
            Your account has been created successfully.
          </p>
          <Link className="authLink" href="/login">
            Account created! Sign in →
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
          <div
            className={success ? "successText" : "errorText"}
            style={{ marginBottom: 16 }}
            role={success ? "status" : "alert"}
          >
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



          <button className="loginButton" type="submit">
            Create account
          </button>

        {feedback && (
          <div
            className={success ? "successText" : "errorText"}
            style={{ marginTop: 16 }}
            role={success ? "status" : "alert"}
          >
            {feedback}
          </div>
        )}
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
