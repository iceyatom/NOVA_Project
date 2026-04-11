import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import StaffTicketCreatePage from "./page";

vi.mock("../../LoginStatusContext", () => ({
  useLoginStatus: () => ({
    accountEmail: "staff@example.com",
  }),
}));

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("staff ticket create page", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // Verifies submit validation blocks ticket creation when the first line has no selected item.
  it("shows validation error when submitting with empty first line", async () => {
    const user = userEvent.setup();
    render(React.createElement(StaffTicketCreatePage));

    await user.click(screen.getByRole("button", { name: "Create Ticket" }));

    expect(
      await screen.findByText(
        "First ticket line is missing a selected catalog item.",
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Verifies value calculation blocks when an extra blank line exists.
  it("shows validation error for empty additional line during value calculation", async () => {
    const user = userEvent.setup();
    render(React.createElement(StaffTicketCreatePage));

    await user.click(screen.getByRole("button", { name: "Add ticket entry" }));
    await user.click(screen.getByRole("button", { name: "Calculate Value" }));

    expect(
      await screen.findByText(
        "Remove empty ticket lines before calculating value.",
      ),
    ).toBeInTheDocument();
  });

  // Verifies successful end-to-end create flow after selecting a catalog suggestion.
  it("creates a ticket successfully after confirmation", async () => {
    fetchMock.mockImplementation((input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/catalog/staff?")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: [
              {
                id: 1,
                sku: "ABC-123",
                itemName: "Prepared Slides",
                category1: "Microscopy",
                price: 12.5,
                quantityInStock: 20,
              },
            ],
          }),
        );
      }

      if (url.endsWith("/api/tickets/staff")) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            data: { ticketId: 42, lineCount: 1 },
          }),
        );
      }

      return Promise.reject(new Error(`Unhandled fetch URL: ${url}`));
    });

    render(React.createElement(StaffTicketCreatePage));
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("Search by SKU or Name"),
      "slides",
    );

    const suggestionText = await screen.findByText("Prepared Slides");
    const suggestionButton = suggestionText.closest("button");
    expect(suggestionButton).not.toBeNull();
    await user.click(suggestionButton as HTMLButtonElement);
    await user.type(screen.getByPlaceholderText("Enter quantity"), "2");
    await user.type(
      screen.getByPlaceholderText("Add context for approvers/reviewers."),
      "Need this for lab section.",
    );

    await user.click(screen.getByRole("button", { name: "Create Ticket" }));
    expect(
      await screen.findByRole("dialog", { name: "Confirm Create Ticket" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm Create" }));

    expect(
      await screen.findByText(
        "Ticket created successfully. New ticket ID: 42.",
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/tickets/staff",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  // Verifies unsaved edits trigger confirmation before draft clearing.
  it("opens clear confirmation when unsaved changes exist", async () => {
    render(React.createElement(StaffTicketCreatePage));
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText("Add context for approvers/reviewers."),
      "temporary note",
    );
    await user.click(screen.getByRole("button", { name: "Clear" }));

    expect(
      await screen.findByRole("dialog", { name: "Confirm Clear Changes" }),
    ).toBeInTheDocument();
  });
});
