"use client";

export type TicketType = "ORDER" | "SUPPLY" | "SPOILAGE";

export type TicketPreviewLine = {
  id: number;
  catalogItemId: number;
  itemName: string;
  sku: string | null;
  countDelta: number;
  priceRate: number | null;
};

export type TicketPreview = {
  id: number;
  type: TicketType;
  note: string;
  createdAt: string;
  createdAtIso: string;
  createdByAccountId: number;
  authorName: string;
  authorEmail: string | null;
  lineCount: number;
  itemCount: number;
  netQuantityDelta: number;
  lines: TicketPreviewLine[];
};

function formatSignedQuantity(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export default function TicketPreviewCard({
  ticket,
}: {
  ticket: TicketPreview;
}) {
  const headerColorClass =
    ticket.type === "SUPPLY"
      ? "ticketPreviewHeader--supply"
      : ticket.type === "SPOILAGE"
        ? "ticketPreviewHeader--spoilage"
        : "ticketPreviewHeader--order";
  const badgeColorClass =
    ticket.type === "SUPPLY"
      ? "ticketPreviewTypeBadge--supply"
      : ticket.type === "SPOILAGE"
        ? "ticketPreviewTypeBadge--spoilage"
        : "ticketPreviewTypeBadge--order";
  const noteText = ticket.note.trim() || "No notes provided for this ticket.";
  const hasMissingPriceRate = ticket.lines.some(
    (line) => line.priceRate === null,
  );
  const totalAmount = ticket.lines.reduce((sum, line) => {
    if (line.priceRate === null) return sum;
    return sum + Math.abs(line.countDelta) * line.priceRate;
  }, 0);

  return (
    <article className="staffTaskCard staffTicketCard">
      <div className={`ticketPreviewHeader ${headerColorClass}`}>
        <div className="ticketPreviewHeaderRow">
          <div className="ticketPreviewHeaderMeta">
            <span className="ticketPreviewHeaderTicketId">
              Ticket #{ticket.id}
            </span>
            <span
              className="ticketPreviewHeaderMetaSeparator"
              aria-hidden="true"
            >
              {"\u2022"}
            </span>
            <span className="ticketPreviewHeaderAuthor">
              {ticket.authorName}
            </span>
            <span
              className="ticketPreviewHeaderMetaSeparator"
              aria-hidden="true"
            >
              {"\u2022"}
            </span>
            <span className="ticketPreviewHeaderDate">{ticket.createdAt}</span>
          </div>

          <div className="ticketPreviewHeaderActions">
            <div className={`ticketPreviewTypeBadge ${badgeColorClass}`}>
              {ticket.type}
            </div>
          </div>
        </div>
      </div>

      <div className="staffTaskDivider" />

      <div className="staffTaskBody ticketPreviewBody">
        <div className="ticketPreviewNotesPanel">
          <div className="ticketPreviewNotesHeader">
            <div className="ticketPreviewNotesLabel">Notes</div>
          </div>
          <div className="ticketPreviewNotesBody">
            <div className="ticketPreviewNotesText">{noteText}</div>
          </div>
        </div>

        <div className="ticketPreviewItemsPanel">
          <div className="ticketPreviewItemsHeader">
            <span>Item</span>
            <span>Price Rate</span>
            <span>Line Total</span>
            <span>Count</span>
          </div>

          {ticket.lines.length === 0 ? (
            <div className="ticketPreviewItemsEmpty">
              No ticket line items were found.
            </div>
          ) : null}

          {ticket.lines.map((line) => (
            <div key={line.id} className="ticketPreviewItemRow">
              <div className="ticketPreviewItemDetails">
                <span className="ticketPreviewItemName">{line.itemName}</span>
                {line.sku ? (
                  <span className="ticketPreviewItemSku">SKU: {line.sku}</span>
                ) : null}
              </div>

              <span className="ticketPreviewItemRate">
                {line.priceRate === null
                  ? "N/A"
                  : formatCurrency(line.priceRate)}
              </span>

              <span className="ticketPreviewItemLineTotal">
                {line.priceRate === null
                  ? "N/A"
                  : formatCurrency(Math.abs(line.countDelta) * line.priceRate)}
              </span>

              <span
                className={`ticketPreviewItemCount ${
                  line.countDelta >= 0
                    ? "ticketPreviewItemCount--positive"
                    : "ticketPreviewItemCount--negative"
                }`}
              >
                {formatSignedQuantity(line.countDelta)}
              </span>
            </div>
          ))}

          {ticket.lines.length > 0 ? (
            <div className="ticketPreviewItemsTotalRow">
              <span className="ticketPreviewItemsTotalLabel">Total Amount</span>
              <span className="ticketPreviewItemsTotalValue">
                {hasMissingPriceRate ? "N/A" : formatCurrency(totalAmount)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
