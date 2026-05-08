import { DataTable } from "../../../components/ui/dataTable";

export default function TransactionLogs({
  logsTotal,
  showAllLogs,
  setShowAllLogs,
  visibleLogs,
  handleExportLogsCSV,
  STATUS_COLORS,
  cardStyle,
  cardHeaderStyle,
  cardTitleStyle,
  btnExport,
  btnSecondary,
}) {
  return (
    <div className="rpt-card rpt-section">
      <div className="rpt-card-header">
        <div className="rpt-card-header-left">
          <span className="rpt-card-title">Transaction Logs</span>
          <span className="rpt-record-count">
            {showAllLogs ? logsTotal : Math.min(5, logsTotal)} of {logsTotal} records
          </span>
        </div>
        <div className="rpt-card-header-actions">
          {logsTotal > 5 && (
            <button className="rpt-btn rpt-btn--secondary" onClick={() => setShowAllLogs((v) => !v)}>
              {showAllLogs ? "Show Less" : "View All Logs"}
            </button>
          )}
          <button className="rpt-btn-export rpt-btn-export--green" onClick={handleExportLogsCSV}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export CSV
          </button>
        </div>
      </div>

      <DataTable
        columns={["Timestamp", "Ticket ID", "Action", "Batch", "Driver", "Vehicle", "Route", "User"]}
        data={visibleLogs}
        rowRenderer={(l, idx, { rowClass, cellClass }) => (
          <tr key={l.id + idx} className={rowClass}>
            <td className={`${cellClass} rpt-mono rpt-muted`}>{l.timestamp}</td>
            <td className={`${cellClass} rpt-mono`}>{l.ticket_id}</td>
            <td className={cellClass}>
              <span
                className="rpt-action-pill"
                style={{
                  background: `${STATUS_COLORS[l.action] || "#64748b"}22`,
                  color: STATUS_COLORS[l.action] || "#64748b",
                }}
              >
                {l.action}
              </span>
            </td>
            <td className={cellClass}>
              <span className={`rpt-batch-pill ${l.batch === "Batch 1" ? "rpt-batch-pill--b1" : "rpt-batch-pill--b2"}`}>
                {l.batch}
              </span>
            </td>
            <td className={cellClass}>{l.driver}</td>
            <td className={cellClass}>
              <span className="rpt-plate">{l.vehicle}</span>
            </td>
            <td className={cellClass}>{l.route}</td>
            <td className={`${cellClass} rpt-muted`}>{l.user}</td>
          </tr>
        )}
      />
    </div>
  );
}
