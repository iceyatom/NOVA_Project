"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLoginStatus } from "../LoginStatusContext";

type AccountResponse = {
  ok?: boolean;
  error?: string;
  message?: string;
  account?: {
    id: number;
    email: string;
    displayName: string;
    phone: string;
    role: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  sensitiveLock?: {
    isLocked: boolean;
    remainingMs: number;
    unlocksAt: string | null;
  };
};

function formatLockDate(value: string | null) {
  if (!value) return "Unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unavailable";
  return parsed.toLocaleString();
}

function isValidPhone(value: string) {
  const digitsOnly = value.replace(/\D/g, "");
  return digitsOnly.length >= 10 && digitsOnly.length <= 15;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value);
}

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value)
  );
}

export default function AccountDashboard() {
  const router = useRouter();
  const {
    loggedIn,
    setLoggedIn,
    account,
    setAccount,
    accountEmail,
    setAccountEmail,
    setUserRole,
  } = useLoginStatus();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");

  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [createdAt, setCreatedAt] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [lockInfo, setLockInfo] = useState<{
    isLocked: boolean;
    remainingMs: number;
    unlocksAt: string | null;
  }>({
    isLocked: false,
    remainingMs: 0,
    unlocksAt: null,
  });

  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | null>(
    null,
  );

  const [errors, setErrors] = useState<{
    displayName?: string;
    phone?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
    deletePassword?: string;
  }>({});

  const hasSensitivePending = useMemo(() => {
    return email.trim().toLowerCase() !== accountEmail.trim().toLowerCase() || !!newPassword;
  }, [accountEmail, email, newPassword]);

  useEffect(() => {
    if (!loggedIn) {
      router.push("/login");
      return;
    }

    let mounted = true;

    const loadAccount = async () => {
      setIsLoading(true);
      setFeedback(null);
      setFeedbackType(null);

      try {
        const res = await fetch(
          `/api/account?email=${encodeURIComponent(accountEmail)}`,
          {
            cache: "no-store",
          },
        );
        const data = (await res.json()) as AccountResponse;

        if (!res.ok || !data.ok || !data.account) {
          throw new Error(data.error || "Unable to load account.");
        }

        if (!mounted) return;

        setDisplayName(data.account.displayName ?? "");
        setPhone(data.account.phone ?? "");
        setEmail(data.account.email ?? "");
        setRole(data.account.role ?? "");
        setStatus(data.account.status ?? "");
        setCreatedAt(data.account.createdAt ?? "");
        setUpdatedAt(data.account.updatedAt ?? "");
        setLockInfo(
          data.sensitiveLock ?? {
            isLocked: false,
            remainingMs: 0,
            unlocksAt: null,
          },
        );
      } catch (error) {
        if (!mounted) return;
        setFeedback(error instanceof Error ? error.message : "Unable to load account.");
        setFeedbackType("error");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadAccount();

    return () => {
      mounted = false;
    };
  }, [accountEmail, loggedIn, router]);

  if (!loggedIn) {
    return null;
  }

  const handleLogout = () => {
    setLoggedIn(false);
    setAccount("");
    setAccountEmail("");
    setUserRole("");
    router.push("/login");
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};

    if (!displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!isValidPhone(phone)) {
      nextErrors.phone = "Please enter a valid phone number.";
    }

    if (email.trim() !== accountEmail.trim()) {
      if (!isValidEmail(email)) {
        nextErrors.email = "Please enter a valid email address.";
      }
      if (lockInfo.isLocked) {
        nextErrors.email =
          "Email changes are locked for 30 days after a sensitive update.";
      }
      if (!currentPassword) {
        nextErrors.currentPassword =
          "Current password is required to change email or password.";
      }
    }

    if (newPassword) {
      if (lockInfo.isLocked) {
        nextErrors.newPassword =
          "Password changes are locked for 30 days after a sensitive update.";
      } else if (!isStrongPassword(newPassword)) {
        nextErrors.newPassword =
          "Password must be at least 8 characters and include uppercase, lowercase, and a number.";
      }

      if (!currentPassword) {
        nextErrors.currentPassword =
          "Current password is required to change email or password.";
      }

      if (newPassword !== confirmNewPassword) {
        nextErrors.confirmNewPassword = "Passwords do not match.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (isSaving || !validateForm()) return;

    setIsSaving(true);
    setFeedback(null);
    setFeedbackType(null);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: accountEmail,
          displayName,
          phone,
          newEmail: email,
          currentPassword,
          newPassword,
        }),
      });

      const data = (await res.json()) as AccountResponse;

      if (!res.ok || !data.ok || !data.account) {
        throw new Error(data.error || "Unable to update account.");
      }

      setAccount(data.account.displayName || data.account.email);
      setAccountEmail(data.account.email || accountEmail);
      setDisplayName(data.account.displayName || "");
      setPhone(data.account.phone || "");
      setEmail(data.account.email || "");
      setRole(data.account.role || "");
      setStatus(data.account.status || "");
      setCreatedAt(data.account.createdAt || "");
      setUpdatedAt(data.account.updatedAt || "");
      setLockInfo(
        data.sensitiveLock ?? {
          isLocked: false,
          remainingMs: 0,
          unlocksAt: null,
        },
      );

      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setErrors({});
      setFeedback(data.message || "Account updated successfully.");
      setFeedbackType("success");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to update account.");
      setFeedbackType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const nextErrors: typeof errors = {};

    if (!deletePassword) {
      nextErrors.deletePassword = "Password confirmation is required.";
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account?",
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setFeedback(null);
    setFeedbackType(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentEmail: accountEmail,
          password: deletePassword,
        }),
      });

      const data = (await res.json()) as AccountResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Unable to delete account.");
      }

      handleLogout();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Unable to delete account.");
      setFeedbackType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="accountDashboardPage">
      <section className="accountDashboardHero">
        <h1>Account Dashboard</h1>
        <p>
          Manage your account information, update your profile details, and review
          restrictions on sensitive account changes.
        </p>
      </section>

      <section className="accountSettingsLayout">
        <div className="accountCard">
          <h2>Profile Settings</h2>

          {isLoading ? (
            <p>Loading account details...</p>
          ) : (
            <div className="accountForm">
              <div className="accountFormRow">
                <label className="accountField">
                  <span className="accountFieldLabel">Display Name</span>
                  <input
                    className={`accountInput ${errors.displayName ? "inputError" : ""}`}
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                      setDisplayName(e.target.value);
                      setErrors((prev) => ({ ...prev, displayName: undefined }));
                    }}
                  />
                  {errors.displayName && (
                    <p className="errorText">{errors.displayName}</p>
                  )}
                </label>

                <label className="accountField">
                  <span className="accountFieldLabel">Phone Number</span>
                  <input
                    className={`accountInput ${errors.phone ? "inputError" : ""}`}
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setErrors((prev) => ({ ...prev, phone: undefined }));
                    }}
                  />
                  {errors.phone && <p className="errorText">{errors.phone}</p>}
                </label>
              </div>

              <label className="accountField">
                <span className="accountFieldLabel">Email Address</span>
                <input
                  className={`accountInput ${errors.email ? "inputError" : ""}`}
                  type="email"
                  value={email}
                  disabled={lockInfo.isLocked}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                />
                {lockInfo.isLocked ? (
                  <p className="accountRestrictionText">
                    Email changes are locked until {formatLockDate(lockInfo.unlocksAt)}.
                  </p>
                ) : (
                  <p className="accountHelperText">
                    Changing email requires your current password.
                  </p>
                )}
                {errors.email && <p className="errorText">{errors.email}</p>}
              </label>

              <div className="accountSensitiveSection">
                <h3>Change Password</h3>

                <label className="accountField">
                  <span className="accountFieldLabel">Current Password</span>
                  <input
                    className={`accountInput ${errors.currentPassword ? "inputError" : ""}`}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setErrors((prev) => ({
                        ...prev,
                        currentPassword: undefined,
                      }));
                    }}
                  />
                  {errors.currentPassword && (
                    <p className="errorText">{errors.currentPassword}</p>
                  )}
                </label>

                <div className="accountFormRow">
                  <label className="accountField">
                    <span className="accountFieldLabel">New Password</span>
                    <input
                      className={`accountInput ${errors.newPassword ? "inputError" : ""}`}
                      type="password"
                      value={newPassword}
                      disabled={lockInfo.isLocked}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setErrors((prev) => ({ ...prev, newPassword: undefined }));
                      }}
                    />
                    {errors.newPassword && (
                      <p className="errorText">{errors.newPassword}</p>
                    )}
                  </label>

                  <label className="accountField">
                    <span className="accountFieldLabel">Confirm New Password</span>
                    <input
                      className={`accountInput ${
                        errors.confirmNewPassword ? "inputError" : ""
                      }`}
                      type="password"
                      value={confirmNewPassword}
                      disabled={lockInfo.isLocked}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          confirmNewPassword: undefined,
                        }));
                      }}
                    />
                    {errors.confirmNewPassword && (
                      <p className="errorText">{errors.confirmNewPassword}</p>
                    )}
                  </label>
                </div>

                {lockInfo.isLocked ? (
                  <p className="accountRestrictionText">
                    Password changes are locked until {formatLockDate(lockInfo.unlocksAt)}.
                  </p>
                ) : (
                  <p className="accountHelperText">
                    Password must be at least 8 characters and include uppercase,
                    lowercase, and a number.
                  </p>
                )}
              </div>

              <div className="accountActionRow">
                <button
                  type="button"
                  className="accountPrimaryButton"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {feedback && (
                <div
                  className={`accountStatusMessage ${
                    feedbackType === "success" ? "success" : "error"
                  }`}
                  role={feedbackType === "success" ? "status" : "alert"}
                >
                  {feedback}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="accountCard">
          <h2>Account Details</h2>
          <div className="accountInfoGrid">
            <div>
              <strong>Signed in as:</strong> {account || "Account user"}
            </div>
            <div>
              <strong>Email on file:</strong> {accountEmail || "Unavailable"}
            </div>
            <div>
              <strong>Role:</strong> {role || "Unavailable"}
            </div>
            <div>
              <strong>Status:</strong> {status || "Unavailable"}
            </div>
            <div>
              <strong>Created:</strong>{" "}
              {createdAt ? new Date(createdAt).toLocaleString() : "Unavailable"}
            </div>
            <div>
              <strong>Last updated:</strong>{" "}
              {updatedAt ? new Date(updatedAt).toLocaleString() : "Unavailable"}
            </div>
          </div>

          <div className="accountDangerZone">
            <h3>Delete Account</h3>
            <p>
              This permanently marks your account as deleted. Enter your password
              to confirm.
            </p>

            <label className="accountField">
              <span className="accountFieldLabel">Confirm Password</span>
              <input
                className={`accountInput ${errors.deletePassword ? "inputError" : ""}`}
                type="password"
                value={deletePassword}
                onChange={(e) => {
                  setDeletePassword(e.target.value);
                  setErrors((prev) => ({ ...prev, deletePassword: undefined }));
                }}
              />
              {errors.deletePassword && (
                <p className="errorText">{errors.deletePassword}</p>
              )}
            </label>

            <div className="accountActionRow">
              <button
                type="button"
                className="accountDangerButton"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "Deleting..." : "Delete Account"}
              </button>

              <button
                type="button"
                className="accountLogoutButton"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>

          {hasSensitivePending && lockInfo.isLocked && (
            <div className="accountStatusMessage error" role="alert">
              Sensitive updates are currently blocked until{" "}
              {formatLockDate(lockInfo.unlocksAt)}.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}