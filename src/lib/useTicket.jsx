import { useState, useEffect, useMemo } from "react";
import { OperationsService } from "./operations-service";
import { TICKET_FEE, SHIFTS } from "./constants";
import { apiService } from "./api-service";

// ─── Constants ─────────────────────────────────────────────────────────────────
export const statusColor = {
  ISSUED: "bg-yellow-100 text-yellow-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  COLLECTED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

// ─── Helper Functions ────────────────────────────────────────────────────────
export const formatTime = (dateString) => {
  try {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "N/A";
  }
};

// Returns the current batch ("Batch 1" | "Batch 2" | null)
export const getCurrentBatch = () => {
  const hour = new Date().getHours();
  if (hour >= SHIFTS.BATCH_1.startHour && hour < SHIFTS.BATCH_1.endHour)
    return SHIFTS.BATCH_1.name;
  if (hour >= SHIFTS.BATCH_2.startHour && hour < SHIFTS.BATCH_2.endHour)
    return SHIFTS.BATCH_2.name;
  return null;
};

// Returns true if this vehicle already has a non-cancelled ticket in Batch 1 today
export const hadBatch1TicketToday = (vehicleId, tickets) => {
  const todayStr = new Date().toISOString().split("T")[0];
  return tickets.some((t) => {
    if (t.vehicle?.id !== vehicleId) return false;
    if (t.status === "CANCELLED") return false;
    const ticketDate = t.issued_at?.split("T")[0];
    return (
      ticketDate === todayStr &&
      OperationsService.getShiftBatchName(t.issued_at) === SHIFTS.BATCH_1.name
    );
  });
};

// ─── Custom Hook ──────────────────────────────────────────────────────────────
export function useTicket() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [issuingTicket, setIssuingTicket] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [issueError, setIssueError] = useState("");
  const [missedBatchWarning, setMissedBatchWarning] = useState("");
  const [overrideMissedBatch, setOverrideMissedBatch] = useState(false);

  // Fetch data
  const fetchTickets = async () => {
    try {
      setLoading(true);
      setTickets(await apiService.getTickets());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setVehicles(await apiService.getVehicles());
    } catch {
      /* silent */
    }
  };

  const fetchDrivers = async () => {
    try {
      setDrivers(await apiService.getDrivers());
    } catch {
      /* silent */
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTickets();
    fetchVehicles();
    fetchDrivers();
  }, []);

  // Filter and sort tickets based on search term
  useEffect(() => {
    const filtered = tickets.filter(
      (t) =>
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.vehicle?.plate_number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (t.driver?.name || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
    const sorted = filtered.sort(
      (a, b) => new Date(b.issued_at) - new Date(a.issued_at),
    );
    setFilteredTickets(sorted.slice(0, 10));
  }, [searchTerm, tickets]);

  // Vehicle change handler
  const handleVehicleChange = (e) => {
    const vehicleId = parseInt(e.target.value);
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    setSelectedVehicle(vehicle || null);
    setMissedBatchWarning("");
    setOverrideMissedBatch(false);
    setIssueError("");
    if (vehicle?.active_driver) {
      setSelectedDriver(
        drivers.find((d) => d.id === vehicle.active_driver) || null,
      );
    } else {
      setSelectedDriver(null);
    }
  };

  // Driver change handler
  const handleDriverChange = (driverId) => {
    setSelectedDriver(drivers.find((d) => d.id === driverId) || null);
    setShowDriverModal(false);
  };

  // Issue ticket handler
  const handleIssueTicket = async () => {
    setSuccessMessage("");
    setIssueError("");
    setMissedBatchWarning("");

    if (!selectedVehicle) {
      setIssueError("Please select a vehicle.");
      return;
    }
    if (!selectedDriver) {
      setIssueError("Please select a driver.");
      return;
    }

    // Batch window check
    const currentBatch = getCurrentBatch();
    if (!currentBatch) {
      const hour = new Date().getHours();
      const tooEarly = hour < SHIFTS.BATCH_1.startHour;
      setIssueError(
        tooEarly
          ? `Ticket issuance hasn't opened yet. Batch 1 starts at ${SHIFTS.BATCH_1.startHour}:00 AM.`
          : `Ticket issuance is closed. Operations end at ${SHIFTS.BATCH_2.endHour}:00 PM.`,
      );
      return;
    }

    // Vehicle must be AVAILABLE
    if (!["AVAILABLE", "DISPATCHED"].includes(selectedVehicle.status)) {
      setIssueError(
        `Vehicle is currently ${selectedVehicle.status} and cannot be ticketed.`,
      );
      return;
    }

    // Driver must be ACTIVE
    if (selectedDriver.status !== "ACTIVE") {
      setIssueError("Selected driver is not active and cannot be assigned.");
      return;
    }

    try {
      setIssuingTicket(true);
      const now = new Date();
      const ticketId = `TICKET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      const isLate = overrideMissedBatch;
      const newTicket = await apiService.createTicket({
        id: ticketId,
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        route: selectedVehicle.route_detail?.full_name || "",
        status: "ISSUED",
        collection_amount: TICKET_FEE,
        is_verified: false,
        is_late: isLate,
        intended_batch: isLate ? SHIFTS.BATCH_1.name : "",
      });

      await apiService.patch(`/vehicles/${selectedVehicle.id}/`, {
        status: "QUEUED",
      });

      setSuccessMessage(`Ticket ${newTicket.id} issued successfully.`);
      fetchTickets();
      fetchVehicles();
      setSelectedVehicle(null);
      setSelectedDriver(null);
      setShowDriverModal(false);
      setOverrideMissedBatch(false);
      setMissedBatchWarning("");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setIssueError(err.message || "Error issuing ticket");
    } finally {
      setIssuingTicket(false);
    }
  };

  // Computed values
  const availableVehicles = useMemo(
    () =>
      vehicles.filter((v) => ["AVAILABLE", "DISPATCHED"].includes(v.status)),
    [vehicles],
  );

  return {
    // State
    tickets,
    filteredTickets,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    vehicles,
    drivers,
    selectedVehicle,
    setSelectedVehicle,
    selectedDriver,
    setSelectedDriver,
    showDriverModal,
    setShowDriverModal,
    issuingTicket,
    successMessage,
    issueError,
    missedBatchWarning,
    overrideMissedBatch,
    setOverrideMissedBatch,
    // Computed
    availableVehicles,
    // Actions
    fetchTickets,
    handleVehicleChange,
    handleDriverChange,
    handleIssueTicket,
  };
}
