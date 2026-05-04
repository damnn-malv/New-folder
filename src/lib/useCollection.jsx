import { useState, useEffect, useMemo } from "react";
import { OperationsService } from "./operations-service";
import { apiService } from "./api-service";

/**
 * Custom hook for managing collection/tally functionality.
 * Encapsulates all state and logic for the collection page.
 */
export function useCollection() {
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [batchStats, setBatchStats] = useState(null);
  const [verifyingBatch, setVerifyingBatch] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch tickets from API
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

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, []);

  // Calculate batch stats when tickets change
  useEffect(() => {
    if (tickets.length > 0) {
      setBatchStats(OperationsService.calculateBatchStats(tickets));
    } else {
      setBatchStats(null);
    }
  }, [tickets]);

  // Filter and sort tickets based on search term
  const safeLower = (val) => String(val ?? "").toLowerCase();

  const filteredTickets = useMemo(() => {
    const term = safeLower(searchTerm);

    const filtered = tickets.filter((t) =>
      safeLower(t.id).includes(term) ||
      safeLower(t.vehicle?.plate_number).includes(term) ||
      safeLower(t.driver?.name).includes(term) ||
      safeLower(t.vehicle?.route_detail?.full_name).includes(term) // if you want route search
    );

    return filtered.sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
  }, [searchTerm, tickets]);


  // Verify all pending tickets in a batch
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

  // Reset/collect amount for verified tickets
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

  // Clear success message
  const clearSuccessMessage = () => setSuccessMessage("");

  // Clear error
  const clearError = () => setError(null);

  return {
    // State
    tickets,
    filteredTickets,
    searchTerm,
    loading,
    error,
    batchStats,
    verifyingBatch,
    successMessage,
    // Setters
    setSearchTerm,
    setError,
    setSuccessMessage,
    // Actions
    fetchTickets,
    handleVerifyBatch,
    handleResetAmount,
    clearSuccessMessage,
    clearError,
  };
}

// Utility functions
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
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amount || 0
  );

// Batch Card Component
export const BatchCard = ({ label, stats, batchKey, onVerify, verifyingBatch }) => (
  <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
    <div
      className="px-4 py-3 border-b border-gray-100"
      style={{ background: "#1a2744" }}
    >
      <p className="text-sm font-semibold text-white">{label}</p>
    </div>
    <div className="p-4 space-y-2">
      {stats && (
        <>
          {[
            { label: "Revenue", value: formatCurrency(stats.total), bold: true },
            { label: "Active Dispatches", value: stats.count },
            {
              label: "Pending Verification",
              value: stats.pending,
              warn: stats.pending > 0,
            },
          ].map(({ label: l, value, bold, warn }) => (
            <div
              key={l}
              className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm text-gray-500">{l}</span>
              <span
                className={`text-sm font-semibold ${
                  warn ? "text-yellow-600" : "text-gray-800"
                }`}
              >
                {value}
              </span>
            </div>
          ))}
        </>
      )}
      <button
        type="button"
        onClick={() => onVerify(batchKey)}
        disabled={verifyingBatch === batchKey}
        className="w-full mt-2 text-white text-sm font-semibold py-2 rounded transition disabled:opacity-50"
        style={{ background: "#1a2744" }}
      >
        {verifyingBatch === batchKey ? "Verifying..." : `Verify ${batchKey}`}
      </button>
    </div>
  </div>
);