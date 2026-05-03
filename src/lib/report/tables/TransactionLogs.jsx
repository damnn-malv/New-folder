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
    <div style={{ ...cardStyle, marginTop: 20 }}>
      {/* Header */}
      <div style={{ ...cardHeaderStyle, justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={cardTitleStyle}>Transaction Logs</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {showAllLogs ? logsTotal : Math.min(5, logsTotal)} of {logsTotal} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {logsTotal > 5 && (
            <button onClick={() => setShowAllLogs((v) => !v)} style={btnSecondary}>
              {showAllLogs ? "Show Less" : "View All Logs"}
            </button>
          )}
          <button onClick={handleExportLogsCSV} style={btnExport("#16a34a")}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <DataTable
          columns={[
            "Timestamp",
            "Ticket ID",
            "Action",
            "Batch",
            "Driver",
            "Vehicle",
            "Route",
            "User",
          ]}
          data={visibleLogs}
          rowRenderer={(l, idx, { rowClass, cellClass }) => (
            <tr key={l.id + idx} className={rowClass}>
              <td className={`${cellClass} text-gray-700 font-mono text-xs`}>
                {l.timestamp}
              </td>
              <td className={`${cellClass} font-mono text-xs`}>{l.ticket_id}</td>
              <td className={cellClass}>
                <span
                  style={{
                    background: `${STATUS_COLORS[l.action] || "#e2e8f0"}22`,
                    color: STATUS_COLORS[l.action] || "#475569",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {l.action}
                </span>
              </td>
              <td className={cellClass}>
                <span
                  style={{
                    background: l.batch === "Batch 1" ? "#dbeafe" : "#fef3c7",
                    color: l.batch === "Batch 1" ? "#1d4ed8" : "#92400e",
                    padding: "2px 6px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {l.batch}
                </span>
              </td>
              <td className={cellClass}>{l.driver}</td>
              <td className={cellClass}>{l.vehicle}</td>
              <td className={cellClass}>{l.route}</td>
              <td className={`${cellClass} text-gray-500`}>{l.user}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
