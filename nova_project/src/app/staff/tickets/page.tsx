"use client";

import { useCallback, useEffect, useState } from "react";

type TicketLine = {
  id: number;
  catalogItemId: number;
  itemName: string;
  sku: string | null;
  countDelta: number;
};

type StaffTicketRecord = {
  id: number;
  type: string;
  note: string | null;
  createdAt: string;
  creatorName: string;
  lines: TicketLine[];
  entryCount: number;
  netQuantityDelta: number;
  absoluteQuantityMoved: number;
};

type TicketsApiResponse = {
  success?: boolean;
  data?: StaffTicketRecord[];
  totalCount?: number;
  pageSize?: number;
  offset?: number;
  error?: string;
};

const DEFAULT_PAGE_SIZE = 10;

const TYPE_BADGE_CLASS: Record<string, string> = {
  ORDER: "ticket-view-type-badge ticket-view-type-badge--order",
  SUPPLY: "ticket-view-type-badge ticket-view-type-badge--supply",
  SPOILAGE: "ticket-view-type-badge ticket-view-type-badge--spoilage",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDelta(delta: number): string {
  if (delta > 0) return `+${delta}`;
  return String(delta);
}

function TicketCard({ ticket }: { ticket: StaffTicketRecord }) {
  return (
    <div className="ticket-view-card">
      <div className="ticket-view-card-header">
        <div className="ticket-view-card-title">
          <span className="ticket-view-card-id">#{ticket.id}</span>
          <span
            className={
              TYPE_BADGE_CLASS[ticket.type] || "ticket-view-type-badge"
            }
          >
            {ticket.type}
          </span>
        </div>
        <div className="ticket-view-card-meta">
          <span className="ticket-view-creator">{ticket.creatorName}</span>
          <span className="ticket-view-date">
            {formatDate(ticket.createdAt)}
          </span>
        </div>
      </div>

      {ticket.note && (
        <div className="ticket-view-card-note">{ticket.note}</div>
      )}

      <div className="ticket-view-lines">
        <div className="ticket-view-line ticket-view-line--header">
          <span>Item</span>
          <span>SKU</span>
          <span className="ticket-view-line-qty">Qty Change</span>
        </div>
        {ticket.lines.map((line) => (
          <div key={line.id} className="ticket-view-line">
            <span className="ticket-view-line-name">{line.itemName}</span>
            <span className="ticket-view-line-sku">
              {line.sku || "N/A"}
            </span>
            <span
              className={`ticket-view-line-qty ${line.countDelta >= 0 ? "ticket-view-line-qty--positive" : "ticket-view-line-qty--negative"}`}
            >
              {formatDelta(line.countDelta)}
            </span>
          </div>
        ))}
      </div>

      <div className="ticket-view-summary">
        <div className="ticket-view-summary-item">
          <span className="ticket-view-summary-label">Entries</span>
          <span className="ticket-view-summary-value">
            {ticket.entryCount}
          </span>
        </div>
        <div className="ticket-view-summary-item">
          <span className="ticket-view-summary-label">Net Delta</span>
          <span
            className={`ticket-view-summary-value ${ticket.netQuantityDelta >= 0 ? "ticket-view-line-qty--positive" : "ticket-view-line-qty--negative"}`}
          >
            {formatDelta(ticket.netQuantityDelta)}
          </span>
        </div>
        <div className="ticket-view-summary-item">
          <span className="ticket-view-summary-label">Total Moved</span>
          <span className="ticket-view-summary-value">
            {ticket.absoluteQuantityMoved}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StaffTicketsPage() {
  const [tickets, setTickets] = useState<StaffTicketRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async (pageOffset: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        pageSize: String(DEFAULT_PAGE_SIZE),
        offset: String(pageOffset),
      });

      const res = await fetch(`/api/tickets/staff?${params.toString()}`, {
        cache: "no-store",
      });

      const body = (await res.json()) as TicketsApiResponse;

      if (!res.ok || body.success === false) {
        throw new Error(
          body.error || `Failed to fetch tickets (HTTP ${res.status}).`,
        );
      }

      setTickets(body.data || []);
      setTotalCount(body.totalCount || 0);
      setOffset(pageOffset);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load tickets.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(0);
  }, [fetchTickets]);

  const hasPrev = offset > 0;
  const hasNext = offset + DEFAULT_PAGE_SIZE < totalCount;

  return (
    <div>
      <div className="staffTitle">View Tickets</div>
      <div className="staffSubtitle">
        Browse previously created inventory tickets. Sorted newest first.
      </div>

      {isLoading && (
        <div className="ticket-view-status ticket-view-status--loading">
          Loading tickets...
        </div>
      )}

      {error && (
        <div className="ticket-view-status ticket-view-status--error">
          {error}
        </div>
      )}

      {!isLoading && !error && tickets.length === 0 && (
        <div className="ticket-view-status ticket-view-status--empty">
          No tickets found.
        </div>
      )}

      {!isLoading && !error && tickets.length > 0 && (
        <>
          <div className="ticket-view-list">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          <div className="ticket-view-pagination">
            <button
              type="button"
              className="staff-dev-pill"
              disabled={!hasPrev}
              onClick={() => fetchTickets(offset - DEFAULT_PAGE_SIZE)}
            >
              Previous
            </button>
            <span className="ticket-view-pagination-info">
              {offset + 1} &ndash;{" "}
              {Math.min(offset + DEFAULT_PAGE_SIZE, totalCount)} of{" "}
              {totalCount}
            </span>
            <button
              type="button"
              className="staff-dev-pill"
              disabled={!hasNext}
              onClick={() => fetchTickets(offset + DEFAULT_PAGE_SIZE)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
