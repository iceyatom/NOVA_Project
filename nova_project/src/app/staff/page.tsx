import Link from "next/link";

const tools = [
  { label: "Login UI", href: "/staff/login" },
  { label: "Staff dashboard layout", href: "/staff/dashboard" },
  { label: "Item search and browse", href: "/staff/item_search" },
  { label: "Item specific edit page UI", href: "/staff/item_edit" },
  { label: "Create item UI", href: "/staff/item_create" },
];

export default function StaffDevHubPage() {
  return (
    <div className="staff-dev-page">
      <div className="staff-dev-card">
      <div className="staff-dev-header">
        <h1 className="staff-dev-title centered">
          Staff Dev Hub
        </h1>

        <p className="staff-dev-subtitle centered">
          Temporary internal entry point for staff tooling placeholders.
        </p>
      </div>

        <div className="staff-dev-row">
          {tools.map((t) => (
            <Link key={t.href} href={t.href} className="staff-dev-pill">
              {t.label}
            </Link>
          ))}
        </div>

        <div className="staff-dev-footer">
          <div className="staff-dev-back-wrapper">
            <Link href="/" className="staff-dev-pill">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
