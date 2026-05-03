export const peso = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const STATUS_COLORS = {
  COLLECTED: "#22c55e",
  ISSUED: "#3b82f6",
  DISPATCHED: "#f59e0b",
  CANCELLED: "#ef4444",
  RETURNED: "#8b5cf6",
};

export const today = new Date().toISOString().split("T")[0];

// ─── CSV Export ────────────────────────────────────────────────────────────────
export function exportCSV(data, filename = "report.csv") {
  if (!data.length) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((r) => headers.map((h) => `"${r[h] ?? ""}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
export function SummaryCard({ label, count, total, accent }) {
  return (
    <div style={{
      background: "#fff", border: "1px solid #e2e8f0", borderTop: `4px solid ${accent}`,
      borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 160,
    }}>
      <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "6px 0 2px" }}>
        {count}
        <span style={{ fontSize: 13, color: "#64748b", fontWeight: 400, marginLeft: 4 }}>tickets</span>
      </div>
      <div style={{ fontSize: 15, color: accent, fontWeight: 600 }}>{peso(total)}</div>
    </div>
  );
}


// ─── handle ──────────────────────────────────────────────────────────────
export const handleDateChange = (field, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "endDate" && updated.startDate && value < updated.startDate) return prev;
      if (field === "startDate" && updated.endDate && value > updated.endDate) updated.endDate = "";
      return updated;
    });
  };

export const handleClearFilter = () => {
    setFilters({ startDate: "", endDate: "", batch: "all" });
    setTimeout(() => fetchData(), 0);
  };

export const handleExportCSV = () => {
    exportCSV(
      filteredCollections.map((r) => ({
        Date: r.issued_at, Batch: r.batch, "Ticket ID": r.id,
        Driver: r.driver, Vehicle: r.vehicle, Route: r.route,
        "Amount (PHP)": (r.ticket_count || 1) * TICKET_FEE,
      })),
      `collection_report_${Date.now()}.csv`
    );
  };

export const handleExportLogsCSV = () => {
    exportCSV(
      logs.map((l) => ({
        Timestamp: l.timestamp, "Ticket ID": l.ticket_id, Action: l.action,
        Driver: l.driver, Vehicle: l.vehicle, Route: l.route,
        Batch: l.batch, "Amount (PHP)": l.amount, User: l.user,
      })),
      `transaction_logs_${Date.now()}.csv`
    );
  };

export const handleExportVehiclesCSV = () => {
    exportCSV(
      vehicles.map((v) => ({
        Code: v.code, "Plate Number": v.plate_number,
        Route: v.route_detail ? `${v.route_detail.origin} - San Fernando` : v.route,
        Driver: v.active_driver_name || "—",
      })),
      `vehicle_records_${Date.now()}.csv`
    );
  };

export const handleExportDriversCSV = () => {
    exportCSV(
      drivers.map((d) => ({
        Code: d.code, Name: d.name, "Contact Number": d.contact_number,
      })),
      `driver_records_${Date.now()}.csv`
    );
  };

export const handleExportPDF = () => exportPDF(filteredCollections, filters);