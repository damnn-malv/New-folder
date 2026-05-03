import { DataTable } from "../../../components/ui/dataTable";
import { TICKET_FEE } from "../../constants";

export default function CollectionRecords({
  filters,
  setFilters,
  showAllCollections,
  setShowAllCollections,
  filteredCollections,
  visibleCollections,
  handleExportCSV,
  handleExportPDF,
  peso,
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
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={cardTitleStyle}>Collection Records</span>
          <div
            style={{
              display: "flex",
              gap: 0,
              border: "1px solid #e2e8f0",
              borderRadius: 7,
              overflow: "hidden",
            }}
          >
            {[["all", "All"], ["batch1", "Batch 1"], ["batch2", "Batch 2"]].map(
              ([val, lbl]) => (
                <button
                  key={val}
                  onClick={() => {
                    setFilters((f) => ({ ...f, batch: val }));
                    setShowAllCollections(false);
                  }}
                  style={{
                    padding: "5px 14px",
                    fontSize: 12,
                    fontWeight: 600,
                    border: "none",
                    background: filters.batch === val ? "#1e3a5f" : "#fff",
                    color: filters.batch === val ? "#fff" : "#475569",
                    cursor: "pointer",
                  }}
                >
                  {lbl}
                </button>
              )
            )}
          </div>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {showAllCollections
              ? filteredCollections.length
              : Math.min(5, filteredCollections.length)}{" "}
            of {filteredCollections.length} record(s)
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={handleExportCSV} style={btnExport("#16a34a")}>
            ⬇ CSV
          </button>
          <button onClick={handleExportPDF} style={btnExport("#1e3a5f")}>
            ⬇ PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <DataTable
          columns={[
            "Date & Time",
            "Batch",
            "Ticket ID",
            "Driver",
            "Vehicle",
            "Route",
            "Amount",
          ]}
          data={visibleCollections}
          rowRenderer={(r, idx, { rowClass, cellClass }) => (
            <tr key={r.id} className={rowClass}>
              <td className={cellClass}>{r.issued_at}</td>
              <td className={cellClass}>
                <span
                  style={{
                    background: r.batch === "Batch 1" ? "#dbeafe" : "#fef3c7",
                    color: r.batch === "Batch 1" ? "#1d4ed8" : "#92400e",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  {r.batch}
                </span>
              </td>
              <td className={`${cellClass} font-mono text-xs text-gray-700`}>
                {r.id}
              </td>
              <td className={cellClass}>{r.driver}</td>
              <td className={cellClass}>{r.vehicle}</td>
              <td className={cellClass}>{r.route}</td>
              <td
                className={`${cellClass} font-semibold text-green-600 text-right`}
              >
                {peso((r.ticket_count || 1) * TICKET_FEE)}
              </td>
            </tr>
          )}
        />
      </div>

      {/* Totals row */}
      {filteredCollections.length > 0 && (
        <div style={{ overflowX: "auto" }}>
          <table className="w-full">
            <tfoot>
              <tr>
                <td
                  colSpan={6}
                  className="p-3 font-bold bg-gray-100 text-right"
                >
                  Total ({filteredCollections.length} tickets)
                </td>
                <td className="p-3 font-bold bg-gray-100 text-right text-green-600">
                  {peso(
                    filteredCollections.reduce(
                      (s, r) => s + (r.ticket_count || 1) * TICKET_FEE,
                      0
                    )
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Show All / Show Less button */}
      {filteredCollections.length > 5 && (
        <div
          style={{
            padding: "12px 18px",
            borderTop: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <button
            onClick={() => setShowAllCollections((v) => !v)}
            style={btnSecondary}
          >
            {showAllCollections
              ? "Show Less"
              : `View All ${filteredCollections.length} Records`}
          </button>
        </div>
      )}
    </div>
  );
}
