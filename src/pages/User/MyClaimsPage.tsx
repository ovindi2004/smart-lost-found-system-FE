import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { Claim } from "../../types";
import "./UserPages.css";

export const MyClaimsPage = () => {
  const { currentUser, showToast, refreshNotifications } = useAuth();

  const [activeTab, setActiveTab] = useState<"received" | "submitted">("received");
  const [receivedClaims, setReceivedClaims] = useState<Claim[]>([]);
  const [submittedClaims, setSubmittedClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClaims = async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const [received, submitted] = await Promise.all([
        api.claims.getMyReceived(currentUser.token),
        api.claims.getMySubmitted(currentUser.token),
      ]);
      setReceivedClaims(received);
      setSubmittedClaims(submitted);
      setError("");
    } catch {
      setError("Failed to load claims.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClaims();
  }, [currentUser?.token]);

  const handleUpdateClaim = async (
    claimId: string,
    status: "APPROVED" | "REJECTED"
  ) => {
    if (!currentUser?.token) return;
    const confirmMsg =
      status === "APPROVED"
        ? "Are you sure you want to approve this claim? The item will be marked as MATCHED."
        : "Are you sure you want to reject this claim?";

    if (!window.confirm(confirmMsg)) return;

    try {
      await api.claims.updateStatus(claimId, status, currentUser.token);
      showToast(`Claim ${status.toLowerCase()} successfully!`);
      await loadClaims();
      await refreshNotifications();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update claim.");
    }
  };

  const pendingReceivedCount = receivedClaims.filter(
    (c) => c.status === "PENDING"
  ).length;

  return (
    <div className="user-page">
      <div className="user-page-header">
        <div>
          <span className="eyebrow">OWNERSHIP CLAIMS MANAGEMENT</span>
          <h1>My Claims</h1>
          <p>Review ownership verification requests for items you found, or track claims you submitted.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="user-tabs">
        <button
          className={`user-tab ${activeTab === "received" ? "active" : ""}`}
          onClick={() => setActiveTab("received")}
        >
          Claims Received on My Found Items ({receivedClaims.length})
          {pendingReceivedCount > 0 && (
            <span
              style={{
                marginLeft: "8px",
                padding: "2px 7px",
                borderRadius: "999px",
                fontSize: "10px",
                background: "#f43f5e",
                color: "#fff",
              }}
            >
              {pendingReceivedCount} new
            </span>
          )}
        </button>
        <button
          className={`user-tab ${activeTab === "submitted" ? "active" : ""}`}
          onClick={() => setActiveTab("submitted")}
        >
          Claims I Have Submitted ({submittedClaims.length})
        </button>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading claims...</p>}
      {error && <div className="message error">{error}</div>}

      {/* Tab 1: Received Claims */}
      {!loading && activeTab === "received" && (
        <div>
          {receivedClaims.length === 0 ? (
            <div className="empty-state">
              <span>📋</span>
              <h3>No Claims Received Yet</h3>
              <p>When someone claims an item you found and reported, it will appear here for your review.</p>
            </div>
          ) : (
            <div className="claims-grid">
              {receivedClaims.map((claim) => {
                const item = typeof claim.itemId === "object" ? claim.itemId : null;

                return (
                  <div key={claim._id} className="claim-card">
                    <div className="claim-header">
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                          {item?.title || "Item"}
                        </h3>
                        <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                          Claimed by: <strong style={{ color: "var(--cyan)" }}>{claim.claimantId?.name}</strong> ({claim.claimantId?.email})
                        </p>
                      </div>

                      <span
                        className={`role-badge ${claim.status.toLowerCase()}`}
                        style={{ fontSize: "10px" }}
                      >
                        {claim.status}
                      </span>
                    </div>

                    {item && (
                      <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Found at: 📍 {item.location} · 📅 {item.date?.slice(0, 10)}
                      </p>
                    )}

                    <div className="claim-proof">
                      <strong style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                        PROVING OWNERSHIP WITH:
                      </strong>
                      "{claim.proofDescription}"
                    </div>

                    {claim.status === "PENDING" && (
                      <div className="claim-actions">
                        <button
                          className="btn-approve"
                          onClick={() => void handleUpdateClaim(claim._id, "APPROVED")}
                        >
                          ✓ Approve Claim
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => void handleUpdateClaim(claim._id, "REJECTED")}
                        >
                          ✕ Reject Claim
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Submitted Claims */}
      {!loading && activeTab === "submitted" && (
        <div>
          {submittedClaims.length === 0 ? (
            <div className="empty-state">
              <span>🏷️</span>
              <h3>No Claims Submitted</h3>
              <p>You haven't submitted any ownership claims for found items yet.</p>
            </div>
          ) : (
            <div className="claims-grid">
              {submittedClaims.map((claim) => {
                const item = typeof claim.itemId === "object" ? claim.itemId : null;

                return (
                  <div key={claim._id} className="claim-card">
                    <div className="claim-header">
                      <div>
                        <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
                          {item?.title || "Found Item"}
                        </h3>
                        <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "2px" }}>
                          Finder: {claim.ownerId?.name || "Campus User"}
                        </p>
                      </div>

                      <span
                        className={`role-badge ${claim.status.toLowerCase()}`}
                        style={{ fontSize: "10px" }}
                      >
                        {claim.status}
                      </span>
                    </div>

                    {item && (
                      <p style={{ fontSize: "12px", color: "var(--muted)" }}>
                        Location: 📍 {item.location} · {item.category}
                      </p>
                    )}

                    <div className="claim-proof">
                      <strong style={{ display: "block", fontSize: "11px", color: "var(--muted)", marginBottom: "4px" }}>
                        YOUR PROOF SUBMITTED:
                      </strong>
                      "{claim.proofDescription}"
                    </div>

                    <div style={{ marginTop: "auto", fontSize: "11px", color: "var(--muted)" }}>
                      {claim.status === "PENDING" && "⏳ Pending review by item finder."}
                      {claim.status === "APPROVED" && "🎉 Claim approved! Contact the founder to arrange pickup."}
                      {claim.status === "REJECTED" && "❌ Claim was not approved by founder."}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyClaimsPage;
