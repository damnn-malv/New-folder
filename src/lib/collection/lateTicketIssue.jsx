import React, { useState } from "react";
import { apiService } from "../api-service";
import { SHIFTS } from "../constants";

const LateTicketIssue = ({ vehicles, drivers, onClose }) => {
  const [lateDate, setLateDate] = useState("");
  const [lateBatch, setLateBatch] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);

  const handleDateChange = (e) => setLateDate(e.target.value);
  const handleBatchChange = (e) => setLateBatch(e.target.value);
  const handleVehicleChange = (e) => {
    const vehicle = vehicles.find((v) => v.id === parseInt(e.target.value));
    setSelectedVehicle(vehicle);
  };
  const handleDriverChange = (e) => {
    const driver = drivers.find((d) => d.id === parseInt(e.target.value));
    setSelectedDriver(driver);
  };

  const handleIssueLateTicket = async () => {
    if (!lateDate || !lateBatch || !selectedVehicle || !selectedDriver) {
      alert("Please fill all fields");
      return;
    }

    if (
      !selectedVehicle.route_detail?.full_name &&
      !selectedVehicle.full_name
    ) {
      alert("Selected vehicle does not have a valid route assigned");
      return;
    }

    const payload = {
      vehicle: selectedVehicle.id,
      driver: selectedDriver.id,
      route:
        selectedVehicle.route_detail?.full_name ||
        selectedVehicle.full_name ||
        "",
      status: "ISSUED",
      is_late: true,
      intended_batch: lateBatch,
      issued_at: new Date(lateDate).toISOString(),
    };

    try {
      const response = await apiService.post("/tickets/late/", payload);

      alert("Late ticket issued successfully!");
    } catch (error) {
      // If backend returned validation errors, show them
      if (error.response && error.response.data) {
        alert("Server rejected fields: " + JSON.stringify(error.response.data));
      } else {
        alert("Error issuing late ticket: " + error.message);
      }
    }
  };

  const formatHour = (hour) => {
    const suffix = hour >= 12 ? "pm" : "am";
    const display = ((hour + 11) % 12) + 1; // convert to 12-hour
    return `${display}${suffix}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Issue Late Ticket
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Enter details for the late ticket
              </p>
            </div>
            <button
              onClick={onClose, () => window.location.reload()}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={lateDate}
              onChange={handleDateChange}
              max={new Date().toISOString().split("T")[0]}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Batch
            </label>
            <select
              value={lateBatch}
              onChange={handleBatchChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Batch</option>
              <option value={SHIFTS.BATCH_1.name}>
                {SHIFTS.BATCH_1.name} ({formatHour(SHIFTS.BATCH_1.startHour)}–
                {formatHour(SHIFTS.BATCH_1.endHour)})
              </option>
              <option value={SHIFTS.BATCH_2.name}>
                {SHIFTS.BATCH_2.name} ({formatHour(SHIFTS.BATCH_2.startHour)}–
                {formatHour(SHIFTS.BATCH_2.endHour)})
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vehicle
            </label>
            <select
              value={selectedVehicle?.id || ""}
              onChange={handleVehicleChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Vehicle</option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.id} value={vehicle.id}>
                  {vehicle.plate_number} -{" "}
                  {vehicle.route_detail?.full_name || "N/A"}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Driver
            </label>
            <select
              value={selectedDriver?.id || ""}
              onChange={handleDriverChange}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
            >
              <option value="">Select Driver</option>
              {drivers.map((driver) => (
                <option key={driver.id} value={driver.id}>
                  {driver.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end space-x-2">
          <button
            onClick={onClose, () => window.location.reload()}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
          >
            Close
          </button>
          <button
            onClick={handleIssueLateTicket}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Issue Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

export default LateTicketIssue;
