import React, { useEffect, useState } from "react";
import { apiService } from "../../../lib/api-service";
import "../../../styles/Dispatch.css";

function Dispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Cancel modal state ──────────────────────────────────────────────────
  const [cancelTarget, setCancelTarget] = useState(null); // vehicle being cancelled
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehicleData, ticketData] = await Promise.all([
        apiService.getVehicles(),
        apiService.getTickets(),
      ]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const queue = vehicles.filter(
    (v) =>
      v.status === "QUEUED" &&
      !v.is_archived &&
      tickets.some(
        (t) => t.vehicle?.id === v.id && t.status === "ISSUED" && !t.is_late,
      ),
  );

  const getDriverName = (vehicle) => {
    if (vehicle.active_driver_name) return vehicle.active_driver_name;
    const ticket = tickets.find(
      (t) =>
        t.vehicle && t.vehicle.id === vehicle.id && t.status === "DISPATCHED",
    );
    return ticket?.driver?.name || "—";
  };

  // ── Dispatch ────────────────────────────────────────────────────────────
  const handleDispatch = async (vehicle) => {
    try {
      await apiService.patch(`/vehicles/${vehicle.id}/`, {
        status: "AVAILABLE",
      });
      const activeTicket = tickets.find(
        (t) => t.vehicle?.id === vehicle.id && t.status === "ISSUED",
      );
      if (activeTicket) {
        await apiService.patch(`/tickets/${activeTicket.id}/`, {
          status: "DISPATCHED",
        });
      }
      await fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Cancel: open modal ──────────────────────────────────────────────────
  const openCancelModal = (vehicle) => {
    setCancelTarget(vehicle);
    setCancelReason("");
    setCancelError("");
  };

  // ── Cancel: close modal ─────────────────────────────────────────────────
  const closeCancelModal = () => {
    if (cancelling) return;
    setCancelTarget(null);
    setCancelReason("");
    setCancelError("");
  };

  // ── Cancel: confirm ─────────────────────────────────────────────────────
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancellation.");
      return;
    }
    setCancelling(true);
    setCancelError("");
    try {
      // 1. Find the ISSUED ticket for this vehicle
      const activeTicket = tickets.find(
        (t) => t.vehicle?.id === cancelTarget.id && t.status === "ISSUED",
      );
      if (activeTicket) {
        // 2. Update ticket → CANCELLED + reason (stored in `reason` field)
        await apiService.patch(`/tickets/${activeTicket.id}/`, {
          status: "CANCELLED",
          reason: cancelReason.trim(),
        });
      }
      // 3. Return vehicle to AVAILABLE
      await apiService.patch(`/vehicles/${cancelTarget.id}/`, {
        status: "AVAILABLE",
      });
      // 4. Refresh and close
      await fetchData();
      closeCancelModal();
    } catch (err) {
      setCancelError(
        err.message || "Failed to cancel ticket. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="dispatch-page">
      {/* ── Header ── */}
      <div className="dispatch-header">
        <div className="dispatch-header-left">
          <div className="dispatch-header-accent" />
          <div>
            <h1 className="dispatch-title">Active Terminal Queue</h1>
            <p className="dispatch-subtitle">
              Dispatch control and active trip monitoring
            </p>
          </div>
        </div>
        <div className="dispatch-header-badges">
          <span className="dispatch-badge dispatch-badge--queue">
            <span className="dispatch-badge-dot dispatch-badge-dot--green" />
            {queue.length} In Queue
          </span>
        </div>
      </div>

      {error && (
        <div className="dispatch-error">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      <div className="dispatch-grid">
        {/* ── Queued Vehicles ── */}
        <div className="dispatch-card">
          <div className="dispatch-card-header">
            <div className="dispatch-card-header-left">
              <span className="dispatch-card-indicator dispatch-card-indicator--green" />
              <span className="dispatch-card-title">Queued Vehicles</span>
            </div>
            <span className="dispatch-card-count">{queue.length}</span>
          </div>

          <div className="dispatch-table-wrap">
            <table className="dispatch-table">
              <thead>
                <tr>
                  <th>Plate No.</th>
                  <th>Driver</th>
                  <th>Route</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="dispatch-table-empty">
                      <div className="dispatch-loading-dots">
                        <div />
                        <div />
                        <div />
                      </div>
                    </td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="dispatch-table-empty">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        opacity="0.3"
                      >
                        <rect x="1" y="3" width="15" height="13" rx="1" />
                        <path d="M16 8h4l3 3v5h-7V8z" />
                        <circle cx="5.5" cy="18.5" r="2.5" />
                        <circle cx="18.5" cy="18.5" r="2.5" />
                      </svg>
                      <span>No vehicles in queue</span>
                    </td>
                  </tr>
                ) : (
                  queue.map((vehicle) => (
                    <tr key={vehicle.id} className="dispatch-table-row">
                      <td>
                        <span className="dispatch-plate">
                          {vehicle.plate_number}
                        </span>
                      </td>
                      <td className="dispatch-td-name">
                        {getDriverName(vehicle)}
                      </td>
                      <td className="dispatch-td-route">
                        {vehicle.route_detail?.full_name || "—"}
                      </td>
                      <td>
                        <div className="dispatch-action-group">
                          <button
                            className="dispatch-btn dispatch-btn--dispatch"
                            onClick={() => handleDispatch(vehicle)}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            Dispatch
                          </button>
                          <button
                            className="dispatch-btn dispatch-btn--cancel"
                            onClick={() => openCancelModal(vehicle)}
                          >
                            <svg
                              width="13"
                              height="13"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.2"
                            >
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Cancel Ticket Modal ── */}
      {cancelTarget && (
        <div className="dispatch-overlay" onClick={closeCancelModal}>
          <div className="dispatch-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="dispatch-modal-header">
              <div className="dispatch-modal-header-left">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.2"
                >
                  <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                <h2 className="dispatch-modal-title">Cancel Ticket</h2>
              </div>
              <button
                className="dispatch-modal-close"
                onClick={closeCancelModal}
                disabled={cancelling}
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="dispatch-modal-body">
              {/* Vehicle info summary */}
              <div className="dispatch-cancel-vehicle">
                <div className="dispatch-cancel-vehicle__row">
                  <span className="dispatch-plate">
                    {cancelTarget.plate_number}
                  </span>
                  <span className="dispatch-cancel-vehicle__route">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {cancelTarget.route_detail?.full_name || "No route"}
                  </span>
                </div>
                <span className="dispatch-cancel-vehicle__driver">
                  Driver: {getDriverName(cancelTarget)}
                </span>
              </div>

              {/* Warning notice */}
              <div className="dispatch-cancel-warning">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  style={{ flexShrink: 0, marginTop: 1 }}
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <path d="M12 9v4M12 17h.01" />
                </svg>
                <span>
                  This will cancel the issued ticket and return the vehicle to{" "}
                  <strong>Available</strong> status. This action cannot be
                  undone.
                </span>
              </div>

              {/* Reason textarea */}
              <div className="dispatch-modal-field">
                <label className="dispatch-modal-label">
                  Reason for Cancellation{" "}
                  <span className="dispatch-modal-required">*</span>
                </label>
                <textarea
                  className="dispatch-modal-textarea"
                  rows={3}
                  placeholder="Enter the reason for cancelling this ticket…"
                  value={cancelReason}
                  onChange={(e) => {
                    setCancelReason(e.target.value);
                    if (cancelError) setCancelError("");
                  }}
                  disabled={cancelling}
                />
                {cancelError && (
                  <span className="dispatch-modal-field-error">
                    {cancelError}
                  </span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="dispatch-modal-footer">
              <button
                type="button"
                className="dispatch-modal-btn dispatch-modal-btn--secondary"
                onClick={closeCancelModal}
                disabled={cancelling}
              >
                Go Back
              </button>
              <button
                type="button"
                className="dispatch-modal-btn dispatch-modal-btn--danger"
                onClick={handleConfirmCancel}
                disabled={cancelling || !cancelReason.trim()}
              >
                {cancelling ? (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      className="dispatch-modal-spin"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Cancelling…
                  </>
                ) : (
                  <>
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                    Confirm Cancel
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dispatch;
