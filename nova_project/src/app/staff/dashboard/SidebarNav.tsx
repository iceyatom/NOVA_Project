"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  label: string;
  href: string;
};

function Section({ title, items }: { title: string; items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <div className="staffNavSection">
      <div className="staffNavSectionTitle">{title}</div>

      <div className="staffNavSectionItems">
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`staffNavLink ${isActive ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function SidebarNav() {
  return (
    <nav className="staffNav">
      <Section
        title="Overview"
        items={[{ label: "Dashboard Home", href: "/staff/dashboard" }]}
      />

      <Section
        title="Inventory"
        items={[{ label: "Item Search & Browse", href: "/staff/item_search" }]}
      />

      <Section
        title="Items"
        items={[
          { label: "Create Item", href: "/staff/item_create" },
          { label: "Edit Item", href: "/staff/item_edit" },
        ]}
      />

      <Section
        title="Tasks"
        items={[{ label: "Employee Task Monitor", href: "/staff/adminTaskView" }]}
      />

      <Section
        title="Support"
        items={[{ label: "Create Ticket", href: "/staff/ticket_create" }]}
      />

      <Section
        title="Categories"
        items={[
          {
            label: "Category Management",
            href: "/staff/category_management",
          },
        ]}
      />
    </nav>
  );
}