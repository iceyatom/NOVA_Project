"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function LoginSignIn() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    form?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: {
      email?: string;
      password?: string;
      form?: string;
    } = {};

    // Client-side validation
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
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: username,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrors({
          form: data.message || "Invalid email or password.",
        });
        return;
      }

      // Successful login
      setUser(data.user);

      // Navigate without full page reload
      router.push("/");
    } catch (error) {
      setErrors({
        form: "Network error. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="loginCard" aria-label="Login">
      <h1 className="loginTitle">Sign in</h1>

      <form className="loginForm" onSubmit={handleSubmit} noValidate>
        {/* Form-level error */}
        {errors.form && <p className="errorText">{errors.form}</p>}

        <label className="loginLabel">
          Email Address
          <input
            className={`loginInput ${errors.email ? "inputError" : ""}`}
            type="email"
            value={username}
            disabled={isLoading}
            onChange={(e) => {
              setUsername(e.target.value);
              setErrors((prev) => ({
                ...prev,
                email: undefined,
                form: undefined,
              }));
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
            disabled={isLoading}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: undefined,
                form: undefined,
              }));
            }}
          />
          {errors.password && <p className="errorText">{errors.password}</p>}
        </label>

        <button
          className="loginButton"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Log in"}
        </button>
      </form>
    </section>
  );
}