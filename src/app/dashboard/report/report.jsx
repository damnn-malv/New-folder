import { useState, useEffect, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TICKET_FEE } from "../../../lib/constants";
import { exportPDF } from "../../../lib/report/exportPDF";
import {DataTable} from '../../../components/ui/dataTable'
import {peso, STATUS_COLORS, today, exportCSV, SummaryCard, handleDateChange, handleClearFilter, handleExportCSV, handleExportLogsCSV, handleExportVehiclesCSV, handleExportDriversCSV, handleExportPDF} from '../../../lib/report/reportHook'

import CollectionRecords from "../../../lib/report/tables/CollectionRecords";
import TransactionLogs from '../../../lib/report/tables/TransactionLogs';
import VehicleRecords from "../../../lib/report/tables/VehicleRecords";
import DriverRecords from "../../../lib/report/tables/DriverRecords";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Report() {
  const [filters, setFilters] = useState({ startDate: today, endDate: today, batch: "all" });
  const [summary, setSummary] = useState(null);
  const [collections, setCollections] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesTotal, setVehiclesTotal] = useState(0);
  const [drivers, setDrivers] = useState([]);
  const [driversTotal, setDriversTotal] = useState(0);
  const [showAllCollections, setShowAllCollections] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showAllVehicles, setShowAllVehicles] = useState(false);
  const [showAllDrivers, setShowAllDrivers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

 

  const fetchVehicles = useCallback(async () => {
    try {
      console.log("Fetching vehicles from:", `${API_BASE}/vehicles/`);
      const res = await fetch(`${API_BASE}/vehicles/`);
      const data = await res.json();
      console.log("Vehicle Records API Response:", data);
      console.log("Status:", res.status, "OK:", res.ok);
      if (!res.ok) {
        console.error("API returned error status");
      }
      setVehicles(Array.isArray(data) ? data : data.vehicles || []);
      setVehiclesTotal(Array.isArray(data) ? data.length : data.total || 0);
    } catch (e) {
      console.error("Failed to load vehicle records:", e);
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      console.log("Fetching drivers from:", `${API_BASE}/drivers/`);
      const res = await fetch(`${API_BASE}/drivers/`);
      const data = await res.json();
      console.log("Driver Records API Response:", data);
      if (!res.ok) {
        console.error("API returned error status");
      }
      setDrivers(Array.isArray(data) ? data : data.drivers || []);
      setDriversTotal(Array.isArray(data) ? data.length : data.total || 0);
    } catch (e) {
      console.error("Failed to load driver records:", e);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLogs();
    fetchVehicles();
    fetchDrivers();
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
  const visibleVehicles = showAllVehicles ? vehicles : vehicles.slice(0, 5);
  const visibleDrivers = showAllDrivers ? drivers : drivers.slice(0, 5);

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
        "Amount (PHP)": (r.ticket_count || 1) * TICKET_FEE,
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

  const handleExportVehiclesCSV = () => {
    exportCSV(
      vehicles.map((v) => ({
        Code: v.code, "Plate Number": v.plate_number,
        Route: v.route_detail ? `${v.route_detail.origin} - San Fernando` : v.route,
        Driver: v.active_driver_name || "—",
      })),
      `vehicle_records_${Date.now()}.csv`
    );
  };

  const handleExportDriversCSV = () => {
    exportCSV(
      drivers.map((d) => ({
        Code: d.code, Name: d.name, "Contact Number": d.contact_number,
      })),
      `driver_records_${Date.now()}.csv`
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
        <SummaryCard label="Batch 1 (AM)" count={summary?.batch1?.count ?? 0} total={(summary?.batch1?.count ?? 0) * TICKET_FEE} accent="#3b82f6" />
        <SummaryCard label="Batch 2 (PM)" count={summary?.batch2?.count ?? 0} total={(summary?.batch2?.count ?? 0) * TICKET_FEE} accent="#f59e0b" />
        <SummaryCard label="Today" count={summary?.today?.count ?? 0} total={(summary?.today?.count ?? 0) * TICKET_FEE} accent="#22c55e" />
        <div style={{ background: "#1e3a5f", borderRadius: 10, padding: "18px 20px", flex: 1, minWidth: 160, color: "#fff" }}>
          <div style={{ fontSize: 12, color: "#93c5fd", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>Grand Total</div>
          <div style={{ fontSize: 26, fontWeight: 700, margin: "6px 0 2px" }}>
            {summary?.total_tickets ?? 0}
            <span style={{ fontSize: 13, color: "#93c5fd", fontWeight: 400, marginLeft: 4 }}>tickets</span>
          </div>
          <div style={{ fontSize: 15, color: "#7dd3fc", fontWeight: 600 }}>{peso((summary?.total_tickets ?? 0) * TICKET_FEE)}</div>
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
      <CollectionRecords
        filters={filters}
        setFilters={setFilters}
        showAllCollections={showAllCollections}
        setShowAllCollections={setShowAllCollections}
        filteredCollections={filteredCollections}
        visibleCollections={showAllCollections ? filteredCollections : filteredCollections.slice(0, 5)}
        handleExportCSV={handleExportCSV}
        handleExportPDF={handleExportPDF}
        peso={peso}
        cardStyle={cardStyle}
        cardHeaderStyle={cardHeaderStyle}
        cardTitleStyle={cardTitleStyle}
        btnExport={btnExport}
        btnSecondary={btnSecondary}
      />

      {/* ─── Transaction Logs ─────────────────────────────────────────────────── */}
      <TransactionLogs
        logsTotal={logsTotal}
        showAllLogs={showAllLogs}
        setShowAllLogs={setShowAllLogs}
        visibleLogs={showAllLogs ? logs : logs.slice(0, 5)}
        handleExportLogsCSV={handleExportLogsCSV}
        STATUS_COLORS={STATUS_COLORS}
        cardStyle={cardStyle}
        cardHeaderStyle={cardHeaderStyle}
        cardTitleStyle={cardTitleStyle}
        btnExport={btnExport}
        btnSecondary={btnSecondary}
      />

      {/* ─── Vehicle Records ─────────────────────────────────────────────────── */}
      <VehicleRecords
        vehiclesTotal={vehiclesTotal}
        showAllVehicles={showAllVehicles}
        setShowAllVehicles={setShowAllVehicles}
        visibleVehicles={showAllVehicles ? vehicles : vehicles.slice(0, 5)}
        handleExportVehiclesCSV={handleExportVehiclesCSV}
        cardStyle={cardStyle}
        cardHeaderStyle={cardHeaderStyle}
        cardTitleStyle={cardTitleStyle}
        btnExport={btnExport}
        btnSecondary={btnSecondary}
      />

      {/* ─── Driver Records ──────────────────────────────────────────────────── */}
      <DriverRecords
        driversTotal={driversTotal}
        showAllDrivers={showAllDrivers}
        setShowAllDrivers={setShowAllDrivers}
        visibleDrivers={showAllDrivers ? drivers : drivers.slice(0, 5)}
        handleExportDriversCSV={handleExportDriversCSV}
        cardStyle={cardStyle}
        cardHeaderStyle={cardHeaderStyle}
        cardTitleStyle={cardTitleStyle}
        btnExport={btnExport}
        btnSecondary={btnSecondary}
      />

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