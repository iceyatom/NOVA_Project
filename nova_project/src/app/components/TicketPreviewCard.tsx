"use client";

export type TicketType = "ORDER" | "SUPPLY" | "SPOILAGE";

export type TicketPreviewLine = {
  id: number;
  catalogItemId: number;
  itemName: string;
  sku: string | null;
  countDelta: number;
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

export default function TicketPreviewCard({
  ticket,
  isCollapsed,
  onToggleCollapse,
}: {
  ticket: TicketPreview;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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

  return (
    <article
      className={`staffTaskCard staffTicketCard ${isCollapsed ? "isCollapsed" : ""}`}
    >
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

            <button
              type="button"
              className="staffTaskCollapseButton ticketPreviewCollapseButton ticketPreviewCollapseButton--header"
              onClick={onToggleCollapse}
              aria-label={
                isCollapsed
                  ? "Expand ticket preview"
                  : "Collapse ticket preview"
              }
            >
              {isCollapsed ? "Expand" : "Collapse"}
              <span
                className={`staffTaskCollapseIcon ${
                  isCollapsed ? "collapsed" : ""
                }`}
              >
                {"\u25BE"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {!isCollapsed ? (
        <>
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
                    <span className="ticketPreviewItemName">
                      {line.itemName}
                    </span>
                    {line.sku ? (
                      <span className="ticketPreviewItemSku">
                        SKU: {line.sku}
                      </span>
                    ) : null}
                  </div>

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
            </div>
          </div>
        </>
      ) : null}
    </article>
  );
}
