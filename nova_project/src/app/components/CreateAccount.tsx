"use client";

import { useState } from "react";
import Link from "next/link";

type Errors = {
  displayName?: string;
  phone?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function CreateAccountPage() {
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  const isValidPhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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
    } else if (!email.includes("@")) {
      next.email = "Please enter a valid email address.";
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
      return;
    }

    setErrors({});

    // Frontend only for now
    console.log({ displayName, phone, email, password });
  };

  return (
    <div className="loginPage">
      <section className="loginCard" aria-label="Create Account">
        <h1 className="loginTitle">Create Account</h1>

        <form className="loginForm" onSubmit={handleSubmit} noValidate>
          <div className="twoCol">
            <label className="loginLabel">
              Display Name
              <input
                className={`loginInput ${
                  errors.displayName ? "inputError" : ""
                }`}
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
                className={`loginInput ${
                  errors.phone ? "inputError" : ""
                }`}
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
              {errors.phone && (
                <p className="errorText">{errors.phone}</p>
              )}
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
            {errors.password && (
              <p className="errorText">{errors.password}</p>
            )}
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

          <button className="loginButton" type="submit">
            Create account
          </button>
        </form>

        <div className="authLinks" aria-label="Account actions">
          <span className="authLinksText">
            Already have an account?
          </span>
          <Link className="authLink" href="/login">
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}