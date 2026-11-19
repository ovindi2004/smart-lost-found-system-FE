import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import NotificationPanel from "./NotificationPanel";

export const Navbar = () => {
  const { currentUser, isAuthenticated, isAdmin, logout, unreadCount } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand" onClick={() => setMobileMenuOpen(false)}>
        <div className="brand-icon">🔍</div>
        <div className="brand-title">UniFind</div>
      </Link>

      <div className="nav-label">UNIVERSITY CAMPUS RECOVERY NETWORK</div>

      {/* Desktop Navigation Links */}
      <nav className={`nav-links-wrap ${mobileMenuOpen ? "mobile-open" : ""}`}>
        <NavLink
          to="/"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMobileMenuOpen(false)}
        >
          Home
        </NavLink>
        <NavLink
          to="/items"
          className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          onClick={() => setMobileMenuOpen(false)}
        >
          Browse Items
        </NavLink>

        {isAuthenticated && (
          <>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={() => setMobileMenuOpen(false)}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/my-items"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={() => setMobileMenuOpen(false)}
            >
              My Items
            </NavLink>
            <NavLink
              to="/my-claims"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              onClick={() => setMobileMenuOpen(false)}
            >
              Claims
            </NavLink>
          </>
        )}

        {isAdmin && (
          <NavLink
            to="/admin"
            className={({ isActive }) => (isActive ? "nav-link active admin-link" : "nav-link admin-link")}
            onClick={() => setMobileMenuOpen(false)}
          >
            🛡️ Admin
          </NavLink>
        )}
      </nav>

      {/* Right side actions */}
      <div className="auth-buttons">
        {isAuthenticated && (
          <button
            className="notification-bell"
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Toggle notifications"
            title="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-count">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        )}

        {showNotifications && (
          <NotificationPanel onClose={() => setShowNotifications(false)} />
        )}

        {isAuthenticated && currentUser ? (
          <div className="user-profile-badge">
            <span className="user-name">{currentUser.name}</span>
            <span className={`role-tag ${currentUser.role === "ADMIN" ? "admin" : ""}`}>
              {currentUser.role}
            </span>
            <button className="btn-logout" onClick={handleLogout} title="Log out">
              Logout
            </button>
          </div>
        ) : (
          <div className="auth-action-btns">
            <Link to="/login" className="btn-login">
              Login
            </Link>
            <Link to="/register" className="btn-register">
              Get Started
            </Link>
          </div>
        )}

        {/* Mobile menu toggle */}
        <button
          className="mobile-nav-toggle"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
