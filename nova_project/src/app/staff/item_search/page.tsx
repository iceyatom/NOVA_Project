// src/app/staff/item_search/page.tsx
// JIRA Subtask: STAFF-123
// Developer: Gemini
// Date: 2026-02-21
// Description: Create a functional placeholder inventory browsing page for the staff dashboard.

import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { CatalogItem } from "@prisma/client";

const StaffItemSearchPage = async () => {
  const catalogItems: CatalogItem[] = await prisma.catalogItem.findMany();
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
              {catalogItems.map((item) => (
                <tr key={item.id} className="item-search-page__tr">
                  <td className="item-search-page__td">
                    <input type="checkbox" />
                  </td>
                  <td className="item-search-page__td">{item.sku}</td>
                  <td className="item-search-page__td">{item.itemName}</td>
                  <td className="item-search-page__td">{item.category1}</td>
                  <td className="item-search-page__td">
                    {item.quantityInStock}
                  </td>
                  <td className="item-search-page__td">
                    ${Number(item.price).toFixed(2)}
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
