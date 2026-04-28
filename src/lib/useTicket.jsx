import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { OperationsService } from "./operations-service";
import { apiService } from "./api-service";
import { SHIFTS, TICKET_FEE } from "./constants";

/**
 * useTicket
 * - Manages tickets, vehicles, drivers, and ticket issuance flow
 * - Preserves original business rules (batch checks, missed batch warning)
 */
export function useTicket() {
  // State
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

  // Mounted guard to avoid setState after unmount
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Helper: show success and auto-clear
  const showSuccess = useCallback((msg, ms = 3000) => {
    if (!isMounted.current) return;
    setSuccessMessage(msg);
    setTimeout(() => {
      if (isMounted.current) setSuccessMessage("");
    }, ms);
  }, []);

  // Helper: patch many tickets in parallel (returns counts)
  const patchTickets = useCallback(async (ticketsToPatch = [], payload = {}) => {
    if (!ticketsToPatch.length) return { success: 0, failed: 0, results: [] };

    const promises = ticketsToPatch.map((t) =>
      apiService.patch(`/tickets/${t.id}/`, payload)
        .then((res) => ({ status: "fulfilled", id: t.id, res }))
        .catch((err) => ({ status: "rejected", id: t.id, err }))
    );

    const results = await Promise.all(promises);
    const success = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - success;
    return { success, failed, results };
  }, []);

  // Fetchers
  const fetchTickets = useCallback(async () => {
    try {
      if (isMounted.current) setLoading(true);
      const data = await apiService.getTickets();
      if (isMounted.current) {
        setTickets(data || []);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message || "Failed to fetch tickets");
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, []);

  const fetchVehicles = useCallback(async () => {
    try {
      const data = await apiService.getVehicles();
      if (isMounted.current) setVehicles(data || []);
    } catch {
      /* silent */
    }
  }, []);

  const fetchDrivers = useCallback(async () => {
    try {
      const data = await apiService.getDrivers();
      if (isMounted.current) setDrivers(data || []);
    } catch {
      /* silent */
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchTickets();
    fetchVehicles();
    fetchDrivers();
  }, [fetchTickets, fetchVehicles, fetchDrivers]);

  // Filter + sort tickets (memoized) and keep top 10 in filteredTickets state
  useEffect(() => {
    const term = (searchTerm || "").trim().toLowerCase();
    const filtered = tickets.filter((t) => {
      if (!term) return true;
      const fields = [
        t.id,
        t.vehicle?.plate_number,
        t.driver?.name,
        t.vehicle?.route,
      ];
      return fields.some((f) => (f || "").toString().toLowerCase().includes(term));
    });

    const sorted = filtered.slice().sort((a, b) => new Date(b.issued_at) - new Date(a.issued_at));
    if (isMounted.current) setFilteredTickets(sorted.slice(0, 10));
  }, [searchTerm, tickets]);

  // Helpers: batch and shift logic
  const getCurrentBatch = useCallback(() => {
    const hour = new Date().getHours();
    if (hour >= SHIFTS.BATCH_1.startHour && hour < SHIFTS.BATCH_1.endHour) return SHIFTS.BATCH_1.name;
    if (hour >= SHIFTS.BATCH_2.startHour && hour < SHIFTS.BATCH_2.endHour) return SHIFTS.BATCH_2.name;
    return null;
  }, []);

  const hadBatch1TicketToday = useCallback((vehicleId) => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tickets.some((t) => {
      if (t.vehicle?.id !== vehicleId) return false;
      if (t.status === "CANCELLED") return false;
      const ticketDate = t.issued_at?.split("T")[0];
      return ticketDate === todayStr && OperationsService.getShiftBatchName(t.issued_at) === SHIFTS.BATCH_1.name;
    });
  }, [tickets]);

  // Vehicle/driver selection handlers
  const handleVehicleChange = useCallback((e) => {
    const vehicleId = parseInt(e.target.value, 10);
    const vehicle = vehicles.find((v) => v.id === vehicleId) || null;
    setSelectedVehicle(vehicle);
    setMissedBatchWarning("");
    setOverrideMissedBatch(false);
    setIssueError("");

    if (vehicle?.active_driver) {
      setSelectedDriver(drivers.find((d) => d.id === vehicle.active_driver) || null);
    } else {
      setSelectedDriver(null);
    }
  }, [vehicles, drivers]);

  const handleDriverChange = useCallback((driverId) => {
    setSelectedDriver(drivers.find((d) => d.id === driverId) || null);
    setShowDriverModal(false);
  }, [drivers]);

  // Availability helpers (memoized)
  const availableVehicles = useMemo(() => {
    return vehicles.filter((v) => v.status === "AVAILABLE" && !OperationsService.isVehicleBusy(v.id, tickets));
  }, [vehicles, tickets]);

  const activeDrivers = useMemo(() => {
    return drivers.filter((d) => d.status === "ACTIVE" && !OperationsService.isDriverBusy(d.id, tickets, vehicles));
  }, [drivers, tickets, vehicles]);

  // Issue ticket
  const handleIssueTicket = useCallback(async () => {
    setSuccessMessage("");
    setIssueError("");
    setMissedBatchWarning("");

    if (!selectedVehicle) { setIssueError("Please select a vehicle."); return; }
    if (!selectedDriver) { setIssueError("Please select a driver."); return; }

    // Batch window check
    const currentBatch = getCurrentBatch();
    if (!currentBatch) {
      const hour = new Date().getHours();
      const tooEarly = hour < SHIFTS.BATCH_1.startHour;
      setIssueError(
        tooEarly
          ? `Ticket issuance hasn't opened yet. Batch 1 starts at ${SHIFTS.BATCH_1.startHour}:00.`
          : `Ticket issuance is closed. Operations end at ${SHIFTS.BATCH_2.endHour}:00.`
      );
      return;
    }

    // Missed Batch 1 soft warning
    if (currentBatch === SHIFTS.BATCH_2.name && !hadBatch1TicketToday(selectedVehicle.id)) {
      if (!missedBatchWarning) {
        setMissedBatchWarning(`Check the box below if this is a late issuance so it is recorded under Batch 1.`);
        return;
      }
      // second attempt proceeds
    }

    // Basic validations
    if (selectedVehicle.status !== "AVAILABLE") {
      setIssueError(`Vehicle is currently ${selectedVehicle.status} and cannot be ticketed.`);
      return;
    }
    if (selectedDriver.status !== "ACTIVE") {
      setIssueError("Selected driver is not active and cannot be assigned.");
      return;
    }
    if (OperationsService.isVehicleBusy(selectedVehicle.id, tickets)) {
      setIssueError("This vehicle already has an active ticket.");
      return;
    }
    if (OperationsService.isDriverBusy(selectedDriver.id, tickets, vehicles)) {
      setIssueError("This driver is already assigned to an active ticket.");
      return;
    }

    try {
      setIssuingTicket(true);

      // Generate ticket id (TICKET-YYYYMMDDHHMMSS)
      const now = new Date();
      const ticketId = `TICKET-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;

      const isLate = overrideMissedBatch;
      const payload = {
        id: ticketId,
        vehicle_id: selectedVehicle.id,
        driver_id: selectedDriver.id,
        route: selectedVehicle.route_detail?.full_name || selectedVehicle.route || "",
        status: "ISSUED",
        collection_amount: TICKET_FEE,
        is_verified: false,
        is_late: isLate,
        intended_batch: isLate ? SHIFTS.BATCH_1.name : "",
      };

      const newTicket = await apiService.createTicket(payload);

      showSuccess(`Ticket ${newTicket.id} issued successfully.`);
      await fetchTickets();

      // reset selection
      if (isMounted.current) {
        setSelectedVehicle(null);
        setSelectedDriver(null);
        setShowDriverModal(false);
        setOverrideMissedBatch(false);
        setMissedBatchWarning("");
      }
    } catch (err) {
      setIssueError(err?.message || "Error issuing ticket");
    } finally {
      if (isMounted.current) setIssuingTicket(false);
    }
  }, [
    selectedVehicle,
    selectedDriver,
    overrideMissedBatch,
    missedBatchWarning,
    tickets,
    vehicles,
    getCurrentBatch,
    hadBatch1TicketToday,
    fetchTickets,
    showSuccess,
  ]);

  // Format time helper
  const formatTime = useCallback((dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "N/A";
    }
  }, []);

  // Clear helpers
  const clearSuccessMessage = useCallback(() => setSuccessMessage(""), []);
  const clearError = useCallback(() => setError(null), []);
  const clearIssueError = useCallback(() => setIssueError(""), []);

  // Grouped return for easier consumption
  return {
    state: {
      tickets,
      filteredTickets,
      searchTerm,
      loading,
      error,
      vehicles,
      drivers,
      selectedVehicle,
      selectedDriver,
      showDriverModal,
      issuingTicket,
      successMessage,
      issueError,
      missedBatchWarning,
      overrideMissedBatch,
      availableVehicles,
      activeDrivers,
    },
    setters: {
      setSearchTerm,
      setSelectedVehicle,
      setSelectedDriver,
      setShowDriverModal,
      setOverrideMissedBatch,
      setMissedBatchWarning,
      setIssueError,
      setError,
      setSuccessMessage,
    },
    actions: {
      fetchTickets,
      fetchVehicles,
      fetchDrivers,
      handleVehicleChange,
      handleDriverChange,
      handleIssueTicket,
      clearSuccessMessage,
      clearError,
      clearIssueError,
      formatTime,
    },
  };
}
