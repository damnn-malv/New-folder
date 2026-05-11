import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { handleLogin, apiService } from '../lib/api-service';
import { useToast } from '../components/ui/ToastConfirmContext';

// ── Import images
import sfcLogo   from '../pictures/sfc-nobg-logo.png';
import sfcBanner from '../pictures/sfc-nobg-banner.png';
import sfcMain   from '../pictures/sfc-main.jpg';
 function Login() {
  const [showLoginForm,  setShowLoginForm]  = useState(false);
  const [username,       setUsername]       = useState("");
  const [password,       setPassword]       = useState("");
  const [error,          setError]          = useState("");
  const [queueData,      setQueueData]      = useState([]);
  const [nextQueue,      setNextQueue]      = useState([]);
  const [routes,         setRoutes]         = useState([]);
  const [selectedRoute,  setSelectedRoute]  = useState("ALL");
  const [loadingQueue,   setLoadingQueue]   = useState(false);
  const [refreshing,     setRefreshing]     = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const navigate  = useNavigate();
  const showToast = useToast();

  useEffect(() => {
    loadQueue();
    loadNextQueue();
    loadRoutes();
    const handleScroll = () => setHeaderScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const loadNextQueue = async () => {
    try {
      // Available vehicles not currently dispatched
      const data = await apiService.getVehicles();
      setNextQueue(Array.isArray(data) ? data.filter(v => v.status === 'AVAILABLE') : []);
    } catch (err) {
      console.error('Failed to load next queue:', err);
    }
  };

  const loadRoutes = async () => {
    try {
      const data = await apiService.getRoutes();
      setRoutes(Array.isArray(data) ? data.filter(r => r.is_active) : []);
    } catch (err) {
      console.error('Failed to load routes:', err);
    }
  };

  const handleRefreshQueue = async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadQueue(), loadNextQueue(), loadRoutes()]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password, setError, navigate, showToast);
  };

  // Filter next queue by selected route
  const filteredNextQueue = selectedRoute === 'ALL'
    ? nextQueue
    : nextQueue.filter(v => {
        const routeName = v.route_detail?.full_name || v.route_detail?.origin || '';
        return routeName === selectedRoute;
      });

  return (
    <div className="lp-root" style={{ backgroundImage: `url(${sfcMain})` }}>

      {/* Background overlay */}
      <div className="lp-bg-overlay" />

      {/* ── HEADER ── */}
      <header className={`lp-header ${headerScrolled ? 'lp-header--scrolled' : ''}`}>
        <div className="lp-header__inner">
          <div className="lp-header__brand">
            <img src={sfcLogo} alt="SFC Logo" className="lp-header__logo" style={{ borderRadius: '40px' }} />
            <div className="lp-header__brand-text">
              <span className="lp-header__title">North Central Terminal</span>
              <span className="lp-header__sub">City Government of San Fernando</span>
            </div>
          </div>

          {!showLoginForm ? (
            <button className="lp-btn lp-btn--gold" onClick={() => setShowLoginForm(true)}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Staff Login
            </button>
          ) : (
            <button className="lp-btn lp-btn--outline" onClick={() => { setShowLoginForm(false); setError(''); }}>
              ← Back
            </button>
          )}
        </div>
      </header>

      {/* ── LOGIN FORM OVERLAY ── */}
      {showLoginForm && (
        <div className="lp-login-overlay" onClick={() => { setShowLoginForm(false); setError(''); }}>
          <div className="lp-login-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-login-modal__brand">
              <img src={sfcLogo} alt="Logo" className="lp-login-modal__logo" style={{ borderRadius: '40px' }} />
              <h2>Staff Access</h2>
              <p>Sign in to manage terminal operations</p>
            </div>
            <form onSubmit={handleSubmit} className="lp-login-form">
              <div className="lp-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username" type="text" placeholder="Enter your username"
                  value={username} onChange={e => setUsername(e.target.value)} autoFocus
                />
              </div>
              <div className="lp-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password" type="password" placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="lp-error">{error}</div>}
              <button type="submit" className="lp-btn lp-btn--navy lp-btn--full">Sign In</button>
            </form>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="lp-main">
        <div className="lp-container">

          {/* Page title bar */}
          <div className="lp-page-title">
            <div>
              <span className="lp-section-eyebrow">Live Updates</span>
              <h2 className="lp-section-title lp-section-title--light">Jeepney Queue Board</h2>
            </div>
            <button
              className={`lp-btn lp-btn--outline-gold ${refreshing ? 'lp-btn--loading' : ''}`}
              onClick={handleRefreshQueue}
              disabled={refreshing}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
                className={refreshing ? 'lp-spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          {/* ── ACTIVE QUEUE ── */}
          <div className="lp-board-label">
            <div className="lp-board-label__dot lp-board-label__dot--active" />
            Active Queue
          </div>

          <div className="lp-queue-card">
            {loadingQueue ? (
              <div className="lp-queue-loading">
                <div className="lp-spinner" />
                <p>Loading queue data…</p>
              </div>
            ) : queueData.length === 0 ? (
              <div className="lp-queue-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35">
                  <rect x="1" y="3" width="15" height="13" rx="1"/>
                  <path d="M16 8h4l3 3v5h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <p>No active queue at this time.</p>
              </div>
            ) : (
              <div className="lp-table-wrap">
                <table className="lp-table">
                  <thead>
                    <tr>
                      <th>Plate Number</th>
                      <th>Driver</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Est. Departure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queueData.map(v => (
                      <tr key={v.id} className={v.status === 'On Trip' ? 'lp-row--trip' : ''}>
                        <td><span className="lp-plate">{v.plate_number}</span></td>
                        <td>{v.driver}</td>
                        <td>{v.route}</td>
                        <td>
                          <span className={`lp-status ${v.status === 'On Trip' ? 'lp-status--trip' : 'lp-status--available'}`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="lp-td--time">{v.departure_time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="lp-queue-foot">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>

          {/* ── NEXT QUEUE ── */}
          <div className="lp-next-header">
            <div className="lp-board-label">
              <div className="lp-board-label__dot lp-board-label__dot--next" />
              Next in Queue — Available Vehicles
            </div>

            {/* Route filter */}
            <div className="lp-route-filter">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              <select
                className="lp-route-select"
                value={selectedRoute}
                onChange={e => setSelectedRoute(e.target.value)}
              >
                <option value="ALL">All Routes</option>
                {routes.map(r => (
                  <option key={r.id} value={r.full_name || r.origin}>
                    {r.full_name || r.origin}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="lp-queue-card lp-queue-card--next">
            {filteredNextQueue.length === 0 ? (
              <div className="lp-queue-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.35">
                  <rect x="1" y="3" width="15" height="13" rx="1"/>
                  <path d="M16 8h4l3 3v5h-7V8z"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/>
                  <circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <p>No available vehicles{selectedRoute !== 'ALL' ? ` for ${selectedRoute}` : ''}.</p>
              </div>
            ) : (
              <div className="lp-table-wrap">
                <table className="lp-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Plate Number</th>
                      <th>Route</th>
                      <th>Driver</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNextQueue.map((v, idx) => (
                      <tr key={v.id}>
                        <td className="lp-td--num">{idx + 1}</td>
                        <td><span className="lp-plate">{v.plate_number}</span></td>
                        <td>{v.route_detail?.full_name || v.route_detail?.origin || <span className="lp-na">No route</span>}</td>
                        <td>{v.active_driver_name || <span className="lp-na">Unassigned</span>}</td>
                        <td><span className="lp-status lp-status--available">Available</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <img src={sfcBanner} alt="San Fernando City Banner" className="lp-footer__banner" style={{ borderRadius: '100px' }} />
            <p className="lp-footer__desc">
              Serving the commuters of San Fernando City with organized, efficient, and transparent
              public transport management under the City Government of San Fernando, La Union.
            </p>
          </div>
          <div className="lp-footer__info">
            <h4 className="lp-footer__label">Location</h4>
            <address className="lp-footer__address">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              Tanqui, San Fernando City, La Union
            </address>
            <h4 className="lp-footer__label" style={{ marginTop: 20 }}>System</h4>
            <p className="lp-footer__sys-name">North Central Terminal<br />Management System</p>
          </div>
        </div>
        <div className="lp-footer__bottom">
          <span>© {new Date().getFullYear()} City Government of San Fernando, La Union. All rights reserved.</span>
        </div>
      </footer>

    </div>
  );
}

export default Login;
