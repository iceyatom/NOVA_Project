"use client";

import { useRouter } from "next/navigation";
import { useLoginStatus } from "../LoginStatusContext";

export default function AccountDashboard() {
  const router = useRouter();
  const {
    loggedIn,
    setLoggedIn,
    account,
    setAccount,
    setAccountEmail,
    setUserRole,
  } = useLoginStatus();

  if (!loggedIn) {
    router.push("/login");
    return null;
  }

  const handleLogout = () => {
    setLoggedIn(false);
    setAccount("");
    setAccountEmail("");
    setUserRole("");
    router.push("/login");
  };

  return (
    <main className="accountDashboardPage">
      <section className="accountDashboardHero">
        <h1>Welcome, {account || "Account User"}</h1>
        <p>Shared workspace is for CUSTOMER, EMPLOYEE, and ADMIN accounts.</p>
      </section>

      <section className="accountDashboardGrid">
        <div className="accountCard">
          <h2>Profile Overview</h2>
          <p>This section can later display account summary information.</p>
          <p>
            <strong>Signed in as:</strong> {account || "Account user"}
          </p>
        </div>

        <div className="accountCard">
          <h2>Account Settings</h2>
          <p>Placeholder area for future account management and editing.</p>
          <ul>
            <li>Update display name</li>
            <li>Change password</li>
            <li>Manage contact information</li>
            <li>Notification preferences</li>
          </ul>
        </div>

        <div className="accountCard">
          <h2>Recently Viewed</h2>
          <p>Placeholder section for recently viewed items.</p>
        </div>

        <div className="accountCard">
          <h2>Order Requests</h2>
          <p>Placeholder section for order requests status.</p>
        </div>
      </section>

      <section className="accountDashboardActions">
        <button
          type="button"
          className="accountLogoutButton"
          onClick={handleLogout}
        >
          Log out
        </button>
      </section>
    </main>
  );
}
