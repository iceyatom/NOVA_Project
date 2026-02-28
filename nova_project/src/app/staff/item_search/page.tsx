"use client";
import React from "react";
import Link from "next/link";
import { CatalogItem } from "@prisma/client";
import { useRouter, useSearchParams } from "next/navigation";

const CATEGORY_OPTIONS = [
  "Laboratory Supplies",
  "Live Algae Specimens",
  "Live Bacteria & Fungi Specimens",
  "Live Invertebrates",
  "Live Plant Specimens",
  "Live Protozoa Specimens",
  "Live Vertebrates",
  "Microbiological Supplies",
  "Microscopes",
  "Owl Pellets",
  "Preserved Invertebrates",
  "Preserved Vertebrates",
];

const StaffItemSearchPage = () => {

  const router = useRouter();

  const searchParams = useSearchParams();

  const pageSizeParam = searchParams.get("pageSize") || "20";
  const categoryParam = searchParams.get("category") || "all";
  const subcategoryParam = searchParams.get("subcategory") || "all";
  const typeParam = searchParams.get("type") || "all";

  const offset = Number(searchParams.get("offset")) || 0;



  const [catalogItems, setCatalogItems] = React.useState<CatalogItem[]>([]);
  const [totalItems, setTotalItems] = React.useState(0);
  const [subcategories, setSubcategories] = React.useState<string[]>([]);
  const [types, setTypes] = React.useState<string[]>([]);

  React.useEffect(() => {
    const fetchItems = async () => {
      const effectivePageSize =
        pageSizeParam === "all" ? Math.max(totalItems, 1) : Number(pageSizeParam) || 20;
      const params = new URLSearchParams({
        pageSize: String(effectivePageSize),
        offset: String(offset),
      });

      if (categoryParam !== "all") {
        params.set("category", categoryParam);
      }

      if (subcategoryParam !== "all") {
        params.set("subcategory", subcategoryParam);
      }

      if (typeParam !== "all") {
        params.set("type", typeParam);
      }

      const response = await fetch(`/api/catalog/staff?${params.toString()}`);
      const items = await response.json();
      setCatalogItems(items);
    };
    fetchItems();
  }, [pageSizeParam, offset, totalItems, categoryParam, subcategoryParam, typeParam]);

  React.useEffect(() => {
    const fetchTotalItems = async () => {
      const params = new URLSearchParams();

      if (categoryParam !== "all") {
        params.set("category", categoryParam);
      }

      if (subcategoryParam !== "all") {
        params.set("subcategory", subcategoryParam);
      }

      if (typeParam !== "all") {
        params.set("type", typeParam);
      }

      const response = await fetch(`/api/catalog/staff/count?${params.toString()}`);
      const { count } = await response.json();
      setTotalItems(count);
    };
    fetchTotalItems();
  }, [categoryParam, subcategoryParam, typeParam]);

  React.useEffect(() => {
    const fetchSubcategories = async () => {
      if (categoryParam === "all") {
        setSubcategories([]);
        return;
      }

      const response = await fetch(
        `/api/catalog/staff/subcategories?category=${encodeURIComponent(categoryParam)}`
      );
      const { subcategories: nextSubcategories } = await response.json();
      setSubcategories(nextSubcategories);
    };

    fetchSubcategories();
  }, [categoryParam]);

  React.useEffect(() => {
    const fetchTypes = async () => {
      if (categoryParam === "all" || subcategoryParam === "all") {
        setTypes([]);
        return;
      }

      const params = new URLSearchParams({
        category: categoryParam,
        subcategory: subcategoryParam,
      });

      const response = await fetch(`/api/catalog/staff/types?${params.toString()}`);
      const { types: nextTypes } = await response.json();
      setTypes(nextTypes);
    };

    fetchTypes();
  }, [categoryParam, subcategoryParam]);

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPageSize = e.target.value;
    const params = new URLSearchParams({
      pageSize: newPageSize,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCategory = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (newCategory !== "all") {
      params.set("category", newCategory);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSubcategory = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (newSubcategory !== "all") {
      params.set("subcategory", newSubcategory);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: "0",
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (newType !== "all") {
      params.set("type", newType);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const handlePageChange = (newOffset: number) => {
    const params = new URLSearchParams({
      pageSize: pageSizeParam,
      offset: String(newOffset),
    });

    if (categoryParam !== "all") {
      params.set("category", categoryParam);
    }

    if (subcategoryParam !== "all") {
      params.set("subcategory", subcategoryParam);
    }

    if (typeParam !== "all") {
      params.set("type", typeParam);
    }

    router.push(`/staff/item_search?${params.toString()}`);
  };

  const pageSize = pageSizeParam === "all" ? Math.max(totalItems, 1) : Number(pageSizeParam) || 20;

  const totalPages = Math.ceil(totalItems / pageSize);
  const currentPage = Math.floor(offset / pageSize) + 1;
  const maxOffset = Math.max(0, (totalPages - 1) * pageSize);

  const handleJumpByPages = (pageDelta: number) => {
    const newOffset = offset + pageDelta * pageSize;
    handlePageChange(Math.min(Math.max(newOffset, 0), maxOffset));
  };

  const formatItemName = (name: string) => {
    const maxLength = 36;

    if (name.length <= maxLength) {
      return name;
    }

    return `${name.slice(0, maxLength)}...`;
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
              <select
                className="item-search-page__select"
                onChange={handleCategoryChange}
                value={categoryParam}
              >

                <option value="all">Category: All</option>

                {CATEGORY_OPTIONS.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}

              </select>
              {categoryParam !== "all" && (
                <select
                  className="item-search-page__select"
                  onChange={handleSubcategoryChange}
                  value={subcategoryParam}
                >
                  <option value="all">Subcategory: All</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
              )}
              {subcategoryParam !== "all" && (
                <select
                  className="item-search-page__select"
                  onChange={handleTypeChange}
                  value={typeParam}
                >
                  <option value="all">Type: All</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              )}
              <select
                className="item-search-page__select"
                onChange={handlePageSizeChange}
                value={pageSizeParam}
              >
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
                <option value="all">All</option>
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

                  <td className="item-search-page__td">{formatItemName(item.itemName)}</td>

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
