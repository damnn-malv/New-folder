import { useState, useEffect } from "react";
import { apiService } from "./api-service";

const EMPTY_FORM = { name: "", contact: "", status: "ACTIVE" };

// Field defined OUTSIDE component to prevent remount (fixes input deselect bug)
export const Field = ({ label, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "#1a2744" }}>{label}</label>
    {children}
  </div>
);

export const inputCls = "w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2";

export function useDriver() {
  const [drivers, setDrivers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => { fetchDrivers(); fetchTickets(); }, []);

  const fetchDrivers = async () => {
    try {
      const data = await apiService.getDrivers();
      setDrivers(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchTickets = async () => {
    try {
      const data = await apiService.getTickets();
      setTickets(data);
    } catch { /* non-critical */ }
  };

  // Check if driver has an active (ISSUED or DISPATCHED) ticket
  const isDriverOnActiveTicket = (driverId) =>
    tickets.some((t) => t.driver?.id === driverId && (t.status === "ISSUED" || t.status === "DISPATCHED"));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Guard: cannot set INACTIVE if driver has an active ticket
    if (editing && form.status === "INACTIVE" && isDriverOnActiveTicket(editing.id)) {
      setError("Cannot set driver to Inactive — this driver has an active ticket. Resolve the ticket first.");
      return;
    }
    try {
      if (editing) {
        await apiService.updateDriver(editing.id, form);
      } else {
        await apiService.createDriver(form);
      }
      fetchDrivers();
      closeModal();
    } catch (err) { setError(err.message); }
  };

  const handleEdit = (driver) => {
    setEditing(driver);
    setForm({ ...driver });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
  };

  const handleDelete = async (id) => {
    if (isDriverOnActiveTicket(id)) {
      alert("Cannot delete this driver — they have an active ticket. Resolve the ticket first.");
      return;
    }
    if (!confirm("Are you sure you want to remove this driver record?")) return;
    try {
      await apiService.deleteDriver(id);
      fetchDrivers();
    } catch (err) { setError(err.message); }
  };

  return {
    drivers,
    loading,
    error,
    editing,
    isModalOpen,
    form,
    setForm,
    isDriverOnActiveTicket,
    handleSubmit,
    handleEdit,
    handleAdd,
    closeModal,
    handleDelete,
  };
}