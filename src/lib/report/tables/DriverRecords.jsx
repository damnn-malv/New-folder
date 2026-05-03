import { DataTable } from "../../../components/ui/dataTable";

export default function DriverRecords({
  driversTotal,
  showAllDrivers,
  setShowAllDrivers,
  visibleDrivers,
  handleExportDriversCSV,
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
          <span style={cardTitleStyle}>Driver Records</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {showAllDrivers ? driversTotal : Math.min(5, driversTotal)} of {driversTotal} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {driversTotal > 5 && (
            <button onClick={() => setShowAllDrivers((v) => !v)} style={btnSecondary}>
              {showAllDrivers ? "Show Less" : "View All"}
            </button>
          )}
          <button onClick={handleExportDriversCSV} style={btnExport("#16a34a")}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <DataTable
          columns={["Driver Code", "Name", "Contact Number"]}
          data={visibleDrivers}
          rowRenderer={(d, idx, { rowClass, cellClass }) => (
            <tr key={d.code} className={rowClass}>
              <td className={`${cellClass} font-mono`}>{d.code}</td>
              <td className={`${cellClass} font-semibold`}>{d.name}</td>
              <td className={cellClass}>{d.contact_number}</td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
