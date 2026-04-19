"use client";

import { useCallback, useEffect, useState } from "react";
import TicketPreviewCard, {
  TicketPreviewLine,
  TicketPreview,
  TicketType,
} from "@/app/components/TicketPreviewCard";

type TicketFeedResponse = {
  success?: unknown;
  tickets?: unknown;
  summary?: unknown;
  error?: unknown;
};
type TicketSummary = {
  totalTickets: number;
  supplyTickets: number;
  orderTickets: number;
  spoilageTickets: number;
};

function parseTicketType(value: unknown): TicketType {
  if (value === "SUPPLY" || value === "SPOILAGE") {
    return value;
  }

  return "ORDER";
}

function formatTicketDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "Unknown date";
  }

  return value;
}

function parseTickets(payload: unknown): TicketPreview[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return null;
      }

      const ticket = entry as Record<string, unknown>;
      const id = Number(ticket.id);

      if (!Number.isInteger(id) || id <= 0) {
        return null;
      }

      const createdByAccountId = Number(ticket.createdByAccountId);
      const lineCount = Number(ticket.lineCount);
      const itemCount = Number(ticket.itemCount);
      const netQuantityDelta = Number(ticket.netQuantityDelta);
      const lines = Array.isArray(ticket.lines)
        ? ticket.lines
            .map((rawLine) => {
              if (!rawLine || typeof rawLine !== "object") return null;

              const line = rawLine as Record<string, unknown>;
              const lineId = Number(line.id);
              const catalogItemId = Number(line.catalogItemId);
              const countDelta = Number(line.countDelta);
              const priceRate =
                typeof line.priceRate === "number"
                  ? line.priceRate
                  : typeof line.priceRate === "string"
                    ? Number.parseFloat(line.priceRate)
                    : Number.NaN;

              if (!Number.isInteger(lineId) || lineId <= 0) return null;
              if (!Number.isInteger(catalogItemId) || catalogItemId <= 0) {
                return null;
              }
              if (!Number.isFinite(countDelta)) return null;

              return {
                id: lineId,
                catalogItemId,
                itemName:
                  typeof line.itemName === "string" && line.itemName.trim()
                    ? line.itemName
                    : `Item #${catalogItemId}`,
                sku: typeof line.sku === "string" ? line.sku : null,
                countDelta,
                priceRate: Number.isFinite(priceRate) ? priceRate : null,
              } satisfies TicketPreviewLine;
            })
            .filter((line): line is TicketPreviewLine => line !== null)
        : [];

      return {
        id,
        type: parseTicketType(ticket.type),
        notes: typeof ticket.notes === "string" ? ticket.notes : "",
        createdAt: formatTicketDate(ticket.createdAt),
        createdAtIso:
          typeof ticket.createdAtIso === "string" ? ticket.createdAtIso : "",
        createdByAccountId:
          Number.isInteger(createdByAccountId) && createdByAccountId > 0
            ? createdByAccountId
            : 0,
        authorName:
          typeof ticket.authorName === "string" && ticket.authorName.trim()
            ? ticket.authorName
            : "Unknown author",
        authorEmail:
          typeof ticket.authorEmail === "string" ? ticket.authorEmail : null,
        lineCount: Number.isFinite(lineCount) ? lineCount : 0,
        itemCount: Number.isFinite(itemCount) ? itemCount : 0,
        netQuantityDelta: Number.isFinite(netQuantityDelta)
          ? netQuantityDelta
          : 0,
        lines,
      } satisfies TicketPreview;
    })
    .filter((ticket): ticket is TicketPreview => ticket !== null);
}

function parseSummary(payload: unknown): TicketSummary | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const summary = payload as Record<string, unknown>;
  const totalTickets = Number(summary.totalTickets);
  const supplyTickets = Number(summary.supplyTickets);
  const orderTickets = Number(summary.orderTickets);
  const spoilageTickets = Number(summary.spoilageTickets);

  if (
    !Number.isFinite(totalTickets) ||
    !Number.isFinite(supplyTickets) ||
    !Number.isFinite(orderTickets) ||
    !Number.isFinite(spoilageTickets)
  ) {
    return null;
  }

  return {
    totalTickets,
    supplyTickets,
    orderTickets,
    spoilageTickets,
  };
}

export default function TicketDashboardClient() {
  const [tickets, setTickets] = useState<TicketPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<TicketSummary>({
    totalTickets: 0,
    supplyTickets: 0,
    orderTickets: 0,
    spoilageTickets: 0,
  });
  const [selectedTicketType, setSelectedTicketType] =
    useState<TicketType | null>(null);

  const loadTickets = useCallback(async (typeFilter: TicketType | null) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (typeFilter) {
        params.set("type", typeFilter);
      }
      const path = params.size
        ? `/api/tickets/staff?${params.toString()}`
        : "/api/tickets/staff";

      const response = await fetch(path, {
        cache: "no-store",
      });

      const payload = (await response.json()) as TicketFeedResponse;

      if (!response.ok || payload.success === false) {
        const message =
          typeof payload.error === "string"
            ? payload.error
            : `Failed to load tickets (HTTP ${response.status}).`;
        throw new Error(message);
      }

      const nextTickets = parseTickets(payload.tickets);
      const nextSummary = parseSummary(payload.summary);
      setTickets(nextTickets);
      if (nextSummary) {
        setSummary(nextSummary);
      } else {
        setSummary({
          totalTickets: nextTickets.length,
          supplyTickets: nextTickets.filter(
            (ticket) => ticket.type === "SUPPLY",
          ).length,
          orderTickets: nextTickets.filter((ticket) => ticket.type === "ORDER")
            .length,
          spoilageTickets: nextTickets.filter(
            (ticket) => ticket.type === "SPOILAGE",
          ).length,
        });
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load tickets.",
      );
      setTickets([]);
      setSummary({
        totalTickets: 0,
        supplyTickets: 0,
        orderTickets: 0,
        spoilageTickets: 0,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  function toggleTicketTypeFilter(type: TicketType) {
    setSelectedTicketType((currentType) =>
      currentType === type ? null : type,
    );
  }

  useEffect(() => {
    void loadTickets(selectedTicketType);
  }, [loadTickets, selectedTicketType]);

  const supplyCount = summary.supplyTickets;
  const orderCount = summary.orderTickets;
  const spoilageCount = summary.spoilageTickets;

  return (
    <div>
      <div className="staffTitle">Ticket Dashboard</div>
      <div className="staffSubtitle">
        Dynamically loaded ticket previews for reviewing ticket history and
        inventory movement.
        {selectedTicketType ? ` Filter: ${selectedTicketType}.` : ""}
      </div>

      <div className="staffTaskSummaryRow">
        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Total Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {summary.totalTickets}
          </div>
          <div className="staffCardHint">
            Current tickets in the preview feed.
          </div>
        </div>

        <button
          type="button"
          className={`staffCard staffTaskSummaryCard staffTicketTypeCountCard ${
            selectedTicketType === "SUPPLY"
              ? "staffTicketTypeCountCard--selected"
              : ""
          }`}
          onClick={() => toggleTicketTypeFilter("SUPPLY")}
          aria-pressed={selectedTicketType === "SUPPLY"}
          disabled={isLoading}
        >
          <div className="staffCardLabel">Supply Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {supplyCount}
          </div>
          <div className="staffCardHint">Supply tickets use green headers.</div>
        </button>

        <button
          type="button"
          className={`staffCard staffTaskSummaryCard staffTicketTypeCountCard ${
            selectedTicketType === "ORDER"
              ? "staffTicketTypeCountCard--selected"
              : ""
          }`}
          onClick={() => toggleTicketTypeFilter("ORDER")}
          aria-pressed={selectedTicketType === "ORDER"}
          disabled={isLoading}
        >
          <div className="staffCardLabel">Order Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {orderCount}
          </div>
          <div className="staffCardHint">Order tickets use red headers.</div>
        </button>

        <button
          type="button"
          className={`staffCard staffTaskSummaryCard staffTicketTypeCountCard ${
            selectedTicketType === "SPOILAGE"
              ? "staffTicketTypeCountCard--selected"
              : ""
          }`}
          onClick={() => toggleTicketTypeFilter("SPOILAGE")}
          aria-pressed={selectedTicketType === "SPOILAGE"}
          disabled={isLoading}
        >
          <div className="staffCardLabel">Spoilage Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {spoilageCount}
          </div>
          <div className="staffCardHint">
            Spoilage tickets use orange headers.
          </div>
        </button>
      </div>

      <div className="staffTaskLegendRow">
        <div className="staffTaskLegend compact">
          <div className="staffTaskLegendItem">
            <span className="ticketPreviewTypeSwatch ticketPreviewTypeSwatch--supply" />
            Supply
          </div>
          <div className="staffTaskLegendItem">
            <span className="ticketPreviewTypeSwatch ticketPreviewTypeSwatch--order" />
            Order
          </div>
          <div className="staffTaskLegendItem">
            <span className="ticketPreviewTypeSwatch ticketPreviewTypeSwatch--spoilage" />
            Spoilage
          </div>
        </div>

        <div className="staffTaskLegendActions">
          <button
            type="button"
            className="staffActionButton"
            onClick={() => void loadTickets(selectedTicketType)}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="item-category-form__status item-category-form__status--error">
          {error}
        </div>
      ) : null}

      <div className="staffTaskGroups">
        <div className="staffEmployeeGroup staffTicketPane">
          <div className="staffEmployeeGroupHeader">
            <div>
              <div className="staffEmployeeGroupTitle">Ticket Previews</div>
              <div className="staffEmployeeGroupSubtitle">
                Tickets are loaded from the staff ticket API and shown as
                compact previews.
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="staffCardHint">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="staffCardHint">No tickets found.</div>
          ) : (
            <div className="staffEmployeeTaskGrid">
              {tickets.map((ticket) => (
                <TicketPreviewCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
