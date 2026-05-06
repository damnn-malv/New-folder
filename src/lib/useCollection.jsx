import { useState, useEffect, useMemo } from "react";
import { OperationsService } from "./operations-service";
import { apiService } from "./api-service";

export function useCollection() {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [verifyingBatch, setVerifyingBatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await apiService.getTickets();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      setBatchStats(OperationsService.calculateBatchStats(tickets));
    } else {
      setBatchStats(null);
    }
  }, [tickets]);

  const safeLower = (val) => String(val ?? "").toLowerCase();

  const filteredTickets = useMemo(() => {
    const term = safeLower(searchTerm);
    const filtered = tickets.filter((t) =>
      safeLower(t.id).includes(term) ||
      safeLower(t.vehicle?.plate_number).includes(term) ||
      safeLower(t.driver?.name).includes(term) ||
      safeLower(t.vehicle?.route_detail?.full_name).includes(term)
    );
    return filtered.sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
  }, [searchTerm, tickets]);

  const handleVerifyBatch = async (batchName) => {
    try {
      setVerifyingBatch(batchName);
      const batchTickets = tickets.filter(
        (t) =>
          !t.is_verified &&
          t.status !== "CANCELLED" &&
          OperationsService.getEffectiveBatchName(t) === batchName
      );

      if (batchTickets.length === 0) {
        setSuccessMessage("No pending tickets to verify in this batch.");
        setTimeout(() => setSuccessMessage(""), 3000);
        setVerifyingBatch(null);
        return;
      }

      for (const ticket of batchTickets) {
        await apiService.patch(`/tickets/${ticket.id}/`, { is_verified: true });
      }

      setSuccessMessage(`${batchTickets.length} ticket(s) in ${batchName} verified successfully.`);
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchTickets();
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifyingBatch(null);
    }
  };

  const handleResetAmount = async (ticketId = null) => {
    try {
      if (!ticketId) {
        const verifiedTickets = tickets.filter((t) => t.is_verified && t.status !== "COLLECTED");
        for (const ticket of verifiedTickets) {
          await apiService.patch(`/tickets/${ticket.id}/`, {
            collection_amount: 0,
            status: "COLLECTED",
          });
        }
        setSuccessMessage(`${verifiedTickets.length} ticket(s) collected and recorded successfully.`);
      } else {
        await apiService.patch(`/tickets/${ticketId}/`, {
          collection_amount: 0,
          status: "COLLECTED",
        });
        setSuccessMessage(`Ticket ${ticketId} marked as collected.`);
      }
      fetchTickets();
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const clearSuccessMessage = () => setSuccessMessage("");
  const clearError = () => setError(null);

  return {
    tickets,
    filteredTickets,
    searchTerm,
    loading,
    error,
    batchStats,
    verifyingBatch,
    successMessage,
    setSearchTerm,
    setError,
    setSuccessMessage,
    fetchTickets,
    handleVerifyBatch,
    handleResetAmount,
    clearSuccessMessage,
    clearError,
  };
}

export const formatTime = (dateString) => {
  try {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(amount || 0);

export const BatchCard = ({ label, stats, batchKey, onVerify, verifyingBatch }) => (
  <div className="bc-card">
    <div className="bc-header">
      <span className="bc-label">{label}</span>
    </div>
    <div className="bc-body">
      {stats && (
        <div className="bc-rows">
          {[
            { label: "Revenue",              value: formatCurrency(stats.total), bold: true },
            { label: "Active Dispatches",    value: stats.count },
            { label: "Pending Verification", value: stats.pending, warn: stats.pending > 0 },
          ].map(({ label: l, value, warn }) => (
            <div key={l} className="bc-row">
              <span className="bc-row-label">{l}</span>
              <span className={`bc-row-value ${warn ? "bc-row-value--warn" : ""}`}>{value}</span>
            </div>
          ))}
        </div>
      )}
      <button
        type="button"
        className="bc-verify-btn"
        onClick={() => onVerify(batchKey)}
        disabled={verifyingBatch === batchKey}
      >
        {verifyingBatch === batchKey ? (
          <>
            <span className="bc-spinner" />
            Verifying…
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            Verify {batchKey}
          </>
        )}
      </button>
    </div>
  </div>
);
