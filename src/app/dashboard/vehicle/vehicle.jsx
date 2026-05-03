import React, { useState, useEffect } from "react";
import { apiService } from "../../../lib/api-service";

const DESTINATION = "San Fernando";

const EMPTY_FORM = {
  plate_number: "",
  route: "",          // route FK id (number or "")
  status: "AVAILABLE",
  active_driver: null,
};

const statusColor = {
  AVAILABLE: "bg-green-100 text-green-700",
  ON_TRIP: "bg-blue-100 text-blue-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
};

const statusLabel = {
  AVAILABLE: "Available",
  ON_TRIP: "On Trip",
  MAINTENANCE: "Under Maintenance",
};

// Field wrapper component — defined outside to prevent remount on re-render
const Field = ({ label, children }) => (
  <div>
    <label
      className="block text-xs font-semibold uppercase tracking-wider mb-1"
      style={{ color: "#1a2744" }}
    >
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent";

function Vehicle() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Route UI state
  // "select"  → pick from existing routes
  // "new"     → type a new origin to create
  // "edit"    → edit the origin of the currently-selected route (only when editing a vehicle)
  const [routeMode, setRouteMode] = useState("select");
  const [newOrigin, setNewOrigin] = useState("");   // used in "new" and "edit" modes
  const [routeError, setRouteError] = useState("");

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchDrivers = async () => {
    try {
      setError(null);
      const driversData = await apiService.getDrivers();
      setDrivers(driversData);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchRoutes = async () => {
    try {
      const routesData = await apiService.getRoutes();
      setRoutes(routesData);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchVehicles = async () => {
    try {
      const vehiclesData = await apiService.getVehicles();
      setVehicles(vehiclesData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Resolve the route ID to use before submitting ─────────────────────────
  // Returns { routeId, error } where routeId is a number or null.
  const resolveRouteId = async () => {
    if (routeMode === "select") {
      if (!form.route) return { routeId: null, err: "Please select a route." };
      return { routeId: form.route, err: null };
    }

    if (routeMode === "new") {
      const origin = newOrigin.trim();
      if (!origin) return { routeId: null, err: "Please enter a route origin." };

      // Check for duplicate (case-insensitive)
      const existing = routes.find(
        (r) => r.origin.toLowerCase() === origin.toLowerCase()
      );
      if (existing) {
        // Reuse the existing route silently
        return { routeId: existing.id, err: null };
      }

      // Create new route
      const created = await apiService.createRoute({ origin });
      setRoutes((prev) => [...prev, created]);
      return { routeId: created.id, err: null };
    }

    if (routeMode === "edit") {
      // Edit the origin of the currently-assigned route
      const origin = newOrigin.trim();
      if (!origin) return { routeId: null, err: "Please enter a route origin." };

      // Check if another route already has this origin
      const existing = routes.find(
        (r) =>
          r.origin.toLowerCase() === origin.toLowerCase() &&
          r.id !== form.route
      );
      if (existing) {
        // Reuse that route
        return { routeId: existing.id, err: null };
      }

      // PATCH the current route's origin
      const updated = await apiService.updateRoute(form.route, { origin });
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return { routeId: updated.id, err: null };
    }

    return { routeId: null, err: "Unknown route mode." };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRouteError("");

    const { routeId, err } = await resolveRouteId();
    if (err) {
      setRouteError(err);
      return;
    }

    try {
      const payload = {
        plate_number: form.plate_number,
        route: routeId,
        status: form.status,
        active_driver: form.active_driver || null,
      };

      if (editing) {
        await apiService.updateVehicle(editing.id, payload);
      } else {
        await apiService.createVehicle(payload);
      }

      fetchVehicles();
      closeModal();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (vehicle) => {
    setEditing(vehicle);
    setForm({
      plate_number: vehicle.plate_number,
      route: vehicle.route || "",        // route FK id
      status: vehicle.status,
      active_driver: vehicle.active_driver,
    });
    setRouteMode("select");
    setNewOrigin("");
    setRouteError("");
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setRouteMode("select");
    setNewOrigin("");
    setRouteError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setRouteMode("select");
    setNewOrigin("");
    setRouteError("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vehicle record?")) return;
    try {
      await apiService.deleteVehicle(id);
      fetchVehicles();
    } catch (err) {
      setError(err.message);
    }
  };

  const activeDrivers = drivers.filter((d) => d.status === "ACTIVE");

  // Find the selected route object (for display in edit mode)
  const selectedRoute = routes.find((r) => r.id === form.route || r.id === Number(form.route));

  // ── Route field UI ────────────────────────────────────────────────────────
  const RouteField = () => (
    <Field label="Route">
      {routeMode === "select" && (
        <>
          <select
            value={form.route}
            onChange={(e) => setForm({ ...form, route: e.target.value ? Number(e.target.value) : "" })}
            className={inputCls}
          >
            <option value="">— Select a route —</option>
            {routes.filter((r) => r.is_active).map((r) => (
              <option key={r.id} value={r.id}>
                {r.full_name}
              </option>
            ))}
          </select>
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => { setRouteMode("new"); setNewOrigin(""); }}
              className="text-xs underline"
              style={{ color: "#1a2744" }}
            >
              + Add new route
            </button>
            {editing && form.route && (
              <button
                type="button"
                onClick={() => {
                  setRouteMode("edit");
                  setNewOrigin(selectedRoute?.origin ?? "");
                }}
                className="text-xs underline ml-2"
                style={{ color: "#c9a84c" }}
              >
                Edit this route's origin
              </button>
            )}
          </div>
        </>
      )}

      {routeMode === "new" && (
        <>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. Lingsat"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              className={inputCls}
              style={{ flex: 1 }}
              autoFocus
            />
            <span className="text-sm text-gray-500 whitespace-nowrap px-2">
              — {DESTINATION}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Destination is always <strong>{DESTINATION}</strong>. Enter the origin only.
          </p>
          <button
            type="button"
            onClick={() => { setRouteMode("select"); setNewOrigin(""); }}
            className="text-xs underline mt-1"
            style={{ color: "#1a2744" }}
          >
            ← Back to route list
          </button>
        </>
      )}

      {routeMode === "edit" && (
        <>
          <div className="flex items-center gap-1">
            <input
              type="text"
              placeholder="e.g. Lingsat"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              className={inputCls}
              style={{ flex: 1 }}
              autoFocus
            />
            <span className="text-sm font-semibold text-gray-600 whitespace-nowrap px-2">
              — {DESTINATION}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            <strong>{DESTINATION}</strong> is fixed. You can only change the origin.
          </p>
          <button
            type="button"
            onClick={() => { setRouteMode("select"); setNewOrigin(""); }}
            className="text-xs underline mt-1"
            style={{ color: "#1a2744" }}
          >
            ← Cancel edit
          </button>
        </>
      )}

      {routeError && (
        <p className="text-xs text-red-600 mt-1">{routeError}</p>
      )}
    </Field>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="pb-4 mb-2 border-b-2" style={{ borderColor: "#1a2744" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded" style={{ background: "#c9a84c" }} />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{ color: "#1a2744", fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
              Vehicle Registry
              </h1>
              <p className="text-xs text-gray-500 uppercase tracking-wider mt-0.5">
                Manage registered vehicles and driver assignments
              </p>
            </div>
          </div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded transition"
            style={{ background: "#1a2744" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" /><path d="M12 5v14" />
            </svg>
            Register Vehicle
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded border border-red-200 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      ) : (
        <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr style={{ background: "#1a2744" }}>
                {["Code", "Plate Number", "Route", "Active Driver", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="p-3 text-left text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">
                    No vehicle records found.
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle, idx) => (
                  <tr
                    key={vehicle.id}
                    className={`border-b border-gray-100 hover:bg-gray-50 transition ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}
                  >
                    <td className="p-3 text-sm font-medium text-gray-700">{vehicle.code}</td>
                    <td className="p-3 text-sm font-semibold">{vehicle.plate_number}</td>
                    <td className="p-3 text-sm">
                      {vehicle.route_detail
                        ? vehicle.route_detail.full_name
                        : <span className="text-gray-400 italic">No route</span>}
                    </td>
                    <td className="p-3 text-sm">
                      {vehicle.active_driver_name || (
                        <span className="text-gray-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${statusColor[vehicle.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {statusLabel[vehicle.status] || vehicle.status}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="px-3 py-1 text-xs font-semibold rounded transition"
                        style={{ background: "#c9a84c", color: "#1a2744" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle.id)}
                        className="px-3 py-1 text-xs font-semibold text-white rounded transition bg-red-600 hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="p-4 flex items-center justify-between" style={{ background: "#1a2744" }}>
              <h2
                className="font-semibold text-white"
                style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}
              >
                {editing ? "Edit Vehicle Record" : "Register New Vehicle"}
              </h2>
              <button onClick={closeModal} className="text-white/60 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="p-4 space-y-3">
              {!editing && (
                <Field label="Plate Number">
                  <input
                    type="text"
                    placeholder="e.g. ABC 1234"
                    value={form.plate_number}
                    onChange={(e) => setForm({ ...form, plate_number: e.target.value })}
                    required
                    className={inputCls}
                  />
                </Field>
              )}

              <RouteField />

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={inputCls}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </Field>

              <Field label="Active Driver (Optional)">
                <select
                  value={form.active_driver || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active_driver: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  className={inputCls}
                >
                  <option value="">— None / Unassigned —</option>
                  {activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Only active drivers are shown.</p>
              </Field>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 text-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-sm font-semibold text-white rounded transition"
                  style={{ background: "#1a2744" }}
                >
                  {editing ? "Update Record" : "Register Vehicle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicle;
