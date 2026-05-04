import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import {handleLogin, apiService} from '../lib/api-service'

function Login() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showPublicQueue, setShowPublicQueue] = useState(false);
  const [selectedRole, setSelectedRole] = useState("PERSONNEL");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [queueData, setQueueData] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password, setError, navigate);
  };

  const handleViewQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(data);
      setShowPublicQueue(true);
    } catch (error) {
      console.error('Failed to load queue:', error);
      setError('Failed to load queue data.');
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleBackToLogin = () => {
    setShowPublicQueue(false);
    setQueueData([]);
    setIsLoggedIn(false);
  };

  const handleRefreshQueue = async () => {
    setRefreshing(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(data);
    } catch (error) {
      console.error('Failed to refresh queue:', error);
      setError('Failed to refresh queue data.');
    } finally {
      setRefreshing(false);
    }
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

              <form onSubmit={handleSubmit} className="login-form">
                
                

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
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <button
                  onClick={handleRefreshQueue}
                  disabled={refreshing}
                  className="btn-refresh-queue"
                  title="Refresh queue"
                  style={{
                    padding: "8px 12px",
                    background: refreshing ? "#ccc" : "#1a2744",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: refreshing ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "background 0.2s"
                  }}
                >
                  {refreshing ? "🔄 Refreshing..." : "🔄 Refresh"}
                </button>
                <button
                  onClick={handleBackToLogin}
                  className="btn-back-to-login"
                >
                  Back to Login
                </button>
              </div>
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