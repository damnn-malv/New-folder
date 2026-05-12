import React, { useEffect, useState } from "react";
import { apiService } from "../../../lib/api-service";
import "../../../styles/Dispatch.css";

function Dispatch() {
  const [vehicles, setVehicles] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
    fetchData();
  }, []);

  const queue = tickets.filter(
    (t) =>
      t.status === "ISSUED" &&
      !t.is_late &&
      !t.vehicle.is_archived &&
      t.vehicle.status !== "MAINTENANCE", // 🚦 exclude maintenance vehicles
  );

  const getDriverName = (vehicle) => {
    if (vehicle.active_driver_name) return vehicle.active_driver_name;
    const ticket = tickets.find(
      (t) =>
        t.vehicle && t.vehicle.id === vehicle.id && t.status === "DISPATCHED",
    );
    return ticket?.driver?.name || "—";
  };

  const handleDispatch = async (vehicle) => {
    try {
      // mark vehicle as dispatched
      await apiService.patch(`/vehicles/${vehicle.id}/`, {
        status: "AVAILABLE",
      });

      // also mark its ticket as dispatched
      const activeTicket = tickets.find(
        (t) => t.vehicle?.id === vehicle.id && t.status === "ISSUED",
      );
      if (activeTicket) {
        await apiService.patch(`/tickets/${activeTicket.id}/`, {
          status: "DISPATCHED",
        });
      }

      // refresh data
      const [vehicleData, ticketData] = await Promise.all([
        apiService.getVehicles(),
        apiService.getTickets(),
      ]);
      setVehicles(vehicleData);
      setTickets(ticketData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="dispatch-page">
      {/* Header */}
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
                    <td colSpan="5" className="dispatch-table-empty">
                      <div className="dispatch-loading-dots">
                        <div />
                        <div />
                        <div />
                      </div>
                    </td>
                  </tr>
                ) : queue.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="dispatch-table-empty">
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
                  queue.map((ticket) => (
                    <tr key={ticket.id} className="dispatch-table-row">
                      <td>
                        <span className="dispatch-plate">
                          {ticket.vehicle?.plate_number || "—"}
                        </span>
                      </td>
                      <td className="dispatch-td-name">
                        {ticket.driver?.name ||
                          ticket.vehicle?.active_driver_name ||
                          "—"}
                      </td>
                      <td className="dispatch-td-route">
                        {ticket.route ||
                          ticket.vehicle?.route_detail?.full_name ||
                          "—"}
                      </td>
                      <td>
                        <button onClick={() => handleDispatch(ticket.vehicle)}>
                          Dispatch
                        </button>
                      </td>

                      <td>
                        <button
                          className="dispatch-btn dispatch-btn--dispatch"
                          onClick={() => handleDispatch(ticket.vehicle)}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dispatch;
