import Link from "next/link";

export default function StaffItemEditPage() {
  return (
    <div className="staff-dev-page">
      <div className="staff-dev-card">
        <h1 className="staff-dev-title">Staff Item Edit</h1>
        <p className="staff-dev-subtitle">Under Development</p>

        <div className="staff-dev-placeholder">
          This is a placeholder page for staff tooling UI. No business logic is implemented here.
        </div>

          <div className="staff-dev-back-wrapper">
            <Link href="/staff" className="staff-dev-pill">
              ← Back to Staff Dev Hub
            </Link>
          </div>
      </div>
    </div>
  );
}
