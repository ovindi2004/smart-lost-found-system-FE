import { useState, useEffect } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { CATEGORIES, type Item, type User, type Claim } from "../../types";
import "./AdminPages.css";

export const AdminDashboard = () => {
  const { currentUser } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAdminData = async () => {
      if (!currentUser?.token) return;
      try {
        setLoading(true);
        const [itemsData, usersData, claimsData] = await Promise.all([
          api.items.getAll(),
          api.users.getAll(currentUser.token),
          api.claims.getAll(currentUser.token),
        ]);
        setItems(itemsData);
        setUsers(usersData);
        setClaims(claimsData);
      } catch (err) {
        console.error("Admin data loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    void loadAdminData();
  }, [currentUser?.token]);

  const totalItems = items.length;
  const lostItems = items.filter((i) => i.itemType === "LOST").length;
  const foundItems = items.filter((i) => i.itemType === "FOUND").length;
  const matchedItems = items.filter((i) => i.status === "MATCHED").length;
  const returnedItems = items.filter((i) => i.status === "RETURNED").length;
  const pendingClaims = claims.filter((c) => c.status === "PENDING").length;

  const categoryReports = CATEGORIES.map((category) => ({
    category,
    count: items.filter((item) => item.category === category).length,
  }));

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="eyebrow" style={{ color: "#c084fc" }}>
            🛡️ CAMPUS ADMINISTRATION CONSOLE
          </span>
          <h1>Admin Control Center</h1>
          <p>Monitor system-wide metrics, manage campus users, inspect reported items, and process claims.</p>
        </div>

        <div className="badge-count" style={{ fontSize: "13px", padding: "8px 16px" }}>
          Active Admin Session
        </div>
      </div>

      {/* Admin Subnav */}
      <div className="admin-nav-bar">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📊 Overview
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          👥 Manage Users ({users.length})
        </NavLink>
        <NavLink to="/admin/items" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📦 Manage Items ({items.length})
        </NavLink>
        <NavLink to="/admin/claims" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📋 Manage Claims ({claims.length})
          {pendingClaims > 0 && ` (${pendingClaims} pending)`}
        </NavLink>
      </div>

      {loading && <p style={{ color: "var(--muted)", marginBottom: "16px" }}>Loading administration metrics...</p>}

      {/* Primary KPI Stats */}
      <div className="dashboard-cards" style={{ marginBottom: "32px" }}>
        <div className="dashboard-card" style={{ borderLeft: "4px solid #c084fc" }}>
          <h3>Total Users</h3>
          <p>{users.length}</p>
        </div>
        <div className="dashboard-card">
          <h3>Total Items</h3>
          <p>{totalItems}</p>
        </div>
        <div className="dashboard-card lost">
          <h3>Lost Items</h3>
          <p>{lostItems}</p>
        </div>
        <div className="dashboard-card found">
          <h3>Found Items</h3>
          <p>{foundItems}</p>
        </div>
        <div className="dashboard-card matched">
          <h3>Matched Items</h3>
          <p>{matchedItems}</p>
        </div>
        <div className="dashboard-card returned">
          <h3>Returned Items</h3>
          <p>{returnedItems}</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="admin-quick-cards">
        <Link to="/admin/users" className="admin-quick-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>👥</span>
            <span className="badge-count">{users.length} Users</span>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>Manage Users</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Review registered students and staff, inspect user roles, and revoke account access when necessary.
          </p>
        </Link>

        <Link to="/admin/items" className="admin-quick-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>📦</span>
            <span className="badge-count">{items.length} Items</span>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>Manage Items</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Browse, search, edit, delete, or update statuses for any item reported across campus.
          </p>
        </Link>

        <Link to="/admin/claims" className="admin-quick-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "32px" }}>📋</span>
            <span className="badge-count" style={{ background: pendingClaims > 0 ? "#78350f" : undefined, color: pendingClaims > 0 ? "#fcd34d" : undefined }}>
              {pendingClaims} Pending
            </span>
          </div>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#fff" }}>Manage Claims</h3>
          <p style={{ fontSize: "13px", color: "var(--muted)" }}>
            Directly review, approve, or reject ownership claims submitted by campus community members.
          </p>
        </Link>
      </div>

      {/* Category Analytics Section */}
      <div className="analytics-section" style={{ marginTop: "36px" }}>
        <h3>Category Breakdown</h3>
        <p>Distribution of lost and found belongings across standard categories.</p>

        <div className="analytics-list">
          {categoryReports.map((report) => {
            const percentage =
              totalItems > 0 ? Math.round((report.count / totalItems) * 100) : 0;

            return (
              <div key={report.category} className="analytics-item">
                <div className="analytics-info">
                  <span>{report.category}</span>
                  <strong>
                    {report.count} items ({percentage}%)
                  </strong>
                </div>
                <div className="analytics-bar">
                  <div
                    className="analytics-fill"
                    style={{ width: `${Math.max(percentage, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
