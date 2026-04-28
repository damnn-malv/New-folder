import { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TICKET_FEE } from "../../lib/constants";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";


const peso = (n) => {
  const num = parseFloat(n);
  if (isNaN(num)) return "₱0.00";
  return "₱" + num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// ─── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderTop: `4px solid ${accent}`,
      borderRadius: 10,
      padding: "18px 20px",
      flex: 1,
      minWidth: 160,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          {label}
        </div>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color: "#0f172a", margin: "6px 0 2px" }}>{value}</div>
      {sub && <div style={{ fontSize: 13, color: accent, fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        const [statsRes, chartRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/stats/`),
          fetch(`${API_BASE}/report/chart/`),
        ]);
        const statsData = await statsRes.json();
        const chartJson = await chartRes.json();
        setStats(statsData);
        // Last 14 days for dashboard chart
        const data = (chartJson.chart_data || []).slice(-14);
        setChartData(data);
      } catch (e) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  return (
    <div style={{ padding: "24px 28px", background: "#f8fafc", minHeight: "100vh", fontFamily: "'Segoe UI', sans-serif" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>Dashboard</h1>
        <p style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>
          Overview of today's operations and collections.
        </p>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: "10px 16px", color: "#b91c1c", marginBottom: 16, fontSize: 13 }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>Loading…</div>
      ) : (
        <>
          {/* ─── Today's Batch Cards ──────────────────────────────────────────── */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              Today's Collections
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <StatCard
                label="Batch 1 (AM)"
                value={stats?.batch1_today?.count ?? 0}
                sub={peso((stats?.batch1_today?.count ?? 0) * TICKET_FEE)}
                accent="#3b82f6"
                icon="🌅"
              />
              <StatCard
                label="Batch 2 (PM)"
                value={stats?.batch2_today?.count ?? 0}
                sub={peso((stats?.batch2_today?.count ?? 0) * TICKET_FEE)}
                accent="#f59e0b"
                icon="🌇"
              />
              <StatCard
                label="Today Total"
                value={stats?.today_total?.count ?? 0}
                sub={peso((stats?.today_total?.count ?? 0) * TICKET_FEE)}
                accent="#22c55e"
                icon="📋"
              />
            </div>
          </div>

          {/* ─── Overall Stats ────────────────────────────────────────────────── */}
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>
              Overall
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <StatCard
                label="Total Revenue"
                value={peso((stats?.total_tickets ?? 0) * TICKET_FEE)}
                sub={`${stats?.total_tickets ?? 0} tickets`}
                accent="#8b5cf6"
                icon="💰"
              />
              <StatCard
                label="All Tickets"
                value={stats?.total_tickets ?? 0}
                sub="all statuses"
                accent="#0ea5e9"
                icon="🎫"
              />
              <StatCard
                label="Active Vehicles"
                value={stats?.active_vehicles ?? 0}
                accent="#14b8a6"
                icon="🚌"
              />
              <StatCard
                label="Active Drivers"
                value={stats?.active_drivers ?? 0}
                accent="#f43f5e"
                icon="👤"
              />
            </div>
          </div>

          {/* ─── Line Chart ──────────────────────────────────────────────────── */}
          <div style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            marginTop: 24,
            overflow: "hidden",
          }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                Collections Per Day — Batch 1 vs Batch 2
              </span>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Last 14 days</span>
            </div>
            {chartData.length === 0 ? (
              <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
                No data available for chart.
              </div>
            ) : (
              <div style={{ padding: "16px 8px 8px" }}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Tooltip
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                      formatter={(value, name) =>
                        name.includes("total")
                          ? `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
                          : `${value} tickets`
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line
                      type="monotone"
                      dataKey="batch1_count"
                      name="Batch 1 — Tickets"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch2_count"
                      name="Batch 2 — Tickets"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch1_total"
                      name="Batch 1 — Amount (₱)"
                      stroke="#93c5fd"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="batch2_total"
                      name="Batch 2 — Amount (₱)"
                      stroke="#fcd34d"
                      strokeWidth={1.5}
                      strokeDasharray="5 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
