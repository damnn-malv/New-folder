import React, { useState } from "react";
import { useCollection, formatTime, formatCurrency, BatchCard } from "../../../lib/useCollection";
import { OperationsService } from "../../../lib/operations-service";
import "../../../styles/Collection.css";

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
    isBatchVerifiable,
  } = useCollection();

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 15;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTickets.length / rowsPerPage);

  return (
    <div className="col-page">

      {/* Header */}
      <div className="col-header">
        <div className="col-header-left">
          <div className="col-header-accent" />
          <div>
            <h1 className="col-title">Tally &amp; Collections</h1>
            <p className="col-subtitle">Automated revenue recording — ₱10 per dispatch</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="col-alert col-alert--error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {successMessage && (
        <div className="col-alert col-alert--success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {successMessage}
        </div>
      )}

      <div className="col-grid">

        {/* ── Left: Shift Tally ── */}
        <div className="col-tally">

          {/* Batch cards — BatchCard component unchanged */}
          <BatchCard
            label="Batch 1 — Morning Shift (6:00 AM – 3:00 PM)"
            stats={batchStats?.batch1}
            batchKey="Batch 1"
            onVerify={handleVerifyBatch}
            verifyingBatch={verifyingBatch}
            isVerifiable={isBatchVerifiable("Batch 1")}
          />
          <BatchCard
            label="Batch 2 — Afternoon Shift (3:00 PM – 9:00 PM)"
            stats={batchStats?.batch2}
            batchKey="Batch 2"
            onVerify={handleVerifyBatch}
            verifyingBatch={verifyingBatch}
            isVerifiable={isBatchVerifiable("Batch 2")}
          />
        </div>

        {/* ── Right: Collection Log ── */}
        <div className="col-card col-log-card">
          <div className="col-card-header col-card-header--navy col-log-header">
            <div>
              <span className="col-card-title">Collection Log</span>
              <p className="col-card-desc">Recent collections and verification status</p>
            </div>
            <div className="col-search-wrap">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="col-search-icon">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
              </svg>
              <input
                className="col-search"
                placeholder="Search tickets…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="col-table-wrap">
            <table className="col-table">
              <thead>
                <tr>
                  {["Ticket ID", "Batch", "Time", "Vehicle", "Driver", "Verified"].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="col-table-state">
                      <div className="col-loading-dots"><div /><div /><div /></div>
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan="6" className="col-table-state col-table-state--error">Error: {error}</td>
                  </tr>
                ) : filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="col-table-state">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>No records found</span>
                    </td>
                  </tr>
                ) : (
                  currentTickets.map((ticket) => {
                    const effectiveBatch = OperationsService.getEffectiveBatchName(ticket);
                    return (
                      <tr key={ticket.id} className={`col-table-row ${ticket.is_late ? "col-table-row--late" : ""}`}>
                        <td><span className="col-id-badge">#{ticket.id}</span></td>
                        <td>
                          <div className="col-batch-cell">
                            <span className="col-batch-name">{effectiveBatch}</span>
                            {ticket.is_late && (
                              <span className="col-late-tag">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                                  <path d="M12 9v4"/><path d="M12 17h.01"/>
                                </svg>
                                Late
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="col-td-time">{formatTime(ticket.issued_at)}</td>
                        <td>
                          {ticket.vehicle?.plate_number
                            ? <span className="col-plate">{ticket.vehicle.plate_number}</span>
                            : <span className="col-na">N/A</span>}
                        </td>
                        <td className="col-td-name">{ticket.driver?.name || <span className="col-na">N/A</span>}</td>
                        <td>
                          <span className={`col-verified ${ticket.is_verified ? "col-verified--yes" : "col-verified--pending"}`}>
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

          {/* Pagination */}
          {filteredTickets.length > rowsPerPage && (
            <div className="col-pagination">
              <span className="col-pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <div className="col-pagination-btns">
                <button
                  className="col-page-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  ← Prev
                </button>
                <button
                  className="col-page-btn"
                  disabled={endIndex >= filteredTickets.length}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default collection;
