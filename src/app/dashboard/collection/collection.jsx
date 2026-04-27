import React from "react";
import { useCollection, formatTime, formatCurrency, BatchCard } from "../../../lib/useCollection";
import { OperationsService } from "../../../lib/operations-service";

function collection() {
  const {
    filteredTickets,
    searchTerm,
    loading,
    error,
    batchStats,
    verifyingBatch,
    successMessage,
    setSearchTerm,
    handleVerifyBatch,
    handleResetAmount,
  } = useCollection();

  return (
    <div className="p-6 space-y-6">
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}>Tally & Collections</h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">Automated revenue recording — ₱10 per dispatch</p>
          </div>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>}
      {successMessage && <div className="p-3 bg-green-50 text-green-800 rounded border border-green-200 text-sm font-medium">{successMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Tally */}
        <div className="space-y-4">
          {/* Total Revenue */}
          <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100" style={{ borderLeftWidth: "4px", borderLeftColor: "#c9a84c" }}>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Verified Revenue</p>
              <p className="text-3xl font-bold mt-1" style={{ color: "#1a2744" }}>
                {batchStats ? formatCurrency(batchStats.totalVerified) : "₱0.00"}
              </p>
            </div>
            <div className="p-4">
              <button type="button" onClick={() => handleResetAmount()}
                className="w-full py-2 text-sm font-semibold text-white rounded transition" style={{ background: "#2a5c3f" }}>
                Collect & Record Amount
              </button>
            </div>
          </div>
          <BatchCard label="Batch 1 — Morning Shift (6:00 AM – 3:00 PM)" stats={batchStats?.batch1} batchKey="Batch 1" onVerify={handleVerifyBatch} verifyingBatch={verifyingBatch} />
          <BatchCard label="Batch 2 — Afternoon Shift (3:00 PM – 9:00 PM)" stats={batchStats?.batch2} batchKey="Batch 2" onVerify={handleVerifyBatch} verifyingBatch={verifyingBatch} />
        </div>

        {/* Collection Log */}
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between" style={{ borderLeftWidth: "4px", borderLeftColor: "#1a2744" }}>
            <div>
              <h2 className="font-semibold text-gray-800" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>Collection Log</h2>
              <p className="text-xs text-gray-500 mt-0.5">Recent collections and verification status</p>
            </div>
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input className="pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none w-40"
                placeholder="Search tickets..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Ticket ID", "Batch", "Time", "Vehicle", "Driver", "Verified"].map((h) => (
                    <th key={h} className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">Loading...</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="p-4 text-center text-red-500">Error: {error}</td></tr>
                ) : filteredTickets.length === 0 ? (
                  <tr><td colSpan="6" className="p-4 text-center text-gray-500">No records found.</td></tr>
                ) : (
                  filteredTickets.map((ticket) => {
                    const effectiveBatch = OperationsService.getEffectiveBatchName(ticket);
                    return (
                      <tr key={ticket.id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${ticket.is_late ? "bg-amber-50/40" : ""}`}>
                        <td className="p-3 text-xs font-medium text-gray-700">{ticket.id}</td>
                        <td className="p-3 text-xs">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-gray-700">{effectiveBatch}</span>
                            {ticket.is_late && (
                              <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>
                                </svg>
                                Late issuance
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm">{formatTime(ticket.issued_at)}</td>
                        <td className="p-3 text-sm">{ticket.vehicle?.plate_number || "N/A"}</td>
                        <td className="p-3 text-sm">{ticket.driver?.name || "N/A"}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${ticket.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                            {ticket.is_verified ? "✓ Verified" : "○ Pending"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default collection;
