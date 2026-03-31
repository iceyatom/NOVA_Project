"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLoginStatus } from "../../LoginStatusContext";

type TicketType = "ORDER" | "SUPPLY" | "SPOILAGE";

type TicketLineDraft = {
  localId: number;
  catalogItemId: string;
  catalogSearch: string;
  countDelta: string;
};

type TicketCatalogSuggestion = {
  id: number;
  sku: string | null;
  itemName: string;
  category1: string | null;
  price: number | null;
  quantityInStock: number | null;
};

type StaffCatalogResponse = {
  success?: boolean;
  data?: unknown;
};

type CreateTicketApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    ticketId?: number;
    lineCount?: number;
  };
};

type TicketDraft = {
  type: TicketType;
  note: string;
  lines: TicketLineDraft[];
};

type TicketCatalogPriceLookup = Record<
  string,
  {
    itemName: string;
    price: number;
  }
>;

type TicketCatalogStockLookup = Record<
  string,
  {
    itemName: string;
    quantityInStock: number;
  }
>;

type TicketValueSummary = {
  rows: Array<{
    localId: number;
    catalogItemId: string;
    itemName: string;
    quantity: number;
    priceRate: number;
    lineTotal: number;
  }>;
  totalAmount: number;
};

const TICKET_TYPE_OPTIONS: Array<{ value: TicketType; label: string }> = [
  { value: "ORDER", label: "Order" },
  { value: "SUPPLY", label: "Supply" },
  { value: "SPOILAGE", label: "Spoilage" },
];

const INITIAL_DRAFT: TicketDraft = {
  type: "ORDER",
  note: "",
  lines: [{ localId: 1, catalogItemId: "", catalogSearch: "", countDelta: "" }],
};

export default function StaffTicketCreatePage() {
  const { accountEmail } = useLoginStatus();
  const [draft, setDraft] = useState<TicketDraft>(INITIAL_DRAFT);
  const [nextLineId, setNextLineId] = useState(2);
  const [lineSuggestions, setLineSuggestions] = useState<
    Record<number, TicketCatalogSuggestion[]>
  >({});
  const [isSearchingLine, setIsSearchingLine] = useState<
    Record<number, boolean>
  >({});
  const [activeSuggestionLineId, setActiveSuggestionLineId] = useState<
    number | null
  >(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showCreateResult, setShowCreateResult] = useState(false);
  const [createResult, setCreateResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [catalogPriceLookup, setCatalogPriceLookup] =
    useState<TicketCatalogPriceLookup>({});
  const [catalogStockLookup, setCatalogStockLookup] =
    useState<TicketCatalogStockLookup>({});
  const [valueSummary, setValueSummary] = useState<TicketValueSummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const debounceTimersRef = useRef<
    Record<number, ReturnType<typeof setTimeout>>
  >({});
  const abortControllersRef = useRef<Record<number, AbortController | null>>(
    {},
  );
  const latestSearchByLineRef = useRef<Record<number, string>>({});

  const quantitySymbol =
    draft.type === "SUPPLY"
      ? "+"
      : draft.type === "ORDER" || draft.type === "SPOILAGE"
        ? "-"
        : null;
  const hasUnsavedChanges = useMemo(() => {
    if (draft.type !== INITIAL_DRAFT.type) return true;
    if (draft.note.trim().length > 0) return true;
    if (draft.lines.length !== 1) return true;

    const firstLine = draft.lines[0];
    if (!firstLine) return false;

    return Boolean(
      firstLine.catalogItemId.trim() ||
        firstLine.catalogSearch.trim() ||
        firstLine.countDelta.trim(),
    );
  }, [draft]);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }),
    [],
  );

  function clearValueSummary() {
    setValueSummary(null);
  }

  function updateLine(
    localId: number,
    field: keyof Omit<TicketLineDraft, "localId">,
    value: string,
  ) {
    clearValueSummary();
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.localId === localId ? { ...line, [field]: value } : line,
      ),
    }));
  }

  function addLine() {
    clearValueSummary();
    setDraft((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        {
          localId: nextLineId,
          catalogItemId: "",
          catalogSearch: "",
          countDelta: "",
        },
      ],
    }));
    setNextLineId((prev) => prev + 1);
  }

  function removeLine(localId: number) {
    clearValueSummary();
    if (debounceTimersRef.current[localId]) {
      clearTimeout(debounceTimersRef.current[localId]);
      delete debounceTimersRef.current[localId];
    }

    if (abortControllersRef.current[localId]) {
      abortControllersRef.current[localId]?.abort();
      delete abortControllersRef.current[localId];
    }

    delete latestSearchByLineRef.current[localId];
    setLineSuggestions((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
    setIsSearchingLine((prev) => {
      const next = { ...prev };
      delete next[localId];
      return next;
    });
    if (activeSuggestionLineId === localId) {
      setActiveSuggestionLineId(null);
    }

    setDraft((prev) => {
      if (prev.lines.length <= 1) return prev;
      return {
        ...prev,
        lines: prev.lines.filter((line) => line.localId !== localId),
      };
    });
  }

  async function fetchLineSuggestions(localId: number, query: string) {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
      setIsSearchingLine((prev) => ({ ...prev, [localId]: false }));
      return;
    }

    abortControllersRef.current[localId]?.abort();
    const controller = new AbortController();
    abortControllersRef.current[localId] = controller;
    setIsSearchingLine((prev) => ({ ...prev, [localId]: true }));

    try {
      const params = new URLSearchParams({
        pageSize: "10",
        offset: "0",
        query: trimmedQuery,
      });

      const response = await fetch(`/api/catalog/staff?${params.toString()}`, {
        cache: "no-store",
        signal: controller.signal,
      });

      if (!response.ok) {
        setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
        return;
      }

      const payload = (await response.json()) as StaffCatalogResponse;
      const items = Array.isArray(payload?.data)
        ? payload.data
            .map((entry) => {
              if (!entry || typeof entry !== "object") return null;
              const item = entry as Record<string, unknown>;
              const id = Number(item.id);
              if (!Number.isFinite(id)) return null;

              return {
                id,
                sku: typeof item.sku === "string" ? item.sku : null,
                itemName:
                  typeof item.itemName === "string" ? item.itemName : "",
                category1:
                  typeof item.category1 === "string" ? item.category1 : null,
                price:
                  typeof item.price === "number"
                    ? item.price
                    : typeof item.price === "string"
                      ? Number.parseFloat(item.price)
                      : null,
                quantityInStock:
                  typeof item.quantityInStock === "number" &&
                  Number.isFinite(item.quantityInStock)
                    ? item.quantityInStock
                    : null,
              } satisfies TicketCatalogSuggestion;
            })
            .filter((item): item is TicketCatalogSuggestion => item !== null)
        : [];

      if (latestSearchByLineRef.current[localId] !== trimmedQuery) {
        return;
      }

      setCatalogPriceLookup((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (item.price !== null && Number.isFinite(item.price)) {
            next[String(item.id)] = {
              itemName: item.itemName,
              price: item.price,
            };
          }
        }
        return next;
      });
      setCatalogStockLookup((prev) => {
        const next = { ...prev };
        for (const item of items) {
          if (
            item.quantityInStock !== null &&
            Number.isFinite(item.quantityInStock)
          ) {
            next[String(item.id)] = {
              itemName: item.itemName,
              quantityInStock: item.quantityInStock,
            };
          }
        }
        return next;
      });
      setLineSuggestions((prev) => ({ ...prev, [localId]: items }));
    } catch {
      setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
    } finally {
      setIsSearchingLine((prev) => ({ ...prev, [localId]: false }));
    }
  }

  function handleCatalogSearchInput(localId: number, nextSearch: string) {
    clearValueSummary();
    updateLine(localId, "catalogSearch", nextSearch);
    updateLine(localId, "catalogItemId", "");
    setActiveSuggestionLineId(localId);

    const trimmedSearch = nextSearch.trim();
    latestSearchByLineRef.current[localId] = trimmedSearch;

    if (debounceTimersRef.current[localId]) {
      clearTimeout(debounceTimersRef.current[localId]);
    }

    if (!trimmedSearch) {
      setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
      setIsSearchingLine((prev) => ({ ...prev, [localId]: false }));
      return;
    }

    debounceTimersRef.current[localId] = setTimeout(() => {
      fetchLineSuggestions(localId, trimmedSearch);
    }, 220);
  }

  function selectCatalogSuggestion(
    localId: number,
    item: TicketCatalogSuggestion,
  ) {
    clearValueSummary();
    const selectedPrice = item.price;
    if (typeof selectedPrice === "number" && Number.isFinite(selectedPrice)) {
      setCatalogPriceLookup((prev) => ({
        ...prev,
        [String(item.id)]: {
          itemName: item.itemName,
          price: selectedPrice,
        },
      }));
    }
    const selectedStock = item.quantityInStock;
    if (typeof selectedStock === "number" && Number.isFinite(selectedStock)) {
      setCatalogStockLookup((prev) => ({
        ...prev,
        [String(item.id)]: {
          itemName: item.itemName,
          quantityInStock: selectedStock,
        },
      }));
    }
    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.localId === localId
          ? {
              ...line,
              catalogItemId: String(item.id),
              catalogSearch: item.sku
                ? `${item.itemName} (${item.sku})`
                : item.itemName,
            }
          : line,
      ),
    }));
    setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
    setActiveSuggestionLineId(null);
  }

  function clearCatalogSelection(localId: number) {
    clearValueSummary();
    if (debounceTimersRef.current[localId]) {
      clearTimeout(debounceTimersRef.current[localId]);
      delete debounceTimersRef.current[localId];
    }

    abortControllersRef.current[localId]?.abort();
    abortControllersRef.current[localId] = null;
    latestSearchByLineRef.current[localId] = "";

    setLineSuggestions((prev) => ({ ...prev, [localId]: [] }));
    setIsSearchingLine((prev) => ({ ...prev, [localId]: false }));
    if (activeSuggestionLineId === localId) {
      setActiveSuggestionLineId(null);
    }

    setDraft((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.localId === localId
          ? {
              ...line,
              catalogItemId: "",
              catalogSearch: "",
              countDelta: "",
            }
          : line,
      ),
    }));
  }

  function getStartedLines() {
    const firstLine = draft.lines[0];
    if (!firstLine) {
      return [];
    }

    const startedAdditionalLines = draft.lines
      .slice(1)
      .filter(
        (line) =>
          line.catalogItemId.trim() ||
          line.catalogSearch.trim() ||
          line.countDelta.trim(),
      );

    return [firstLine, ...startedAdditionalLines];
  }

  function validateLinesForValueCalculation(
    startedLines: TicketLineDraft[],
  ): string | null {
    if (startedLines.length === 0) {
      return "At least one ticket line is required.";
    }

    const emptyAdditionalLines = draft.lines
      .slice(1)
      .filter(
        (line) =>
          !line.catalogItemId.trim() &&
          !line.catalogSearch.trim() &&
          !line.countDelta.trim(),
      );
    if (emptyAdditionalLines.length > 0) {
      return "Remove empty ticket lines before calculating value.";
    }

    for (const [index, line] of startedLines.entries()) {
      if (!line.catalogItemId.trim()) {
        return index === 0
          ? "First ticket line is missing a selected catalog item."
          : "Each started ticket line must select a catalog item from search results.";
      }

      if (
        !/^\d+$/.test(line.countDelta.trim()) ||
        line.countDelta.trim() === "0"
      ) {
        return "Quantity must be a positive whole number.";
      }
    }

    const seenCatalogItemIds = new Set<string>();
    for (const line of startedLines) {
      const catalogItemId = line.catalogItemId.trim();
      if (seenCatalogItemIds.has(catalogItemId)) {
        return "Duplicate catalog items are not allowed across ticket lines.";
      }
      seenCatalogItemIds.add(catalogItemId);
    }

    for (const line of startedLines) {
      const catalogInfo = catalogPriceLookup[line.catalogItemId.trim()];
      if (!catalogInfo) {
        return "One or more selected catalog items are missing a price rate. Re-select the item and try again.";
      }
      if (!Number.isFinite(catalogInfo.price)) {
        return "One or more selected catalog items have an invalid price.";
      }
    }

    return null;
  }

  function handleCalculateValue() {
    setError(null);
    const startedLines = getStartedLines();
    const validationError = validateLinesForValueCalculation(startedLines);
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      const rows = startedLines.map((line) => {
        const catalogItemId = line.catalogItemId.trim();
        const quantity = Number.parseInt(line.countDelta.trim(), 10);
        const catalogInfo = catalogPriceLookup[catalogItemId];
        if (!catalogInfo) {
          throw new Error(
            "One or more selected catalog items are missing a price rate. Re-select the item and try again.",
          );
        }
        const priceRate = catalogInfo.price;
        const lineTotal = quantity * priceRate;

        return {
          localId: line.localId,
          catalogItemId,
          itemName: catalogInfo.itemName,
          quantity,
          priceRate,
          lineTotal,
        };
      });

      const totalAmount = rows.reduce((sum, row) => sum + row.lineTotal, 0);
      setValueSummary({ rows, totalAmount });
    } catch (calculateError) {
      setError(
        calculateError instanceof Error
          ? calculateError.message
          : "Unable to calculate ticket value.",
      );
      setValueSummary(null);
    }
  }

  function validateDraft(): string | null {
    if (!draft.type) return "Ticket type is required.";
    if (draft.lines.length === 0) {
      return "At least one ticket line is required.";
    }

    const firstLine = draft.lines[0];
    if (!firstLine.catalogItemId.trim()) {
      return "First ticket line is missing a selected catalog item.";
    }
    if (!firstLine.countDelta.trim()) {
      return "First ticket line is missing quantity.";
    }
    if (!/^\d+$/.test(firstLine.countDelta.trim())) {
      return "First ticket line quantity must be a positive whole number.";
    }
    if (firstLine.countDelta.trim() === "0") {
      return "First ticket line quantity cannot be zero.";
    }
    if (!draft.note.trim()) return "Notes are required.";

    const emptyAdditionalLines = draft.lines
      .slice(1)
      .filter(
        (line) =>
          !line.catalogItemId.trim() &&
          !line.catalogSearch.trim() &&
          !line.countDelta.trim(),
      );
    if (emptyAdditionalLines.length > 0) {
      return "Remove empty ticket lines before creating a ticket.";
    }

    const startedAdditionalLines = draft.lines
      .slice(1)
      .filter(
        (line) =>
          line.catalogItemId.trim() ||
          line.catalogSearch.trim() ||
          line.countDelta.trim(),
      );

    for (const line of startedAdditionalLines) {
      if (!line.catalogItemId.trim()) {
        return "Each started ticket line must select a catalog item from search results.";
      }
      if (!/^\d+$/.test(line.countDelta.trim())) {
        return "Each started ticket line quantity must be a positive whole number.";
      }
      if (line.countDelta.trim() === "0") {
        return "Quantity cannot be zero.";
      }
    }

    const startedLines = [firstLine, ...startedAdditionalLines];
    const seenCatalogItemIds = new Set<string>();
    for (const line of startedLines) {
      const catalogItemId = line.catalogItemId.trim();
      if (seenCatalogItemIds.has(catalogItemId)) {
        return "Duplicate catalog items are not allowed across ticket lines.";
      }
      seenCatalogItemIds.add(catalogItemId);
    }

    for (const line of startedLines) {
      // Preserve current rule that quantity inputs are absolute values.
      if (
        !/^\d+$/.test(line.countDelta.trim()) ||
        line.countDelta.trim() === "0"
      )
        return "Quantity must be a positive whole number.";
    }

    if (draft.type === "ORDER" || draft.type === "SPOILAGE") {
      for (const line of startedLines) {
        const catalogItemId = line.catalogItemId.trim();
        const quantityToRemove = Number.parseInt(line.countDelta.trim(), 10);
        const stockInfo = catalogStockLookup[catalogItemId];

        if (!stockInfo) {
          return "Unable to verify stock for one or more selected catalog items. Re-select the item and try again.";
        }

        if (quantityToRemove > stockInfo.quantityInStock) {
          return `"${stockInfo.itemName}" only has ${stockInfo.quantityInStock} in stock, but ${quantityToRemove} was entered.`;
        }
      }
    }

    return null;
  }

  function handleCreateTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const validationError = validateDraft();
    if (validationError) {
      setError(validationError);
      return;
    }

    setShowCreateConfirm(true);
  }

  async function confirmCreateTicket() {
    setShowCreateConfirm(false);
    setError(null);
    setIsCreatingTicket(true);

    try {
      const creatorEmail = accountEmail.trim().toLowerCase();
      if (!creatorEmail) {
        throw new Error("You must be signed in to create a ticket.");
      }

      const payload = {
        type: draft.type,
        note: draft.note.trim(),
        createdByEmail: creatorEmail,
        lines: draft.lines.map((line) => ({
          catalogItemId: Number.parseInt(line.catalogItemId.trim(), 10),
          countDelta: Number.parseInt(line.countDelta.trim(), 10),
        })),
      };

      const response = await fetch("/api/tickets/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as CreateTicketApiResponse;
      if (!response.ok || result.success === false) {
        const message =
          typeof result.error === "string"
            ? result.error
            : `Ticket creation failed (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const ticketId =
        typeof result.data?.ticketId === "number" ? result.data.ticketId : null;
      setCreateResult({
        success: true,
        message: ticketId
          ? `Ticket created successfully. New ticket ID: ${ticketId}.`
          : "Ticket created successfully.",
      });
      setDraft(INITIAL_DRAFT);
      setNextLineId(2);
      setLineSuggestions({});
      setIsSearchingLine({});
      setActiveSuggestionLineId(null);
      setValueSummary(null);
      setShowClearConfirm(false);
      setError(null);
    } catch (createError) {
      setCreateResult({
        success: false,
        message:
          createError instanceof Error
            ? createError.message
            : "Ticket creation failed. Please try again.",
      });
    } finally {
      setIsCreatingTicket(false);
      setShowCreateResult(true);
    }
  }

  function clearDraftState() {
    setDraft(INITIAL_DRAFT);
    setNextLineId(2);
    setLineSuggestions({});
    setIsSearchingLine({});
    setActiveSuggestionLineId(null);
    setValueSummary(null);
    setShowCreateConfirm(false);
    setShowClearConfirm(false);
    setShowCreateResult(false);
    setCreateResult(null);
    setError(null);
  }

  function handleClearButtonClick() {
    if (!hasUnsavedChanges) {
      clearDraftState();
      return;
    }

    setShowClearConfirm(true);
  }

  useEffect(() => {
    const debounceTimers = debounceTimersRef.current;
    const abortControllers = abortControllersRef.current;

    return () => {
      Object.values(debounceTimers).forEach((timerId) => clearTimeout(timerId));
      Object.values(abortControllers).forEach((controller) =>
        controller?.abort(),
      );
    };
  }, []);

  return (
    <div>
      <div className="staffTitle">Create Ticket</div>
      <div className="staffSubtitle">
        Stage inventory updates before database commit using the Ticket and
        TicketLine structure.
      </div>

      <div className="staffGrid">
        <div className="staffCard col12">
          <form className="ticket-create-form" onSubmit={handleCreateTicket}>
            <div className="ticket-create-grid">
              <label className="ticket-create-field">
                <span className="ticket-create-label">Ticket Type</span>
                <select
                  className="ticket-create-input"
                  value={draft.type}
                  onChange={(e) => {
                    clearValueSummary();
                    setDraft((prev) => ({
                      ...prev,
                      type: e.target.value as TicketType,
                    }));
                  }}
                >
                  {TICKET_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="ticket-lines-panel">
              <div className="ticket-lines-header">
                <div className="staffCardLabel ticket-lines-title">
                  Ticket Entries
                </div>
                <button
                  type="button"
                  className="ticket-add-line-btn"
                  onClick={addLine}
                  aria-label="Add ticket entry"
                  title="Add ticket entry"
                >
                  +
                </button>
              </div>

              <div className="ticket-lines-grid ticket-lines-grid--header">
                <div>Catalog Item</div>
                <div className="ticket-quantity-header">
                  <span>Quantity</span>
                  {quantitySymbol && (
                    <span
                      className={`ticket-quantity-sign ${quantitySymbol === "+" ? "ticket-quantity-sign--positive" : ""}`}
                      aria-label="Quantity effect"
                    >
                      {quantitySymbol}
                    </span>
                  )}
                </div>
                <div>Action</div>
              </div>

              {draft.lines.map((line) => (
                <div key={line.localId} className="ticket-lines-grid">
                  <div className="ticket-item-search">
                    <input
                      className="ticket-create-input ticket-item-search-input"
                      type="text"
                      value={line.catalogSearch}
                      onChange={(e) =>
                        handleCatalogSearchInput(line.localId, e.target.value)
                      }
                      onFocus={() => setActiveSuggestionLineId(line.localId)}
                      onBlur={() => {
                        setTimeout(() => {
                          setActiveSuggestionLineId((current) =>
                            current === line.localId ? null : current,
                          );
                        }, 120);
                      }}
                      placeholder="Search by SKU or Name"
                    />
                    {line.catalogItemId.trim().length > 0 && (
                      <button
                        type="button"
                        className="ticket-item-search-clear-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => clearCatalogSelection(line.localId)}
                        aria-label="Clear selected catalog item"
                        title="Clear selected catalog item"
                      >
                        x
                      </button>
                    )}

                    {line.catalogSearch.trim().length > 0 &&
                      activeSuggestionLineId === line.localId && (
                        <div
                          className="ticket-item-suggestions"
                          role="listbox"
                          aria-label="Catalog item suggestions"
                        >
                          {isSearchingLine[line.localId] ? (
                            <div className="ticket-item-suggestion-empty">
                              Searching...
                            </div>
                          ) : (lineSuggestions[line.localId] || []).length ===
                            0 ? (
                            <div className="ticket-item-suggestion-empty">
                              No matching items
                            </div>
                          ) : (
                            (lineSuggestions[line.localId] || []).map(
                              (item) => (
                                <button
                                  key={item.id}
                                  type="button"
                                  className="ticket-item-suggestion-btn"
                                  onMouseDown={(e) => e.preventDefault()}
                                  onClick={() =>
                                    selectCatalogSuggestion(line.localId, item)
                                  }
                                >
                                  <span className="ticket-item-suggestion-name">
                                    {item.itemName}
                                  </span>
                                  <span className="ticket-item-suggestion-meta">
                                    {item.sku ? `SKU ${item.sku}` : "SKU N/A"}
                                    {item.category1
                                      ? ` | ${item.category1}`
                                      : ""}
                                  </span>
                                </button>
                              ),
                            )
                          )}
                        </div>
                      )}
                  </div>
                  <div className="ticket-quantity-cell">
                    <input
                      className="ticket-create-input"
                      type="number"
                      min={1}
                      step={1}
                      value={line.countDelta}
                      onChange={(e) =>
                        updateLine(line.localId, "countDelta", e.target.value)
                      }
                      placeholder="Enter quantity"
                      disabled={!line.catalogItemId}
                    />
                  </div>
                  <button
                    type="button"
                    className="ticket-line-remove-btn"
                    onClick={() => removeLine(line.localId)}
                    disabled={draft.lines.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {valueSummary && (
              <div className="ticket-value-summary">
                <div className="staffCardLabel ticket-value-summary__title">
                  Calculated Ticket Value
                </div>
                <div className="ticket-value-summary__table">
                  <div className="ticket-value-summary__row ticket-value-summary__row--header">
                    <div>Catalog Item</div>
                    <div>Qty</div>
                    <div>Price Rate</div>
                    <div>Line Total</div>
                  </div>
                  {valueSummary.rows.map((row) => (
                    <div
                      key={row.localId}
                      className="ticket-value-summary__row"
                    >
                      <div>{row.itemName}</div>
                      <div>{row.quantity}</div>
                      <div>{currencyFormatter.format(row.priceRate)}</div>
                      <div>{currencyFormatter.format(row.lineTotal)}</div>
                    </div>
                  ))}
                </div>
                <div className="ticket-value-summary__overall">
                  Total Amount:{" "}
                  {currencyFormatter.format(valueSummary.totalAmount)}
                </div>
              </div>
            )}

            <label className="ticket-create-field">
              <span className="ticket-create-label">Notes</span>
              <textarea
                className="ticket-create-textarea"
                rows={5}
                value={draft.note}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, note: e.target.value }))
                }
                placeholder="Add context for approvers/reviewers."
              />
            </label>

            {error && <div className="ticket-create-status error">{error}</div>}

            <div className="item-create-actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={handleClearButtonClick}
              >
                Clear
              </button>
              <button
                type="button"
                className="staff-dev-pill"
                onClick={handleCalculateValue}
              >
                Calculate Value
              </button>
              <button
                type="submit"
                className="staff-dev-pill staff-dev-pill--ready"
              >
                Create Ticket
              </button>
            </div>
          </form>
        </div>
      </div>

      {showCreateConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Create Ticket"
          className="item-category-modal"
        >
          <div className="item-category-modal__content ticket-confirm-modal__content">
            <div className="item-category-modal__title ticket-confirm-modal__title">
              Confirm New Ticket
            </div>
            <p className="category-mgmt-confirm-modal__message ticket-confirm-modal__message">
              Create this ticket with the current entries and notes?
            </p>

            <div className="item-category-form__actions ticket-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => setShowCreateConfirm(false)}
                disabled={isCreatingTicket}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={confirmCreateTicket}
                disabled={isCreatingTicket}
              >
                {isCreatingTicket ? "Creating..." : "Confirm Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateResult && createResult && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Ticket Creation Result"
          className="item-category-modal"
        >
          <div className="item-category-modal__content ticket-confirm-modal__content">
            <div
              className={`item-category-modal__title ticket-confirm-modal__title ticket-result-modal__title ${createResult.success ? "ticket-result-modal__title--success" : "ticket-result-modal__title--error"}`}
            >
              {createResult.success
                ? "Ticket Created"
                : "Ticket Creation Failed"}
            </div>
            <p className="category-mgmt-confirm-modal__message ticket-confirm-modal__message">
              {createResult.message}
            </p>

            <div className="item-category-form__actions ticket-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => {
                  setShowCreateResult(false);
                  setCreateResult(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Clear Changes"
          className="item-category-modal"
        >
          <div className="item-category-modal__content ticket-confirm-modal__content">
            <div className="item-category-modal__title ticket-confirm-modal__title">
              Confirm Clear Changes
            </div>
            <p className="category-mgmt-confirm-modal__message ticket-confirm-modal__message">
              Are you sure you want to clear all unsaved changes?
            </p>

            <div className="item-category-form__actions ticket-confirm-modal__actions">
              <button
                type="button"
                className="staff-dev-pill"
                onClick={() => setShowClearConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="staff-dev-pill staff-dev-pill--ready"
                onClick={clearDraftState}
              >
                Confirm Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
