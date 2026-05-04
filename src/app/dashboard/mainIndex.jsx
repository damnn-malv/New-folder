import React, { useState, useEffect } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import Dashboard from "./Dashboard";
import Dispatch from './dispatch/dispatch'
import Ticket from "./ticket/ticket";
import Collections from "./collection/collection";
import Vehicles from "./vehicle/vehicle";
import Drivers from "./driver/driver";
import StaffRegistry from "./user/user";
import Reports from "./report/report";
import {
  CollectionsIcon, DashboardIcon, DispatchIcon, DriverIcon,
  ReportIcon, TicketIcon, UserIcon, VehicleIcon,
} from "../../components/ui/NavIcon";
import { apiService } from "../../lib/api-service";
import "./../../styles/mainIndex.css";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { to: "/dashboard/Dispatch", label: "Dispatch", Icon: DispatchIcon },
  { to: "/dashboard/Ticket", label: "Tickets", Icon: TicketIcon },
  { to: "/dashboard/Collections", label: "Collections", Icon: CollectionsIcon },
  { to: "/dashboard/Vehicles", label: "Vehicles Registry", Icon: VehicleIcon },
  { to: "/dashboard/Drivers", label: "Drivers Registry", Icon: DriverIcon },
  { to: "/dashboard/StaffRegistry", label: "Staff Registry", Icon: UserIcon },
  { to: "/dashboard/Reports", label: "Reports", Icon: ReportIcon },
];

function mainIndex() {
  const [currentUser, setCurrentUser] = useState({});
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  // dark/light
  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  useEffect(() => {
    let isMounted = true;

    apiService.getCurrentUser()
      .then((user) => {
        if (isMounted) setCurrentUser(user || {});
      })
      .catch((error) => {
        console.error("Failed to load current user:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const userName = currentUser.first_name || currentUser.last_name
    ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim()
    : currentUser.username || "Unknown User";

  const userRole = currentUser.role || "Unknown Role";
  const userInitials = userName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "US";

  return (
    <div className="shell">
      <aside className="sidebar">

        {/* Brand header */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
              <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
            </svg>
          </div>
          <div className="sidebar-brand-text">
            <span className="sidebar-brand-gov">City Government of San Fernando</span>
            <span className="sidebar-brand-name">North Central Terminal</span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="sidebar-nav">
          <div className="sidebar-nav-label">Navigation</div>
          {NAV_ITEMS.filter(item => {
            // Only show StaffRegistry if role is SUPERVISOR
            if (item.to === "/dashboard/StaffRegistry" && userRole !== "SUPERVISOR") {
              return false;
            }
            return true;
          }).map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/dashboard"}
              className={({ isActive }) =>
                isActive ? "nav-link nav-link-active" : "nav-link"
              }
            >
              <Icon className="nav-link-icon" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="sidebar-avatar">{userInitials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{userName}</div>
            <div className="sidebar-user-role">{userRole}</div>
          </div>

          {/* Theme toggle */}
          <button
            className="sidebar-icon-btn"
            onClick={() => setDark(d => !d)}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? (
              // sun icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              </svg>
            ) : (
              // moon icon
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>

          {/* Logout */}
          <button className="sidebar-icon-btn" onClick={apiService.logout} title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="Dashboard" element={<Dashboard />} />
          <Route path="Dispatch" element={<Dispatch />} />
          <Route path="Ticket" element={<Ticket />} />
          <Route path="Collections" element={<Collections />} />
          <Route path="Vehicles" element={<Vehicles />} />
          <Route path="Drivers" element={<Drivers />} />
          {userRole === "SUPERVISOR" && (
            <Route path="StaffRegistry" element={<StaffRegistry />} />
          )}
          <Route path="Reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default mainIndex;
