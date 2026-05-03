import { DataTable } from "../../../components/ui/dataTable";

export default function VehicleRecords({
  vehiclesTotal,
  showAllVehicles,
  setShowAllVehicles,
  visibleVehicles,
  handleExportVehiclesCSV,
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
          <span style={cardTitleStyle}>Vehicle Records</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            {showAllVehicles ? vehiclesTotal : Math.min(5, vehiclesTotal)} of {vehiclesTotal} records
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {vehiclesTotal > 5 && (
            <button onClick={() => setShowAllVehicles((v) => !v)} style={btnSecondary}>
              {showAllVehicles ? "Show Less" : "View All"}
            </button>
          )}
          <button onClick={handleExportVehiclesCSV} style={btnExport("#16a34a")}>
            ⬇ Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <DataTable
          columns={["Vehicle Code", "Plate Number", "Route", "Driver"]}
          data={visibleVehicles}
          rowRenderer={(v, idx, { rowClass, cellClass }) => (
            <tr key={v.code} className={rowClass}>
              <td className={`${cellClass} font-mono text-gray-700`}>{v.code}</td>
              <td className={`${cellClass} font-semibold`}>{v.plate_number}</td>
              <td className={cellClass}>
                {v.route_detail ? `${v.route_detail.origin} - San Fernando` : v.route}
              </td>
              <td className={cellClass}>
                {v.active_driver_name || "—"}
              </td>
            </tr>
          )}
        />
      </div>
    </div>
  );
}
