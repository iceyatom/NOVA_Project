// src/app/staff/item_search/page.tsx
// JIRA Subtask: STAFF-123
// Developer: Gemini
// Date: 2026-02-21
// Description: Create a functional placeholder inventory browsing page for the staff dashboard.

import React from "react";
import Link from "next/link";

// Mock data for catalog items
const mockItems = [
  {
    id: "NILE-001",
    name: "Preserved Frog",
    category: "Vertebrates",
    stock: 50,
    price: 5.99,
    updatedAt: "2026-02-18",
  },
  {
    id: "NILE-002",
    name: "Live Amoeba Culture",
    category: "Protozoa",
    stock: 120,
    price: 12.5,
    updatedAt: "2026-02-20",
  },
  {
    id: "NILE-003",
    name: "Owl Pellet",
    category: "Owl Pellets",
    stock: 200,
    price: 2.75,
    updatedAt: "2026-02-16",
  },
  {
    id: "NILE-004",
    name: "E. Coli Bacteria Slope",
    category: "Bacteria & Fungi",
    stock: 75,
    price: 9.0,
    updatedAt: "2026-02-21",
  },
  {
    id: "NILE-005",
    name: "Earthworm",
    category: "Invertebrates",
    stock: 150,
    price: 1.5,
    updatedAt: "2026-02-19",
  },
];

const StaffItemSearchPage = () => {
  return (
    <div className="item-search-page">
      <div className="item-search-page__inner">
        <div className="item-search-page__header">
          <h1 className="item-search-page__title">Inventory Management</h1>
          <div className="staff-dev-back-wrapper">
            <Link href="/staff" className="staff-dev-pill">
              &larr; Back to Staff Hub
            </Link>
          </div>
        </div>

        {/* Search and Filter Controls: Allows staff to search and filter for specific items. */}
        <div className="item-search-page__controls">
          <div className="item-search-page__search">
            <div>
              <input
                type="text"
                placeholder="Search by keyword, SKU, or name..."
                className="item-search-page__search-input"
              />
            </div>
            <div className="item-search-page__filter-row">
              <button className="item-search-page__filter-button">
                Filters
              </button>
              <select className="item-search-page__select">
                <option>Category: All</option>
                <option>Vertebrates</option>
                <option>Invertebrates</option>
                <option>Protozoa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inventory Table: Displays a list of all items in the inventory. */}
        <div className="item-search-page__table-wrap">
          <table className="item-search-page__table">
            <thead className="item-search-page__thead">
              <tr>
                <th className="item-search-page__th">
                  <input type="checkbox" />
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">SKU</button>
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">Name</button>
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">
                    Category
                  </button>
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">Stock</button>
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">Price</button>
                </th>
                <th className="item-search-page__th">
                  <button className="item-search-page__th-button">
                    Last Modified
                  </button>
                </th>
                <th className="item-search-page__th">Actions</th>
              </tr>
            </thead>
            <tbody className="item-search-page__tbody">
              {mockItems.map((item) => (
                <tr key={item.id} className="item-search-page__tr">
                  <td className="item-search-page__td">
                    <input type="checkbox" />
                  </td>
                  <td className="item-search-page__td">{item.id}</td>
                  <td className="item-search-page__td">{item.name}</td>
                  <td className="item-search-page__td">{item.category}</td>
                  <td className="item-search-page__td">{item.stock}</td>
                  <td className="item-search-page__td">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="item-search-page__td">
                    {new Date(item.updatedAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="item-search-page__td">
                    <Link
                      href={`/staff/item_edit/${item.id}`}
                      className="item-search-page__edit-link"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffItemSearchPage;
