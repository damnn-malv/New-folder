import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import {handleLogin, apiService} from '../lib/api-service'

function Login() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState("PERSONNEL");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [queueData, setQueueData] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigate = useNavigate();

  // Load queue on mount (default landing page)
  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(data);
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password, setError, navigate);
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
      <div className="login-content" style={{ maxWidth: '1100px' }}>

        {/* ── TOP NAV BAR ── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          {/* Logo */}
          <div className="logo-section" style={{ justifyContent: 'flex-start' }}>
            <div className="logo-icon" style={{ width: 52, height: 52 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 30, height: 30 }}>
                <path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3" />
                <circle cx="7" cy="18" r="2" />
                <path d="M9 18h5" />
                <circle cx="16" cy="18" r="2" />
              </svg>
            </div>
            <div className="logo-text">
              <h1 className="system-title" style={{ fontSize: 20, marginBottom: 2 }}>North Central Terminal</h1>
              <p className="system-subtitle" style={{ fontSize: 11 }}>City Government of San Fernando</p>
            </div>
          </div>

          {/* Login Button (top-right) */}
          {!showLoginForm && !isLoggedIn && (
            <button
              onClick={() => setShowLoginForm(true)}
              style={{
                padding: '10px 22px',
                background: 'linear-gradient(135deg, #c9a84c 0%, #e8c86b 100%)',
                color: '#1a2744',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                boxShadow: '0 4px 15px rgba(201,168,76,0.3)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(201,168,76,0.3)'; }}
            >
               Staff Login
            </button>
          )}

          {/* Back button when login form is open */}
          {showLoginForm && !isLoggedIn && (
            <button
              onClick={() => { setShowLoginForm(false); setError(''); }}
              className="btn-back-to-login"
            >
              ← Back to Queue
            </button>
          )}
        </div>

        {/* ── LOGIN FORM (shown when button clicked) ── */}
        {showLoginForm && !isLoggedIn && (
          <div className="login-form-container">
            <div className="login-card">
              <h2 className="login-title">Staff Login</h2>
              <p className="login-subtitle">Login to your account</p>

              <form onSubmit={handleSubmit} className="login-form">
                {/* Username */}
                <div className="form-group">
                  <label htmlFor="username" className="form-label">Username</label>
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
                  <label htmlFor="password" className="form-label">Password</label>
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
                <button type="submit" className="btn-login">Sign In</button>
              </form>
            </div>
          </div>
        )}

        {/* ── DEFAULT LANDING: PUBLIC QUEUE ── */}
        {!showLoginForm && !isLoggedIn && (
          <div className="queue-container" style={{ animation: 'fadeInUp 0.8s ease-out both' }}>
            <div className="queue-header">
              <div className="queue-title-section">
                <h2 className="queue-title">Current Jeepney Queue</h2>
                
              </div>
              <button
                onClick={handleRefreshQueue}
                disabled={refreshing}
                style={{
                  padding: '8px 14px',
                  background: refreshing ? '#ccc' : '#c9a84c',
                  color: refreshing ? '#666' : '#1a2744',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: refreshing ? 'not-allowed' : 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.2s',
                }}
              >
                {refreshing ? '🔄 Refreshing...' : ' Refresh'}
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
                        className={`queue-row ${vehicle.status === 'On Trip' ? 'on-trip' : ''}`}
                      >
                        <td className="plate-cell">
                          <span className="plate-badge">{vehicle.plate_number}</span>
                        </td>
                        <td>{vehicle.driver}</td>
                        <td>{vehicle.route}</td>
                        <td>
                          <span className={`status-badge ${vehicle.status === 'On Trip' ? 'status-trip' : 'status-available'}`}>
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
              <p className="queue-info">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}

        {/* ── POST-LOGIN SUCCESS ── */}
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
