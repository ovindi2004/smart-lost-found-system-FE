import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { Item, Claim } from "../../types";
import ItemCard from "../../components/ItemCard";
import ItemForm from "../../components/ItemForm";
import SmartMatchModal from "../../components/SmartMatchModal";
import ItemDetailModal from "../../components/ItemDetailModal";
import "./UserPages.css";

export const UserDashboard = () => {
  const { currentUser, showToast } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [receivedClaims, setReceivedClaims] = useState<Claim[]>([]);
  const [submittedClaims, setSubmittedClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"LOST" | "FOUND">("LOST");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Matching & Detail modal
  const [matchingItem, setMatchingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const loadData = async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const [allItems, myRec, mySub] = await Promise.all([
        api.items.getAll(),
        api.claims.getMyReceived(currentUser.token),
        api.claims.getMySubmitted(currentUser.token),
      ]);

      // Filter only items reported by current user
      const userItems = allItems.filter((item) => {
        const ownerId =
          typeof item.userId === "string" ? item.userId : item.userId?._id;
        return ownerId === currentUser.userId;
      });

      setItems(userItems);
      setReceivedClaims(myRec);
      setSubmittedClaims(mySub);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentUser?.token]);

  const lostCount = items.filter((i) => i.itemType === "LOST").length;
  const foundCount = items.filter((i) => i.itemType === "FOUND").length;
  const pendingReceived = receivedClaims.filter((c) => c.status === "PENDING").length;

  return (
    <div className="user-page">
      <div className="user-page-header">
        <div>
          <span className="eyebrow">STUDENT & STAFF PORTAL</span>
          <h1>Welcome, {currentUser?.name} 👋</h1>
          <p>Manage your reported campus items, track claims, and monitor recovery progress.</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="hero-button primary"
            style={{ padding: "10px 18px", fontSize: "13px" }}
            onClick={() => {
              setFormType("LOST");
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            + Report Lost
          </button>
          <button
            className="hero-button secondary"
            style={{ padding: "10px 18px", fontSize: "13px" }}
            onClick={() => {
              setFormType("FOUND");
              setEditingItem(null);
              setFormOpen(true);
            }}
          >
            + Report Found
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-cards" style={{ marginBottom: "32px" }}>
        <div className="dashboard-card">
          <h3>Total Reported</h3>
          <p>{items.length}</p>
        </div>
        <div className="dashboard-card lost">
          <h3>My Lost Items</h3>
          <p>{lostCount}</p>
        </div>
        <div className="dashboard-card found">
          <h3>My Found Items</h3>
          <p>{foundCount}</p>
        </div>
        <div className="dashboard-card matched">
          <h3>Claims Received</h3>
          <p>{receivedClaims.length}</p>
          {pendingReceived > 0 && (
            <span style={{ fontSize: "11px", color: "#fcd34d", fontWeight: 700 }}>
              {pendingReceived} pending review
            </span>
          )}
        </div>
        <div className="dashboard-card returned">
          <h3>Claims Submitted</h3>
          <p>{submittedClaims.length}</p>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "16px",
          marginBottom: "36px",
        }}
      >
        <Link
          to="/my-items"
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid var(--line-strong)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>📦</span>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Manage My Items</h3>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            View, edit, mark as returned, or run AI Smart Matching on your items.
          </p>
        </Link>

        <Link
          to="/my-claims"
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid var(--line-strong)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>📋</span>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>
            Ownership Claims {pendingReceived > 0 && `(${pendingReceived})`}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            Approve or reject claims for items you found, and track your submitted claims.
          </p>
        </Link>

        <Link
          to="/items"
          style={{
            padding: "20px",
            borderRadius: "18px",
            background: "rgba(15, 23, 42, 0.7)",
            border: "1px solid var(--line-strong)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "28px" }}>🔍</span>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#fff" }}>Browse Campus Items</h3>
          <p style={{ fontSize: "12px", color: "var(--muted)" }}>
            Explore recently lost and found belongings reported across the entire university.
          </p>
        </Link>
      </div>

      {/* Recent Activity Section */}
      <div className="section-heading">
        <div>
          <span className="eyebrow">YOUR RECENT REPORTS</span>
          <h2>Recently Reported Belongings</h2>
        </div>
        <Link to="/my-items" className="btn-login" style={{ fontSize: "12px" }}>
          View All ({items.length})
        </Link>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading your items...</p>}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <span>📝</span>
          <h3>You Haven't Reported Any Items Yet</h3>
          <p>Lost or found something on campus? Report it now so AI can help match it.</p>
          <div style={{ marginTop: "16px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              className="hero-button primary"
              style={{ padding: "10px 18px", fontSize: "12px" }}
              onClick={() => {
                setFormType("LOST");
                setFormOpen(true);
              }}
            >
              Report Lost Item
            </button>
            <button
              className="hero-button secondary"
              style={{ padding: "10px 18px", fontSize: "12px" }}
              onClick={() => {
                setFormType("FOUND");
                setFormOpen(true);
              }}
            >
              Report Found Item
            </button>
          </div>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="items-grid">
          {items.slice(0, 4).map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onSelect={(selected) => setSelectedItem(selected)}
              onFindMatches={(itemToMatch) => setMatchingItem(itemToMatch)}
              onEdit={(itemToEdit) => {
                setEditingItem(itemToEdit);
                setFormOpen(true);
              }}
              onDelete={async (id) => {
                if (!window.confirm("Are you sure you want to delete this report?")) return;
                try {
                  await api.items.delete(id, currentUser!.token);
                  showToast("Item deleted successfully!");
                  await loadData();
                } catch (err) {
                  showToast("Failed to delete item.");
                }
              }}
              onStatusChange={async (it, st) => {
                try {
                  await api.items.update(it._id, { status: st }, currentUser!.token);
                  showToast("Status updated!");
                  await loadData();
                } catch {
                  showToast("Failed to update status.");
                }
              }}
            />
          ))}
        </div>
      )}

      {/* Item Form Modal */}
      {formOpen && (
        <ItemForm
          initialItem={editingItem}
          defaultType={formType}
          onClose={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => void loadData()}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFindMatches={(it) => setMatchingItem(it)}
          onEdit={(it) => {
            setEditingItem(it);
            setFormOpen(true);
          }}
        />
      )}

      {/* Smart Match Modal */}
      {matchingItem && (
        <SmartMatchModal
          item={matchingItem}
          matches={[]}
          loading={false}
          error=""
          onClose={() => setMatchingItem(null)}
        />
      )}
    </div>
  );
};

export default UserDashboard;
