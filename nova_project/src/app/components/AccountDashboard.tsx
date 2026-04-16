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

type ProfileSnapshot = {
  displayName: string;
  phone: string;
  email: string;
};

function formatLockDate(value: string | null) {
  if (!value) return "Unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Unavailable";
  return parsed.toLocaleString();
}

function getPhoneDigitsLength(value: string) {
  return value.replace(/\D/g, "").length;
}

const MIN_PHONE_DIGITS = 10;
const MAX_PHONE_DIGITS = 10;

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
    setAccount,
    setAccountId,
    accountEmail,
    setAccountEmail,
    setUserRole,
  } = useLoginStatus();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] =
    useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [initialProfile, setInitialProfile] = useState<ProfileSnapshot>({
    displayName: "",
    phone: "",
    email: "",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [accountIdValue, setAccountIdValue] = useState<number | null>(null);
  const [role, setRole] = useState("");
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
    return (
      email.trim().toLowerCase() !== accountEmail.trim().toLowerCase() ||
      !!newPassword
    );
  }, [accountEmail, email, newPassword]);

  const isDisplayNameDirty = displayName.trim() !== initialProfile.displayName;
  const isPhoneDirty = phone.trim() !== initialProfile.phone;
  const isEmailDirty =
    email.trim().toLowerCase() !== initialProfile.email.toLowerCase();
  const isCurrentPasswordDirty = currentPassword.length > 0;
  const isNewPasswordDirty = newPassword.length > 0;
  const isConfirmNewPasswordDirty = confirmNewPassword.length > 0;
  const isDeletePasswordDirty = deletePassword.length > 0;
  const hasProfileChanges = isDisplayNameDirty || isPhoneDirty || isEmailDirty;
  const hasPasswordChangeChanges =
    isNewPasswordDirty || isConfirmNewPasswordDirty;
  const hasUnsavedChanges =
    hasProfileChanges || isCurrentPasswordDirty || hasPasswordChangeChanges;
  const hasChangesToSave = hasProfileChanges || hasPasswordChangeChanges;
  const fieldLabelClass = (dirty: boolean) =>
    `accountFieldLabel${dirty ? " accountFieldLabelDirty" : ""}`;

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
        setAccountIdValue(
          typeof data.account.id === "number" ? data.account.id : null,
        );
        setInitialProfile({
          displayName: (data.account.displayName ?? "").trim(),
          phone: (data.account.phone ?? "").trim(),
          email: (data.account.email ?? "").trim().toLowerCase(),
        });
        setRole(data.account.role ?? "");
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
        setFeedback(
          error instanceof Error ? error.message : "Unable to load account.",
        );
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

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setLoggedIn(false);
    setAccount("");
    setAccountId(0);
    setAccountEmail("");
    setUserRole("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setDeletePassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setShowDeletePassword(false);
    router.push("/login");
  };

  const validateForm = () => {
    const nextErrors: typeof errors = {};

    if (!displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else {
      const phoneDigitsLength = getPhoneDigitsLength(phone);

      if (phoneDigitsLength > MAX_PHONE_DIGITS) {
        nextErrors.phone = "Phone number is too long. Use exactly 10 digits.";
      } else if (phoneDigitsLength < MIN_PHONE_DIGITS) {
        nextErrors.phone = "Phone number is too short. Use exactly 10 digits.";
      }
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
      setInitialProfile({
        displayName: (data.account.displayName || "").trim(),
        phone: (data.account.phone || "").trim(),
        email: (data.account.email || "").trim().toLowerCase(),
      });
      setAccountIdValue(
        typeof data.account.id === "number" ? data.account.id : null,
      );
      setRole(data.account.role || "");
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
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmNewPassword(false);
      setErrors({});
      setFeedback(data.message || "Account updated successfully.");
      setFeedbackType("success");
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to update account.",
      );
      setFeedbackType("error");
    } finally {
      setIsSaving(false);
    }
  };

  const openDeleteConfirmation = () => {
    const nextErrors: typeof errors = {};

    if (!deletePassword) {
      nextErrors.deletePassword = "Password confirmation is required.";
      setErrors((prev) => ({ ...prev, ...nextErrors }));
      return;
    }

    setDeleteConfirmChecked(false);
    setIsDeleteConfirmationOpen(true);
  };

  const closeDeleteConfirmation = () => {
    if (isDeleting) return;
    setIsDeleteConfirmationOpen(false);
    setDeleteConfirmChecked(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirmChecked) {
      setFeedback("Please confirm the deletion warning first.");
      setFeedbackType("error");
      return;
    }

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

      setIsDeleteConfirmationOpen(false);
      await handleLogout();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Unable to delete account.",
      );
      setFeedbackType("error");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDiscardChanges = () => {
    setDisplayName(initialProfile.displayName);
    setPhone(initialProfile.phone);
    setEmail(initialProfile.email);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setErrors((prev) => ({
      ...prev,
      displayName: undefined,
      phone: undefined,
      email: undefined,
      currentPassword: undefined,
      newPassword: undefined,
      confirmNewPassword: undefined,
    }));
    setFeedback(null);
    setFeedbackType(null);
  };

  return (
    <>
      <main className="accountDashboardPage">
        <section className="accountDashboardHero">
          <h1>Account Dashboard</h1>
          <p>
            Manage your account information, update your profile details, and
            review restrictions on sensitive account changes.
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
                    <span className={fieldLabelClass(isDisplayNameDirty)}>
                      Display Name
                    </span>
                    <input
                      className={`accountInput ${errors.displayName ? "inputError" : ""}`}
                      type="text"
                      value={displayName}
                      onChange={(e) => {
                        setDisplayName(e.target.value);
                        setErrors((prev) => ({
                          ...prev,
                          displayName: undefined,
                        }));
                      }}
                    />
                    {errors.displayName && (
                      <p className="errorText">{errors.displayName}</p>
                    )}
                  </label>

                  <label className="accountField">
                    <span className={fieldLabelClass(isPhoneDirty)}>
                      Phone Number
                    </span>
                    <input
                      className={`accountInput ${errors.phone ? "inputError" : ""}`}
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                    />
                    {errors.phone && (
                      <p className="errorText">{errors.phone}</p>
                    )}
                  </label>
                </div>

                <label className="accountField">
                  <span className={fieldLabelClass(isEmailDirty)}>
                    Email Address
                  </span>
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
                      Email changes are locked until{" "}
                      {formatLockDate(lockInfo.unlocksAt)}.
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
                    <span className={fieldLabelClass(isCurrentPasswordDirty)}>
                      Current Password
                    </span>
                    <div className="passwordInputWrap">
                      <input
                        className={`accountInput passwordInput ${
                          errors.currentPassword ? "inputError" : ""
                        }`}
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => {
                          setCurrentPassword(e.target.value);
                          if (!e.target.value) {
                            setShowCurrentPassword(false);
                          }
                          setErrors((prev) => ({
                            ...prev,
                            currentPassword: undefined,
                          }));
                        }}
                      />
                      {currentPassword.length > 0 && (
                        <button
                          type="button"
                          className="passwordToggle"
                          onClick={() =>
                            setShowCurrentPassword((prev) => !prev)
                          }
                          aria-label={
                            showCurrentPassword
                              ? "Hide password"
                              : "Show password"
                          }
                          aria-pressed={showCurrentPassword}
                        >
                          {showCurrentPassword ? (
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
                    {errors.currentPassword && (
                      <p className="errorText">{errors.currentPassword}</p>
                    )}
                  </label>

                  <div className="accountFormRow">
                    <label className="accountField">
                      <span className={fieldLabelClass(isNewPasswordDirty)}>
                        New Password
                      </span>
                      <div className="passwordInputWrap">
                        <input
                          className={`accountInput passwordInput ${
                            errors.newPassword ? "inputError" : ""
                          }`}
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          disabled={lockInfo.isLocked}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (!e.target.value) {
                              setShowNewPassword(false);
                            }
                            setErrors((prev) => ({
                              ...prev,
                              newPassword: undefined,
                            }));
                          }}
                        />
                        {newPassword.length > 0 && (
                          <button
                            type="button"
                            className="passwordToggle"
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            aria-label={
                              showNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            aria-pressed={showNewPassword}
                            disabled={lockInfo.isLocked}
                          >
                            {showNewPassword ? (
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
                      {errors.newPassword && (
                        <p className="errorText">{errors.newPassword}</p>
                      )}
                    </label>

                    <label className="accountField">
                      <span
                        className={fieldLabelClass(isConfirmNewPasswordDirty)}
                      >
                        Confirm New Password
                      </span>
                      <div className="passwordInputWrap">
                        <input
                          className={`accountInput passwordInput ${
                            errors.confirmNewPassword ? "inputError" : ""
                          }`}
                          type={showConfirmNewPassword ? "text" : "password"}
                          value={confirmNewPassword}
                          disabled={lockInfo.isLocked}
                          onChange={(e) => {
                            setConfirmNewPassword(e.target.value);
                            if (!e.target.value) {
                              setShowConfirmNewPassword(false);
                            }
                            setErrors((prev) => ({
                              ...prev,
                              confirmNewPassword: undefined,
                            }));
                          }}
                        />
                        {confirmNewPassword.length > 0 && (
                          <button
                            type="button"
                            className="passwordToggle"
                            onClick={() =>
                              setShowConfirmNewPassword((prev) => !prev)
                            }
                            aria-label={
                              showConfirmNewPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            aria-pressed={showConfirmNewPassword}
                            disabled={lockInfo.isLocked}
                          >
                            {showConfirmNewPassword ? (
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
                      {errors.confirmNewPassword && (
                        <p className="errorText">{errors.confirmNewPassword}</p>
                      )}
                    </label>
                  </div>

                  {lockInfo.isLocked ? (
                    <p className="accountRestrictionText">
                      Password changes are locked until{" "}
                      {formatLockDate(lockInfo.unlocksAt)}.
                    </p>
                  ) : (
                    <p className="accountHelperText">
                      Password must be at least 8 characters and include
                      uppercase, lowercase, and a number.
                    </p>
                  )}
                </div>

                <div className="accountActionRow">
                  <button
                    type="button"
                    className="accountSecondaryButton"
                    disabled={isSaving || isLoading || !hasUnsavedChanges}
                    onClick={handleDiscardChanges}
                  >
                    Discard Changes
                  </button>
                  <button
                    type="button"
                    className="accountPrimaryButton"
                    disabled={isSaving || isLoading || !hasChangesToSave}
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
                <strong>Account ID:</strong>{" "}
                {accountIdValue !== null ? accountIdValue : "Unavailable"}
              </div>
              <div>
                <strong>Role:</strong> {role || "Unavailable"}
              </div>
              <div>
                <strong>Created:</strong>{" "}
                {createdAt
                  ? new Date(createdAt).toLocaleString()
                  : "Unavailable"}
              </div>
              <div>
                <strong>Last updated:</strong>{" "}
                {updatedAt
                  ? new Date(updatedAt).toLocaleString()
                  : "Unavailable"}
              </div>
            </div>

            <div className="accountDangerZone">
              <h3>Delete Account</h3>
              <p>
                This permanently marks your account as deleted. Enter your
                password to confirm.
              </p>

              <label className="accountField">
                <span className={fieldLabelClass(isDeletePasswordDirty)}>
                  Confirm Password
                </span>
                <div className="passwordInputWrap">
                  <input
                    className={`accountInput passwordInput ${
                      errors.deletePassword ? "inputError" : ""
                    }`}
                    type={showDeletePassword ? "text" : "password"}
                    value={deletePassword}
                    onChange={(e) => {
                      setDeletePassword(e.target.value);
                      if (!e.target.value) {
                        setShowDeletePassword(false);
                      }
                      setErrors((prev) => ({
                        ...prev,
                        deletePassword: undefined,
                      }));
                    }}
                  />
                  {deletePassword.length > 0 && (
                    <button
                      type="button"
                      className="passwordToggle"
                      onClick={() => setShowDeletePassword((prev) => !prev)}
                      aria-label={
                        showDeletePassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showDeletePassword}
                    >
                      {showDeletePassword ? (
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
                {errors.deletePassword && (
                  <p className="errorText">{errors.deletePassword}</p>
                )}
              </label>

              <div className="accountActionRow">
                <button
                  type="button"
                  className="accountDangerButton"
                  disabled={isDeleting}
                  onClick={openDeleteConfirmation}
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

      {isDeleteConfirmationOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Delete Account"
          className="item-category-modal"
          onClick={closeDeleteConfirmation}
        >
          <div
            className="item-category-modal__content category-mgmt-confirm-modal__content account-delete-confirm-modal__content"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="item-category-modal__title">Confirm Deletion</div>
            <p className="category-mgmt-confirm-modal__message account-delete-confirm-modal__message">
              Are you sure that you want to delete your account? This action
              cannot be undone.
            </p>
            <label className="category-mgmt-delete-confirm account-delete-confirm-modal__checkbox">
              <input
                type="checkbox"
                checked={deleteConfirmChecked}
                onChange={(event) =>
                  setDeleteConfirmChecked(event.target.checked)
                }
                disabled={isDeleting}
              />
              I understand this deletion impact.
            </label>
            <div className="item-category-form__actions category-mgmt-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={closeDeleteConfirmation}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--danger"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
