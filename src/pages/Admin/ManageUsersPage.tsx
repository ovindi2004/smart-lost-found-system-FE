import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { User } from "../../types";
import "./AdminPages.css";

export const ManageUsersPage = () => {
  const { currentUser, showToast } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const loadUsers = async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const data = await api.users.getAll(currentUser.token);
      setUsers(data);
      setError("");
    } catch (err) {
      setError("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUsers();
  }, [currentUser?.token]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleDeleteUser = async (userToDelete: User) => {
    if (!currentUser?.token) return;

    if (userToDelete.role === "ADMIN") {
      showToast("Administrator accounts cannot be deleted.");
      return;
    }

    if (userToDelete._id === currentUser.userId) {
      showToast("You cannot delete your own account.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to revoke account access for ${userToDelete.name} (${userToDelete.email})?`
      )
    ) {
      return;
    }

    try {
      await api.users.delete(userToDelete._id, currentUser.token);
      showToast(`User ${userToDelete.name} was successfully removed.`);
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete user.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="eyebrow" style={{ color: "#c084fc" }}>
            ACCOUNT ADMINISTRATION
          </span>
          <h1>Manage Campus Users ({users.length})</h1>
          <p>Inspect registered user credentials, check roles, and revoke accounts when necessary.</p>
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
          📦 Manage Items
        </NavLink>
        <NavLink to="/admin/claims" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📋 Manage Claims
        </NavLink>
      </div>

      {/* Search Bar */}
      <div className="items-filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading user accounts...</p>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && (
        <div className="user-management">
          <div className="um-header">
            <div>
              <span className="um-eyebrow">👥 USER ROSTER</span>
              <h3>Registered Campus Community Members</h3>
            </div>
            <span className="badge-count">{filteredUsers.length} Users</span>
          </div>

          <div className="users-table-wrap">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined Date</th>
                  <th className="th-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td className="cell-name">{user.name}</td>
                    <td className="cell-email">{user.email}</td>
                    <td>
                      <span className={`role-badge ${user.role.toLowerCase()}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="th-right">
                      {user.role !== "ADMIN" && (
                        <button
                          className="delete-user-button"
                          onClick={() => void handleDeleteUser(user)}
                          title="Revoke user account"
                        >
                          Revoke User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersPage;
