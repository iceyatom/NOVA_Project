"use client";
import React from "react";
import Link from "next/link";
import { CatalogItem } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

const StaffItemSearchPage = () => {

  const router = useRouter();

  const searchParams = useSearchParams();

  const pageSize = Number(searchParams.get("pageSize")) || 20;

  const offset = Number(searchParams.get("offset")) || 0;



  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);

  React.useEffect(() => {
    const fetchItems = async () => {
      const response = await fetch(
        `/api/catalog/staff?pageSize=${pageSize}&offset=${offset}`
      );
      const items = await response.json();
      setCatalogItems(items);
    };
    fetchItems();
  }, [pageSize, offset]);

  React.useEffect(() => {
    const fetchTotalItems = async () => {
      const response = await fetch("/api/catalog/staff/count");
      const { count } = await response.json();
      setTotalItems(count);
    };
    fetchTotalItems();
  }, []);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = Number(e.target.value);
    router.push(`/staff/item_search?pageSize=${newPageSize}&offset=0`);
  };

  const handlePageChange = (newOffset: number) => {
    router.push(`/staff/item_search?pageSize=${pageSize}&offset=${newOffset}`);
  };

  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;
  const maxOffset = Math.max(0, (totalPages - 1) * pageSize);

  const handleJumpByPages = (pageDelta: number) => {
    const newOffset = offset + pageDelta * pageSize;
    handlePageChange(Math.min(Math.max(newOffset, 0), maxOffset));
  };




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
              <select className="item-search-page__select">

                <option>Category: All</option>

                <option>Laboratory Supplies</option>

                <option>Live Algae Specimens</option>

                <option>Live Bacteria &amp; Fungi Specimens</option>

                <option>Live Invertebrates</option>

                <option>Live Plant Specimens</option>

                <option>Live Protozoa Specimens</option>

                <option>Live Vertebrates</option>

                <option>Microbiological Supplies</option>

                <option>Microscopes</option>

                <option>Owl Pellets</option>

                <option>Preserved Invertebrates</option>

                <option>Preserved Vertebrates</option>

              </select>
              <select
                className="item-search-page__select"
                onChange={handlePageSizeChange}
                value={pageSize}
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
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

          <div style={{ display: "flex", justifyContent: "center" }}>
            <div
              className="item-search-page__pagination-controls"
              style={{ display: "flex", alignItems: "center", gap: "1rem" }}
            >
              <button
                className="pagination__nav"
                onClick={() => handlePageChange(0)}
                disabled={offset === 0}
              >
                &lt;&lt;&lt;
              </button>
              <button
                className="pagination__nav"
                onClick={() => handleJumpByPages(-5)}
                disabled={offset === 0}
              >
                &lt;&lt;
              </button>
              <button
                className="pagination__nav"
                onClick={() => handlePageChange(offset - pageSize)}
                disabled={offset === 0}
              >
                &lt;
              </button>
              <span className="item-search-page__page-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination__nav"
                onClick={() => handlePageChange(offset + pageSize)}
                disabled={currentPage === totalPages}
              >
                &gt;
              </button>
              <button
                className="pagination__nav"
                onClick={() => handleJumpByPages(5)}
                disabled={currentPage === totalPages}
              >
                &gt;&gt;
              </button>
              <button
                className="pagination__nav"
                onClick={() => handlePageChange(maxOffset)}
                disabled={currentPage === totalPages}
              >
                &gt;&gt;&gt;
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>

  );

};

export default StaffItemSearchPage;
