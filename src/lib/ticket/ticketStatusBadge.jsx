import React, { useState } from "react";
import { CancelIcon } from "./ticketIcon";

const statusColor = {
  CANCELLED: "ticket-status--cancelled",
  DISPATCHED: "ticket-status--dispatched",
  COLLECTED: "ticket-status--collected",
  // add more mappings as needed
};

export default function TicketStatusBadge({ ticket }) {
  const [hoverCancelId, setHoverCancelId] = useState(null);

  return (
    <div className="ticket-status-cell">
      <span
        className={`ticket-status ${statusColor[ticket.status] || "ticket-status--default"}`}
      >
        {ticket.status}
      </span>

      {ticket.status === "CANCELLED" && ticket.reason && (
        <div
          className="ticket-cancel-wrapper"
          onMouseEnter={() => setHoverCancelId(ticket.id)}
          onMouseLeave={() => setHoverCancelId(null)}
        >
          <span className="ticket-cancel-tag">
            <CancelIcon />
          </span>

          {hoverCancelId === ticket.id && (
            <div className="ticket-cancel-tooltip">{ticket.reason}</div>
          )}
        </div>
      )}
    </div>
  );
}
