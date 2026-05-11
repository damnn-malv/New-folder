import {
  RouteField,
  Field,
  useVehicle,
  STATUS_COLOR,
  STATUS_LABEL,
} from "../../../lib/vehicle/vehicleHook";

import React, { useState, useEffect } from "react";
import { apiService } from "../../../lib/api-service";
import { useConfirm } from "../../../components/ui/ToastConfirmContext";

import "../../../styles/Vehicle.css";

function Vehicle() {
  const {
    vehicles,
    loading,
    error,
    editing,
    isModalOpen,
    form,
    setForm,
    routeMode,
    setRouteMode,
    newOrigin,
    setNewOrigin,
    routeError,
    selectedRoute,
    activeDrivers,
    routes,
    handleSubmit,
    handleEdit,
    handleAdd,
    closeModal,
    handleDelete,
  } = useVehicle();

  const [drivers, setDrivers] = useState([]);

  const showConfirm = useConfirm();

  useEffect(() => {
    fetchVehicles();
    fetchDrivers();
    fetchRoutes();
  }, []);

  const fetchDrivers = async () => {
    try {
      setError(null);
      const d = await apiService.getDrivers();
      setDrivers(d);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchRoutes = async () => {
    try {
      const r = await apiService.getRoutes();
      setRoutes(r);
    } catch (err) {
      console.error(err.message);
    }
  };

  const fetchVehicles = async () => {
    try {
      const v = await apiService.getVehicles();
      setVehicles(v);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resolveRouteId = async () => {
    if (routeMode === "select") {
      if (!form.route) return { routeId: null, err: "Please select a route." };
      return { routeId: form.route, err: null };
    }
    if (routeMode === "new") {
      const origin = newOrigin.trim();
      if (!origin)
        return { routeId: null, err: "Please enter a route origin." };
      const existing = routes.find(
        (r) => r.origin.toLowerCase() === origin.toLowerCase(),
      );
      if (existing) return { routeId: existing.id, err: null };
      const created = await apiService.createRoute({ origin });
      setRoutes((prev) => [...prev, created]);
      return { routeId: created.id, err: null };
    }
    if (routeMode === "edit") {
      const origin = newOrigin.trim();
      if (!origin)
        return { routeId: null, err: "Please enter a route origin." };
      const existing = routes.find(
        (r) =>
          r.origin.toLowerCase() === origin.toLowerCase() &&
          r.id !== form.route,
      );
      if (existing) return { routeId: existing.id, err: null };
      const updated = await apiService.updateRoute(form.route, { origin });
      setRoutes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      return { routeId: updated.id, err: null };
    }
    return { routeId: null, err: "Unknown route mode." };
  };

  const RouteField = () => (
    <Field label="Route">
      {routeMode === "select" && (
        <>
          <select
            className="veh-select"
            value={form.route}
            onChange={(e) =>
              setForm({
                ...form,
                route: e.target.value ? Number(e.target.value) : "",
              })
            }
          >
            <option value="">— Select a route —</option>
            {routes
              .filter((r) => r.is_active)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.full_name}
                </option>
              ))}
          </select>
          <div className="veh-route-actions">
            <button
              type="button"
              className="veh-text-btn veh-text-btn--navy"
              onClick={() => {
                setRouteMode("new");
                setNewOrigin("");
              }}
            >
              + Add new route
            </button>
            {editing && form.route && (
              <button
                type="button"
                className="veh-text-btn veh-text-btn--gold"
                onClick={() => {
                  setRouteMode("edit");
                  setNewOrigin(selectedRoute?.origin ?? "");
                }}
              >
                Edit this route's origin
              </button>
            )}
          </div>
        </>
      )}

      {(routeMode === "new" || routeMode === "edit") && (
        <>
          <div className="veh-route-input-row">
            <input
              type="text"
              className="veh-input"
              placeholder="e.g. Lingsat"
              value={newOrigin}
              onChange={(e) => setNewOrigin(e.target.value)}
              autoFocus
            />
            <span className="veh-route-dest">— {DESTINATION}</span>
          </div>
          <p className="veh-field-hint">
            Destination is always <strong>{DESTINATION}</strong>. Enter the
            origin only.
          </p>
          <button
            type="button"
            className="veh-text-btn veh-text-btn--navy"
            onClick={() => {
              setRouteMode("select");
              setNewOrigin("");
            }}
          >
            ← {routeMode === "edit" ? "Cancel edit" : "Back to route list"}
          </button>
        </>
      )}

      {routeError && <p className="veh-field-error">{routeError}</p>}
    </Field>
  );

  return (
    <div className="veh-page">
      {/* Header */}
      <div className="veh-header">
        <div className="veh-header-left">
          <div className="veh-header-accent" />
          <div>
            <h1 className="veh-title">Vehicle Registry</h1>
            <p className="veh-subtitle">
              Manage registered vehicles and driver assignments
            </p>
          </div>
        </div>
        <button className="veh-add-btn" onClick={handleAdd}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
          </svg>
          Register Vehicle
        </button>
      </div>

      {error && (
        <div className="veh-alert">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="veh-card">
        <div className="veh-table-wrap">
          <table className="veh-table">
            <thead>
              <tr>
                {[
                  "Code",
                  "Plate Number",
                  "Route",
                  "Active Driver",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="veh-table-state">
                    <div className="veh-loading-dots">
                      <div />
                      <div />
                      <div />
                    </div>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="veh-table-state">
                    <svg
                      width="32"
                      height="32"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      opacity="0.3"
                    >
                      <rect x="1" y="3" width="15" height="13" rx="1" />
                      <path d="M16 8h4l3 3v5h-7V8z" />
                      <circle cx="5.5" cy="18.5" r="2.5" />
                      <circle cx="18.5" cy="18.5" r="2.5" />
                    </svg>
                    <span>No vehicle records found</span>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr key={vehicle.id} className="veh-row">
                    <td>
                      <span className="veh-code">{vehicle.code}</span>
                    </td>
                    <td>
                      <span className="veh-plate">{vehicle.plate_number}</span>
                    </td>
                    <td className="veh-td-route">
                      {vehicle.route_detail ? (
                        vehicle.route_detail.full_name
                      ) : (
                        <span className="veh-na">No route</span>
                      )}
                    </td>
                    <td className="veh-td-driver">
                      {vehicle.active_driver_name || (
                        <span className="veh-na">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`veh-status ${STATUS_COLOR[vehicle.status] || "veh-status--default"}`}
                      >
                        {STATUS_LABEL[vehicle.status] || vehicle.status}
                      </span>
                    </td>
                    <td>
                      <div className="veh-actions">
                        <button
                          className="veh-btn veh-btn--edit"
                          onClick={() => handleEdit(vehicle)}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          className="veh-btn veh-btn--delete"
                          onClick={() => handleDelete(vehicle.id)}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="veh-overlay" onClick={closeModal}>
          <div className="veh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="veh-modal-header">
              <div className="veh-modal-header-left">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c9a84c"
                  strokeWidth="2"
                >
                  <rect x="1" y="3" width="15" height="13" rx="1" />
                  <path d="M16 8h4l3 3v5h-7V8z" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                <h2 className="veh-modal-title">
                  {editing ? "Edit Vehicle Record" : "Register New Vehicle"}
                </h2>
              </div>
              <button
                className="veh-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="veh-modal-body">
              {!editing && (
                <Field label="Plate Number">
                  <input
                    type="text"
                    className="veh-input"
                    placeholder="e.g. ABC 1234"
                    value={form.plate_number}
                    onChange={(e) =>
                      setForm({ ...form, plate_number: e.target.value })
                    }
                    required
                  />
                </Field>
              )}

              <RouteField
                routes={routes}
                form={form}
                setForm={setForm}
                routeMode={routeMode}
                setRouteMode={setRouteMode}
                newOrigin={newOrigin}
                setNewOrigin={setNewOrigin}
                routeError={routeError}
                editing={editing}
                selectedRoute={selectedRoute}
              />

              <Field label="Status">
                <select
                  className="veh-select"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="AVAILABLE">Available</option>
                  <option value="ON_TRIP">On Trip</option>
                  <option value="MAINTENANCE">Under Maintenance</option>
                </select>
              </Field>

              <Field label="Active Driver (Optional)">
                <select
                  className="veh-select"
                  value={form.active_driver || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      active_driver: e.target.value
                        ? parseInt(e.target.value)
                        : null,
                    })
                  }
                >
                  <option value="">— None / Unassigned —</option>
                  {activeDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                <p className="veh-field-hint">Only active drivers are shown.</p>
              </Field>

              <div className="veh-modal-footer">
                <button
                  type="button"
                  className="veh-modal-btn veh-modal-btn--cancel"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="veh-modal-btn veh-modal-btn--submit"
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
