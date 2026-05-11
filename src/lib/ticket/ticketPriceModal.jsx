import React from "react";

const TicketPriceModal = ({
  ticketFee,
  ticketPriceLoading,
  ticketPriceError,
  isTicketPriceModalOpen,
  setIsTicketPriceModalOpen,
  newTicketPrice,
  setNewTicketPrice,
  saveTicketPrice,
  isSavingTicketPrice,
}) => {
  if (!isTicketPriceModalOpen) return null;

  return (
    <div className="ticket-price-modal">
      <div className="ticket-price-modal-card">
        <div className="ticket-price-modal-header">
          <span>Update Ticket Price</span>
          <button
            type="button"
            className="ticket-change-btn"
            onClick={() => setIsTicketPriceModalOpen(false)}
          >
            Close
          </button>
        </div>

        <label className="ticket-label">New price (PHP)</label>
        <input
          type="number"
          min="0"
          step="0.01"
          className="ticket-select"
          value={newTicketPrice}
          onChange={(e) => setNewTicketPrice(e.target.value)}
        />

        {ticketPriceError && (
          <div className="ticket-alert ticket-alert--error">
            {ticketPriceError}
          </div>
        )}

        <button
          type="button"
          className="ticket-issue-btn"
          onClick={saveTicketPrice}
          disabled={isSavingTicketPrice}
        >
          {isSavingTicketPrice ? "Saving…" : "Save Price"}
        </button>
      </div>
    </div>
  );
};

export default TicketPriceModal;
