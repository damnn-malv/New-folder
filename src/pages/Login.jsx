import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/login.css";
import { handleLogin, apiService } from '../lib/api-service';
import { useToast } from '../components/ui/ToastConfirmContext';

// ── Import images
import sfcLogo from '../pictures/sfc-nobg-logo.png';
import sfcBanner from '../pictures/sfc-nobg-banner.png';
import sfcMain from '../pictures/sfc-main.jpg';
import tanqui1 from '../pictures/tanqui1.jpg';
import tanqui2 from '../pictures/tanqui2.jpg';

function Login() {
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [queueData, setQueueData] = useState([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const navigate = useNavigate();
  const showToast = useToast();
  const carouselImages = [tanqui1, tanqui2];

  useEffect(() => {
    loadQueue();
    const handleScroll = () => setHeaderScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCarouselIndex(i => (i + 1) % carouselImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const loadQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load queue:', err);
    } finally {
      setLoadingQueue(false);
    }
  };

  const handleRefreshQueue = async () => {
    setRefreshing(true);
    try {
      const data = await apiService.get('/queue/');
      setQueueData(data);
    } catch (err) {
      console.error('Failed to refresh queue:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleLogin(username, password, setError, navigate, showToast);
  };

  return (
    <div className="lp-root">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <header className={`lp-header ${headerScrolled ? 'lp-header--scrolled' : ''}`}>
        <div className="lp-header__inner">
          {/* Logo */}
          <div className="lp-header__brand">
            <img src={sfcLogo} alt="SFC Logo" className="lp-header__logo" style={{borderRadius: '40px'}}/>
            <div className="lp-header__brand-text">
              <span className="lp-header__title">North Central Terminal</span>
              <span className="lp-header__sub">City Government of San Fernando</span>
            </div>
          </div>

          {/* Staff Login button / Back button */}
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

      {/* ══════════════════════════════════════
          LOGIN FORM OVERLAY
      ══════════════════════════════════════ */}
      {showLoginForm && (
        <div className="lp-login-overlay" onClick={() => { setShowLoginForm(false); setError(''); }}>
          <div className="lp-login-modal" onClick={e => e.stopPropagation()}>
            <div className="lp-login-modal__brand">
              <img src={sfcLogo} alt="Logo" className="lp-login-modal__logo" style={{borderRadius: '40px'}} />
              <h2>Staff Access</h2>
              <p>Sign in to manage terminal operations</p>
            </div>
            <form onSubmit={handleSubmit} className="lp-login-form">
              <div className="lp-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="lp-field">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
              {error && <div className="lp-error">{error}</div>}
              <button type="submit" className="lp-btn lp-btn--navy lp-btn--full">Sign In</button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════ */}
      <section className="lp-hero" style={{ backgroundImage: `url(${sfcMain})` }}>
        <div className="lp-hero__overlay" />
        <div className="lp-hero__content">
          <div className="lp-hero__badge">Est. San Fernando, La Union</div>
          <h1 className="lp-hero__title">North Central<br />Terminal</h1>
          <p className="lp-hero__desc">
            The primary jeepney dispatch hub serving the City of San Fernando —<br />
            connecting communities across La Union with efficiency and care.
          </p>
          <div className="lp-hero__cta-row">
            <button className="lp-btn lp-btn--gold lp-btn--lg" onClick={() => {
              document.getElementById('lp-queue').scrollIntoView({ behavior: 'smooth' });
            }}>
              View Queue
            </button>
            <button className="lp-btn lp-btn--ghost lp-btn--lg" onClick={() => {
              document.getElementById('lp-showcase').scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn More
            </button>
          </div>
        </div>
        <div className="lp-hero__scroll-hint">
          <span>Scroll</span>
          <div className="lp-hero__scroll-line" />
        </div>
      </section>

      {/* ══════════════════════════════════════
          QUEUE SECTION
      ══════════════════════════════════════ */}
      <section id="lp-queue" className="lp-queue-section">
        <div className="lp-container">
          <div className="lp-section-header">
            <div>
              <span className="lp-section-eyebrow">Live Updates</span>
              <h2 className="lp-section-title">Current Jeepney Queue</h2>
            </div>
            <button
              className={`lp-btn lp-btn--outline-gold ${refreshing ? 'lp-btn--loading' : ''}`}
              onClick={handleRefreshQueue}
              disabled={refreshing}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={refreshing ? 'lp-spin' : ''}>
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {refreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="lp-queue-card">
            {loadingQueue ? (
              <div className="lp-queue-loading">
                <div className="lp-spinner" />
                <p>Loading queue data…</p>
              </div>
            ) : queueData.length === 0 ? (
              <div className="lp-queue-empty">
                <p>No vehicles currently in queue.</p>
              </div>
            ) : (
              <div className="lp-table-wrap">
                <table className="lp-table">
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
        </div>
      </section>

      {/* ══════════════════════════════════════
          SHOWCASE SECTION
      ══════════════════════════════════════ */}
      <section id="lp-showcase" className="lp-showcase-section">
        <div className="lp-container lp-showcase-grid">
          {/* Left: Text */}
          <div className="lp-showcase-text">
            <span className="lp-section-eyebrow lp-section-eyebrow--light">About the Terminal</span>
            <h2 className="lp-section-title lp-section-title--light">A Hub Built for the Community</h2>
            <p className="lp-showcase-para">
              The North Central Terminal in Tanqui, San Fernando City serves as the backbone of
              public transport in La Union. It coordinates daily jeepney dispatch operations,
              ensuring safe, orderly, and timely service for thousands of commuters every day.
            </p>
            <p className="lp-showcase-para">
              With modern queue management, route tracking, and driver coordination, the terminal
              bridges the gap between traditional public transport and efficient city governance.
            </p>
            <div className="lp-showcase-stats">
              <div className="lp-stat">
                <span className="lp-stat__num">50+</span>
                <span className="lp-stat__label">Routes Served</span>
              </div>
              <div className="lp-stat">
                <span className="lp-stat__num">200+</span>
                <span className="lp-stat__label">Daily Vehicles</span>
              </div>
              <div className="lp-stat">
                <span className="lp-stat__num">24/7</span>
                <span className="lp-stat__label">Operations</span>
              </div>
            </div>
          </div>

          {/* Right: Carousel */}
          <div className="lp-carousel">
            <div className="lp-carousel__track">
              {carouselImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Terminal view ${i + 1}`}
                  className={`lp-carousel__img ${i === carouselIndex ? 'lp-carousel__img--active' : ''}`}
                />
              ))}
              <div className="lp-carousel__overlay" />
            </div>
            <div className="lp-carousel__controls">
              <button
                className="lp-carousel__btn"
                onClick={() => setCarouselIndex(i => (i - 1 + carouselImages.length) % carouselImages.length)}
                aria-label="Previous"
              >
                ‹
              </button>
              <div className="lp-carousel__dots">
                {carouselImages.map((_, i) => (
                  <button
                    key={i}
                    className={`lp-carousel__dot ${i === carouselIndex ? 'lp-carousel__dot--active' : ''}`}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Slide ${i + 1}`}
                  />
                ))}
              </div>
              <button
                className="lp-carousel__btn"
                onClick={() => setCarouselIndex(i => (i + 1) % carouselImages.length)}
                aria-label="Next"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer className="lp-footer">
        <div className="lp-container lp-footer__inner">
          <div className="lp-footer__brand">
            <img src={sfcBanner} alt="San Fernando City Banner" className="lp-footer__banner" style={{borderRadius: "100px"}}/>
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
