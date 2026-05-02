import React, { useState, useEffect } from "react";
import "../styles/login.css";

function Login() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPublicQueue, setShowPublicQueue] = useState(false);
  const [selectedRole, setSelectedRole] = useState("PERSONNEL");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [queueData, setQueueData] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  // Mock data for public queue viewing
  const mockQueueData = [
    {
      id: 1,
      plate_number: "ABC-1234",
      driver: "Juan Dela Cruz",
      route: "Lingsat - San Fernando",
      status: "Available",
      departure_time: "2:30 PM",
    },
    {
      id: 2,
      plate_number: "DEF-5678",
      driver: "Maria Santos",
      route: "Tanqui - San Fernando",
      status: "Available",
      departure_time: "2:45 PM",
    },
    {
      id: 3,
      plate_number: "GHI-9012",
      driver: "Pedro Reyes",
      route: "Lingsat - San Fernando",
      status: "On Trip",
      departure_time: "2:15 PM",
    },
    {
      id: 4,
      plate_number: "JKL-3456",
      driver: "Rosa Garcia",
      route: "Tanqui - San Fernando",
      status: "Available",
      departure_time: "3:00 PM",
    },
    {
      id: 5,
      plate_number: "MNO-7890",
      driver: "Carlos Morales",
      route: "Lingsat - San Fernando",
      status: "Available",
      departure_time: "3:15 PM",
    },
  ];

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Simulate successful login (in real app, validate against backend)
    setIsLoggedIn(true);
    setUsername("");
    setPassword("");
  };

  const handleViewQueue = () => {
    setLoadingQueue(true);
    // Simulate API call delay
    setTimeout(() => {
      setQueueData(mockQueueData);
      setShowPublicQueue(true);
      setLoadingQueue(false);
    }, 500);
  };

  const handleBackToLogin = () => {
    setShowPublicQueue(false);
    setQueueData([]);
    setIsLoggedIn(false);
  };

  return (
    <div className="login-container">
      {/* Background gradient effect */}
      <div className="login-background"></div>

      {/* Main content */}
      <div className="login-content">
        {/* Logo/Header Section */}
        <div className="login-header">
          <div className="logo-section">
            <div className="logo-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                <circle cx="7" cy="18" r="2" />
                <path d="M9 18h5" />
                <circle cx="16" cy="18" r="2" />
              </svg>
            </div>
            <div className="logo-text">
              <h1 className="system-title">North Central Terminal</h1>
              <p className="system-subtitle">City Government of San Fernando</p>
            </div>
          </div>
        </div>

        {/* Login Form */}
        {!showPublicQueue && !isLoggedIn && (
          <div className="login-form-container">
            <div className="login-card">
              <h2 className="login-title">North Central Terminal</h2>
              <p className="login-subtitle">Login to your account</p>

              <form onSubmit={handleLogin} className="login-form">
                
                

                {/* Username */}
                <div className="form-group">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                  />
                </div>

                {/* Error Message */}
                {error && <div className="error-message">{error}</div>}

                {/* Submit Button */}
                <button type="submit" className="btn-login">
                  Sign In
                </button>
              </form>

              {/* Public Queue Link */}
              <div className="login-footer">
                <button
                  type="button"
                  onClick={handleViewQueue}
                  className="btn-public-queue"
                >
                  📋 View Queue
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Public Queue Viewing */}
        {showPublicQueue && !isLoggedIn && (
          <div className="queue-container">
            <div className="queue-header">
              <div className="queue-title-section">
                <h2 className="queue-title">Current Jeepney Queue</h2>
                
              </div>
              <button
                onClick={handleBackToLogin}
                className="btn-back-to-login"
              >
                Back to Login
              </button>
            </div>

            {loadingQueue ? (
              <div className="loading-spinner">
                <p>Loading queue information...</p>
              </div>
            ) : (
              <div className="queue-table-wrapper">
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Driver Name</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Est. Departure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueData.map((vehicle) => (
                      <tr
                        key={vehicle.id}
                        className={`queue-row ${
                          vehicle.status === "On Trip" ? "on-trip" : ""
                        }`}
                      >
                        <td className="plate-cell">
                          <span className="plate-badge">{vehicle.plate_number}</span>
                        </td>
                        <td>{vehicle.driver}</td>
                        <td>{vehicle.route}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              vehicle.status === "On Trip"
                                ? "status-trip"
                                : "status-available"
                            }`}
                          >
                            {vehicle.status}
                          </span>
                        </td>
                        <td className="time-cell">{vehicle.departure_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="queue-footer">
              <p className="queue-info">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Post-Login Message */}
        {isLoggedIn && (
          <div className="login-success">
            <div className="success-card">
              <div className="success-icon">✓</div>
              <h2>Login Successful!</h2>
              <p>Welcome, {selectedRole === 'MANAGER' ? 'Admin' : selectedRole === 'SUPERVISOR' ? 'Supervisor' : 'Personnel'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
