"use client";

import { useState } from "react";

export default function LoginSignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});


  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

    console.log({ username, password });
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
              setErrors((prev) => ({ ...prev, email: undefined }));
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
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
          />
          {errors.password && <p className="errorText">{errors.password}</p>}
        </label>

        <button className="loginButton" type="submit">
          Log in
        </button>
      </form>
    </section>
  );
}
