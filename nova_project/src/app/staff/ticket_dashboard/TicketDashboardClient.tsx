"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TicketPreviewCard, {
  TicketPreviewLine,
  TicketPreview,
  TicketType,
} from "@/app/components/TicketPreviewCard";

type TicketFeedResponse = {
  success?: unknown;
  tickets?: unknown;
  error?: unknown;
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
        note: typeof ticket.note === "string" ? ticket.note : "",
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

export default function TicketDashboardClient() {
  const [tickets, setTickets] = useState<TicketPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tickets/staff", {
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
      setTickets(nextTickets);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load tickets.",
      );
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  const totalLineCount = useMemo(
    () => tickets.reduce((sum, ticket) => sum + ticket.lineCount, 0),
    [tickets],
  );
  const supplyCount = useMemo(
    () => tickets.filter((ticket) => ticket.type === "SUPPLY").length,
    [tickets],
  );
  const orderCount = useMemo(
    () => tickets.filter((ticket) => ticket.type === "ORDER").length,
    [tickets],
  );
  const spoilageCount = useMemo(
    () => tickets.filter((ticket) => ticket.type === "SPOILAGE").length,
    [tickets],
  );

  return (
    <div>
      <div className="staffTitle">Ticket Dashboard</div>
      <div className="staffSubtitle">
        Dynamically loaded ticket previews for reviewing ticket history and
        inventory movement.
      </div>

      <div className="staffTaskSummaryRow">
        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Total Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {tickets.length}
          </div>
          <div className="staffCardHint">
            Current tickets in the preview feed.
          </div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Supply Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {supplyCount}
          </div>
          <div className="staffCardHint">Supply tickets use green headers.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Order Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {orderCount}
          </div>
          <div className="staffCardHint">Order tickets use red headers.</div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Spoilage Tickets</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {spoilageCount}
          </div>
          <div className="staffCardHint">
            Spoilage tickets use orange headers.
          </div>
        </div>

        <div className="staffCard staffTaskSummaryCard">
          <div className="staffCardLabel">Total Ticket Lines</div>
          <div className="staffCardValue staffTaskSummaryValue">
            {totalLineCount}
          </div>
          <div className="staffCardHint">
            Combined line items across tickets.
          </div>
        </div>
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
            onClick={() => void loadTickets()}
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
