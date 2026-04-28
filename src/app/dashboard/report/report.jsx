import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const peso = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const STATUS_COLORS = {
  COLLECTED: "#22c55e",
  ISSUED: "#3b82f6",
  DISPATCHED: "#f59e0b",
  CANCELLED: "#ef4444",
  RETURNED: "#8b5cf6",
};

// ─── CSV Export ────────────────────────────────────────────────────────────────
function exportCSV(data, filename = "report.csv") {
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

// ─── PDF Export — receipt style ────────────────────────────────────────────────
function exportPDF(collections, filters) {
  const batchLabel =
    filters.batch === "batch1" ? "Batch 1 (AM)" :
    filters.batch === "batch2" ? "Batch 2 (PM)" : "All Batches";

  const dateRange =
    filters.startDate && filters.endDate ? `${filters.startDate} to ${filters.endDate}` :
    filters.startDate ? `From ${filters.startDate}` :
    filters.endDate ? `Until ${filters.endDate}` : "All Time";

  const now = new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
  const totalAmt = collections.reduce((s, r) => s + (parseFloat(r.collection_amount) || 0), 0);

  // Group by date then by batch for receipt rows
  const byDate = {};
  collections.forEach((r) => {
    const d = r.issued_date || r.issued_at.split(" ")[0];
    if (!byDate[d]) byDate[d] = { batch1: [], batch2: [] };
    if (r.batch === "Batch 1") byDate[d].batch1.push(r);
    else byDate[d].batch2.push(r);
  });

  const receiptRows = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b)).map(([date, batches]) => {
    let rows = "";
    if (batches.batch1.length > 0) {
      const total = batches.batch1.reduce((s, r) => s + (parseFloat(r.collection_amount) || 0), 0);
      rows += `<tr><td>${date}</td><td>Batch 1 (AM)</td><td style="text-align:center">${batches.batch1.length}</td><td style="text-align:right">${peso(total)}</td></tr>`;
    }
    if (batches.batch2.length > 0) {
      const total = batches.batch2.reduce((s, r) => s + (parseFloat(r.collection_amount) || 0), 0);
      rows += `<tr><td>${date}</td><td>Batch 2 (PM)</td><td style="text-align:center">${batches.batch2.length}</td><td style="text-align:right">${peso(total)}</td></tr>`;
    }
    return rows;
  }).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Collection Receipt</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #111; display: flex; justify-content: center; padding: 40px 20px; background: #f5f5f5; }
  .receipt { background: #fff; width: 420px; padding: 32px 28px; border: 1px solid #ddd; }
  .receipt-header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
  .receipt-header h2 { font-size: 16px; letter-spacing: 1px; text-transform: uppercase; }
  .receipt-header p { font-size: 11px; color: #666; margin-top: 4px; }
  .meta { margin-bottom: 16px; font-size: 12px; color: #444; }
  .meta span { display: block; margin-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
  th { border-bottom: 1px solid #222; padding: 6px 4px; text-align: left; font-size: 11px; text-transform: uppercase; }
  td { padding: 7px 4px; border-bottom: 1px solid #eee; vertical-align: top; }
  .total-row { border-top: 2px solid #222; font-weight: bold; font-size: 13px; }
  .total-row td { padding-top: 10px; border-bottom: none; }
  .footer { text-align: center; font-size: 10px; color: #999; border-top: 2px dashed #ccc; padding-top: 12px; margin-top: 4px; }
</style>
</head>
<body>
<div class="receipt">
  <div class="receipt-header">
    <h2>🚌 Collection Receipt</h2>
    <p>Jeepney Management System</p>
    <p>Printed: ${now}</p>
  </div>
  <div class="meta">
    <span><strong>Period:</strong> ${dateRange}</span>
    <span><strong>Filter:</strong> ${batchLabel}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Batch</th>
        <th style="text-align:center">Tickets</th>
        <th style="text-align:right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${receiptRows || '<tr><td colspan="4" style="text-align:center;color:#999;padding:16px">No records</td></tr>'}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2">TOTAL</td>
        <td style="text-align:center">${collections.length}</td>
        <td style="text-align:right">${peso(totalAmt)}</td>
      </tr>
    </tfoot>
  </table>
  <div class="footer">System-generated receipt — not an official document</div>
</div>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank");
  if (w) setTimeout(() => { w.focus(); w.print(); }, 500);
  URL.revokeObjectURL(url);
}

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, count, total, accent }) {
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

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Report() {
  const [filters, setFilters] = useState({ startDate: "", endDate: "", batch: "all" });
  const [summary, setSummary] = useState(null);
  const [collections, setCollections] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const buildParams = useCallback(() => {
    const p = new URLSearchParams();
    if (filters.startDate) p.set("start_date", filters.startDate);
    if (filters.endDate) p.set("end_date", filters.endDate);
    return p.toString();
  }, [filters.startDate, filters.endDate]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    setShowAllCollections(false);
    try {
      const qs = buildParams();
      const q = qs ? `?${qs}` : "";
      const [sumRes, colRes, chartRes] = await Promise.all([
        fetch(`${API_BASE}/report/summary/${q}`),
        fetch(`${API_BASE}/report/collections/${q}`),
        fetch(`${API_BASE}/report/chart/${q}`),
      ]);
      const sumData = await sumRes.json();
      const colData = await colRes.json();
      const chartJson = await chartRes.json();
      setSummary(sumData);
      setCollections(colData.results || []);
      setChartData(chartJson.chart_data || []);
    } catch (e) {
      setError("Failed to load report data. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/logs/?all=true`);
      const data = await res.json();
      setLogs(data.logs || []);
      setLogsTotal(data.total || 0);
    } catch (e) {
      console.error("Failed to load logs");
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, []);

  // filtered by batch toggle
  const filteredCollections = collections.filter((r) => {
    if (filters.batch === "batch1") return r.batch === "Batch 1";
    if (filters.batch === "batch2") return r.batch === "Batch 2";
    return true;
  });

  // sliced for display
  const visibleCollections = showAllCollections ? filteredCollections : filteredCollections.slice(0, 5);
  const visibleLogs = showAllLogs ? logs : logs.slice(0, 5);

  const handleDateChange = (field, value) => {
    setFilters((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "endDate" && updated.startDate && value < updated.startDate) return prev;
      if (field === "startDate" && updated.endDate && value > updated.endDate) updated.endDate = "";
      return updated;
    });
  };

  const handleClearFilter = () => {
    setFilters({ startDate: "", endDate: "", batch: "all" });
    setTimeout(() => fetchData(), 0);
  };

  const handleExportCSV = () => {
    exportCSV(
      filteredCollections.map((r) => ({
        Date: r.issued_at, Batch: r.batch, "Ticket ID": r.id,
        Driver: r.driver, Vehicle: r.vehicle, Route: r.route,
        "Amount (PHP)": r.collection_amount,
      })),
      `collection_report_${Date.now()}.csv`
    );
  };

  const handleExportLogsCSV = () => {
    exportCSV(
      logs.map((l) => ({
        Timestamp: l.timestamp, "Ticket ID": l.ticket_id, Action: l.action,
        Driver: l.driver, Vehicle: l.vehicle, Route: l.route,
        Batch: l.batch, "Amount (PHP)": l.amount, User: l.user,
      })),
      `transaction_logs_${Date.now()}.csv`
    );
  };

  const handleExportPDF = () => exportPDF(filteredCollections, filters);

  return (
    <div style={{ padding: "24px 28px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Collection Reports</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>View and export collection data per batch and period.</p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* ─── Filter Bar ───────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <label style={labelStyle}>Start Date</label>
          <input type="date" value={filters.startDate} max={filters.endDate || undefined}
            onChange={(e) => handleDateChange("startDate", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>End Date</label>
          <input type="date" value={filters.endDate} min={filters.startDate || undefined}
            onChange={(e) => handleDateChange("endDate", e.target.value)} style={inputStyle} />
        </div>
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button onClick={fetchData} style={btnPrimary} disabled={loading}>
            {loading ? "Loading…" : "Apply Filter"}
          </button>
          <button onClick={handleClearFilter} style={btnSecondary}>Clear</button>
        </div>
      </div>

      {/* ─── Summary Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20, flexWrap: "wrap" }}>
        <SummaryCard label="Batch 1 (AM)" count={summary?.batch1?.count ?? 0} total={summary?.batch1?.total ?? 0} accent="#3b82f6" />
        <SummaryCard label="Batch 2 (PM)" count={summary?.batch2?.count ?? 0} total={summary?.batch2?.total ?? 0} accent="#f59e0b" />
        <SummaryCard label="Today" count={summary?.today?.count ?? 0} total={summary?.today?.total ?? 0} accent="#22c55e" />
        <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 160, color: "#fff" }}>
          <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grand Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 2px" }}>
            {summary?.total_tickets ?? 0}
            <span style={{ fontSize: 13, color: "#93c5fd", fontWeight: 400, marginLeft: 4 }}>tickets</span>
          </div>
          <div style={{ fontSize: 15, color: "#7dd3fc", fontWeight: 600 }}>{peso(summary?.grand_total ?? 0)}</div>
        </div>
      </div>

      {/* ─── Line Chart ───────────────────────────────────────────────────────── */}
      <div style={cardStyle}>
        <div style={cardHeaderStyle}>
          <span style={cardTitleStyle}>Daily Collections — Batch 1 vs Batch 2</span>
        </div>
        {chartData.length === 0 ? (
          <div style={emptyStyle}>No chart data for this period.</div>
        ) : (
          <div style={{ padding: "12px 8px 8px" }}>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                  formatter={(value, name) => name.includes("total") ? peso(value) : `${value} tickets`}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="batch1_count" name="Batch 1 — Tickets" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="batch2_count" name="Batch 2 — Tickets" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="batch1_total" name="Batch 1 — Collection (₱)" stroke="#93c5fd" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                <Line type="monotone" dataKey="batch2_total" name="Batch 2 — Collection (₱)" stroke="#fcd34d" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ─── Collection Records ───────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
        <div style={{ ...cardHeaderStyle, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={cardTitleStyle}>Collection Records</span>
            <div style={{ display: "flex", gap: 0, border: "1px solid #e2e8f0", borderRadius: 7, overflow: "hidden" }}>
              {[["all", "All"], ["batch1", "Batch 1"], ["batch2", "Batch 2"]].map(([val, lbl]) => (
                <button key={val} onClick={() => { setFilters((f) => ({ ...f, batch: val })); setShowAllCollections(false); }}
                  style={{ padding: "5px 14px", fontSize: 12, fontWeight: 600, border: "none",
                    background: filters.batch === val ? "#1e3a5f" : "#fff",
                    color: filters.batch === val ? "#fff" : "#475569", cursor: "pointer" }}>
                  {lbl}
                </button>
              ))}
            </div>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              {showAllCollections ? filteredCollections.length : Math.min(5, filteredCollections.length)} of {filteredCollections.length} record(s)
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleExportCSV} style={btnExport("#16a34a")}>⬇ CSV</button>
            <button onClick={handleExportPDF} style={btnExport("#1e3a5f")}>⬇ PDF</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                {["Date & Time", "Batch", "Ticket ID", "Driver", "Vehicle", "Route", "Amount"].map((h) => (
                  <th key={h} style={thStyle}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleCollections.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>No records found for this period.</td></tr>
              ) : (
                visibleCollections.map((r, i) => (
                  <tr key={r.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={tdStyle}>{r.issued_at}</td>
                    <td style={tdStyle}>
                      <span style={{ background: r.batch === "Batch 1" ? "#dbeafe" : "#fef3c7", color: r.batch === "Batch 1" ? "#1d4ed8" : "#92400e", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {r.batch}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: "monospace", fontSize: 11, color: "#475569" }}>{r.id}</td>
                    <td style={tdStyle}>{r.driver}</td>
                    <td style={tdStyle}>{r.vehicle}</td>
                    <td style={tdStyle}>{r.route}</td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: "#16a34a", textAlign: "right" }}>{peso(r.collection_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredCollections.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={6} style={{ ...tdStyle, fontWeight: 700, background: "#f1f5f9", textAlign: "right" }}>
                    Total ({filteredCollections.length} tickets)
                  </td>
                  <td style={{ ...tdStyle, fontWeight: 700, background: "#f1f5f9", textAlign: "right", color: "#16a34a" }}>
                    {peso(filteredCollections.reduce((s, r) => s + (parseFloat(r.collection_amount) || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {filteredCollections.length > 5 && (
          <div style={{ padding: "12px 18px", borderTop: "1px solid #e2e8f0", textAlign: "center" }}>
            <button onClick={() => setShowAllCollections((v) => !v)} style={btnSecondary}>
              {showAllCollections ? "Show Less" : `View All ${filteredCollections.length} Records`}
            </button>
          </div>
        )}
      </div>

      {/* ─── Transaction Logs ─────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginTop: 20 }}>
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
            <button onClick={handleExportLogsCSV} style={btnExport("#16a34a")}>⬇ Export CSV</button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>
                {["Timestamp", "Ticket ID", "Action", "Batch", "Driver", "Vehicle", "Route", "Amount", "User"].map((h) => (
                  <th key={h} style={{ ...thStyle, fontSize: 11 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleLogs.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>No logs available.</td></tr>
              ) : (
                visibleLogs.map((l, i) => (
                  <tr key={l.id + i} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc" }}>
                    <td style={{ ...tdStyle, fontSize: 11, color: "#475569" }}>{l.timestamp}</td>
                    <td style={{ ...tdStyle, fontSize: 11, fontFamily: "monospace" }}>{l.ticket_id}</td>
                    <td style={tdStyle}>
                      <span style={{ background: `${STATUS_COLORS[l.action] || "#e2e8f0"}22`, color: STATUS_COLORS[l.action] || "#475569", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {l.action}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: l.batch === "Batch 1" ? "#dbeafe" : "#fef3c7", color: l.batch === "Batch 1" ? "#1d4ed8" : "#92400e", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600 }}>
                        {l.batch}
                      </span>
                    </td>
                    <td style={tdStyle}>{l.driver}</td>
                    <td style={tdStyle}>{l.vehicle}</td>
                    <td style={tdStyle}>{l.route}</td>
                    <td style={{ ...tdStyle, textAlign: "right", color: "#16a34a", fontWeight: 600 }}>
                      {l.amount > 0 ? peso(l.amount) : "—"}
                    </td>
                    <td style={{ ...tdStyle, color: "#64748b" }}>{l.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─── Shared Styles ─────────────────────────────────────────────────────────────
const labelStyle = { display: "block", fontSize: 11, fontWeight: 600, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 };
const inputStyle = { padding: "7px 10px", border: "1px solid #cbd5e1", borderRadius: 6, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff" };
const btnPrimary = { background: "#1e3a5f", color: "#fff", border: "none", borderRadius: 6, padding: "7px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnSecondary = { background: "#f1f5f9", color: "#475569", border: "1px solid #e2e8f0", borderRadius: 6, padding: "7px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" };
const btnExport = (color) => ({ background: color, color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" });
const cardStyle = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden" };
const cardHeaderStyle = { padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 12 };
const cardTitleStyle = { fontSize: 14, fontWeight: 700, color: "#0f172a" };
const emptyStyle = { padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 };
const thStyle = { background: "#f1f5f9", padding: "9px 12px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#475569", borderBottom: "1px solid #e2e8f0", whiteSpace: "nowrap" };
const tdStyle = { padding: "9px 12px", borderBottom: "1px solid #f1f5f9", color: "#334155", whiteSpace: "nowrap" };
