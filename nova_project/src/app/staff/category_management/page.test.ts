import React, { type ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StaffCategoryManagementPage from "./page";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => React.createElement("a", { href, ...props }, children),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("staff category management page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows a hierarchy load error when categories request fails", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 500));

    render(React.createElement(StaffCategoryManagementPage));

    expect(
      await screen.findByText("Failed to load category hierarchy."),
    ).toBeInTheDocument();
  });

  it("loads and drills down category -> subcategory -> type", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/catalog/categories")) {
        return Promise.resolve(jsonResponse({ categories: ["Lab Supplies"] }));
      }

      if (url.includes("/api/catalog/staff/subcategories")) {
        return Promise.resolve(
          jsonResponse({ subcategories: ["Microscopy Supplies"] }),
        );
      }

      if (url.includes("/api/catalog/staff/types")) {
        return Promise.resolve(jsonResponse({ types: ["Prepared Slides"] }));
      }

      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    });

    render(React.createElement(StaffCategoryManagementPage));

    const categoryCell = await screen.findByText("Lab Supplies");
    const categoryRow = categoryCell.closest("tr");
    expect(categoryRow).not.toBeNull();
    await userEvent.click(
      within(categoryRow as HTMLElement).getByText("Select"),
    );

    const subcategoryCell = await screen.findByText("Microscopy Supplies");
    const subcategoryRow = subcategoryCell.closest("tr");
    expect(subcategoryRow).not.toBeNull();
    await userEvent.click(
      within(subcategoryRow as HTMLElement).getByText("Select"),
    );

    expect(await screen.findByText("Prepared Slides")).toBeInTheDocument();
  });

  it("enforces create validation and explicit confirmation", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ categories: [] }));

    render(React.createElement(StaffCategoryManagementPage));

    await screen.findByText("No categories found.");
    await userEvent.click(screen.getByLabelText("Create new category"));

    const createDialog = await screen.findByRole("dialog", {
      name: "Create New Category",
    });

    await userEvent.click(
      within(createDialog).getByRole("button", { name: "Create" }),
    );
    expect(
      await screen.findByText("Category name is required."),
    ).toBeInTheDocument();

    await userEvent.type(
      within(createDialog).getByPlaceholderText("Enter a unique name"),
      "New Category",
    );
    await userEvent.click(
      within(createDialog).getByRole("button", { name: "Create" }),
    );

    const confirmDialog = await screen.findByRole("dialog", {
      name: "Confirm Create Category",
    });
    await userEvent.click(
      within(confirmDialog).getByRole("button", { name: "Confirm" }),
    );

    expect(
      await screen.findByText("Please confirm before creating."),
    ).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
