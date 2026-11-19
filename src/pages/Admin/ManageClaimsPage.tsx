import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { Claim } from "../../types";
import "./AdminPages.css";

export const ManageClaimsPage = () => {
  const { currentUser, showToast } = useAuth();

  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const loadAllClaims = async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const data = await api.claims.getAll(currentUser.token);
      setClaims(data);
      setError("");
    } catch {
      setError("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllClaims();
  }, [currentUser?.token]);

  const filteredClaims = useMemo(() => {
    return claims.filter((claim) => {
      const itemTitle =
        typeof claim.itemId === "object" ? claim.itemId?.title || "" : "";
      const claimantName = claim.claimantId?.name || "";
      const claimantEmail = claim.claimantId?.email || "";

      const matchesSearch =
        !searchTerm.trim() ||
        `${itemTitle} ${claimantName} ${claimantEmail} ${claim.proofDescription}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || claim.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [claims, searchTerm, statusFilter]);

  const handleUpdateClaim = async (
    claimId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!currentUser?.token) return;

    const confirmMsg =
      status === "APPROVED"
        ? "Approve this claim? The item will be marked as MATCHED and other pending claims will be rejected."
        : "Reject this claim?";

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.claims.updateStatus(claimId, status, currentUser.token);
      showToast(`Claim has been ${status.toLowerCase()} by administrator.`);
      await loadAllClaims();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update claim.");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="eyebrow" style={{ color: "#c084fc" }}>
            OWNERSHIP RESOLUTION
          </span>
          <h1>Manage Claims ({claims.length})</h1>
          <p>Inspect proof of ownership descriptions and adjudicate claims across the campus network.</p>
        </div>
      </div>

      {/* Admin Subnav */}
      <div className="admin-nav-bar">
        <NavLink to="/admin" end className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📊 Overview
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          👥 Manage Users
        </NavLink>
        <NavLink to="/admin/items" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📦 Manage Items
        </NavLink>
        <NavLink to="/admin/claims" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📋 Manage Claims ({claims.length})
        </NavLink>
      </div>

      {/* Toolbar */}
      <div className="items-filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search claims by item name, claimant, email, or proof details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-btn" onClick={() => setSearchTerm("")}>
              ✕
            </button>
          )}
        </div>

        <div className="filter-selects">
          <div className="filters">
            <button
              className={`filter ${statusFilter === "ALL" ? "active" : ""}`}
              onClick={() => setStatusFilter("ALL")}
            >
              All
            </button>
            <button
              className={`filter ${statusFilter === "PENDING" ? "active" : ""}`}
              onClick={() => setStatusFilter("PENDING")}
            >
              Pending
            </button>
            <button
              className={`filter ${statusFilter === "APPROVED" ? "active" : ""}`}
              onClick={() => setStatusFilter("APPROVED")}
            >
              Approved
            </button>
            <button
              className={`filter ${statusFilter === "REJECTED" ? "active" : ""}`}
              onClick={() => setStatusFilter("REJECTED")}
            >
              Rejected
            </button>
          </div>
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading claims...</p>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && filteredClaims.length === 0 && (
        <div className="empty-state">
          <span>📋</span>
          <h3>No Claims Match Your Criteria</h3>
        </div>
      )}

      {!loading && !error && filteredClaims.length > 0 && (
        <div className="claims-grid">
          {filteredClaims.map((claim) => {
            const item = typeof claim.itemId === "object" ? claim.itemId : null;

            return (
              <div key={claim._id} className="claim-card" style={{ borderColor: "rgba(88, 28, 135, 0.4)" }}>
                <div className="claim-header">
                  <div>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                      {item?.title || "Found Item"}
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                      Claimant: <strong style={{ color: "var(--cyan)" }}>{claim.claimantId?.name}</strong> ({claim.claimantId?.email})
                    </p>
                    <p style={{ fontSize: "11px", color: "var(--muted)" }}>
                      Item Founder: {claim.ownerId?.name} ({claim.ownerId?.email})
                    </p>
                  </div>

                  <span className={`role-badge ${claim.status.toLowerCase()}`}>
                    {claim.status}
                  </span>
                </div>

                {item && (
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: "4px 0" }}>
                    Location: 📍 {item.location} · 📅 {item.date?.slice(0, 10)}
                  </p>
                )}

                <div className="claim-proof">
                  <strong style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                    OWNERSHIP PROOF PROVIDED:
                  </strong>
                  "{claim.proofDescription}"
                </div>

                {claim.status === "PENDING" && (
                  <div className="claim-actions">
                    <button
                      className="btn-approve"
                      onClick={() => void handleUpdateClaim(claim._id, "APPROVED")}
                    >
                      ✓ Admin Approve
                    </button>
                    <button
                      className="btn-reject"
                      onClick={() => void handleUpdateClaim(claim._id, "REJECTED")}
                    >
                      ✕ Admin Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ManageClaimsPage;
