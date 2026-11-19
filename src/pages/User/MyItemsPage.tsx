import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { Item, MatchResult } from "../../types";
import ItemCard from "../../components/ItemCard";
import ItemForm from "../../components/ItemForm";
import SmartMatchModal from "../../components/SmartMatchModal";
import ItemDetailModal from "../../components/ItemDetailModal";
import "./UserPages.css";

export const MyItemsPage = () => {
  const { currentUser, showToast } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterType, setFilterType] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Smart Matching
  const [matchingItem, setMatchingItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");

  const loadMyItems = async () => {
    if (!currentUser?.token) return;
    try {
      setLoading(true);
      const allItems = await api.items.getAll();
      const myItems = allItems.filter((it) => {
        const ownerId =
          typeof it.userId === "string" ? it.userId : it.userId?._id;
        return ownerId === currentUser.userId;
      });
      setItems(myItems);
      setError("");
    } catch {
      setError("Failed to load your reported items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMyItems();
  }, [currentUser?.token]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        `${item.title} ${item.description || ""} ${item.category || ""} ${item.location || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType = filterType === "ALL" || item.itemType === filterType;
      const matchesStatus = filterStatus === "ALL" || item.status === filterStatus;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, searchTerm, filterType, filterStatus]);

  const handleFindMatches = async (item: Item) => {
    setMatchingItem(item);
    setMatches([]);
    setMatchingError("");
    setMatchingLoading(true);

    try {
      const results = await api.items.getMatches(item._id);
      setMatches(results);
    } catch (err) {
      setMatchingError(
        err instanceof Error ? err.message : "Failed to compute matches."
      );
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleStatusChange = async (item: Item, newStatus: string) => {
    if (!currentUser?.token) return;
    try {
      await api.items.update(item._id, { status: newStatus }, currentUser.token);
      showToast("Item status updated successfully!");
      await loadMyItems();
    } catch (err) {
      showToast("Failed to update status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser?.token) return;
    if (!window.confirm("Are you sure you want to delete this reported item?")) return;

    try {
      await api.items.delete(id, currentUser.token);
      showToast("Item deleted successfully!");
      await loadMyItems();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch {
      showToast("Failed to delete item.");
    }
  };

  return (
    <div className="user-page">
      <div className="user-page-header">
        <div>
          <span className="eyebrow">MY REPORTED BELONGINGS</span>
          <h1>My Items ({items.length})</h1>
          <p>Manage your reported lost and found items, update statuses, and find AI matches.</p>
        </div>

        <button
          className="btn-report-item"
          onClick={() => {
            setEditingItem(null);
            setFormOpen(true);
          }}
        >
          + Report New Item
        </button>
      </div>

      {/* Toolbar */}
      <div className="items-filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search your items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-selects">
          <div className="filters">
            <button
              className={`filter ${filterType === "ALL" ? "active" : ""}`}
              onClick={() => setFilterType("ALL")}
            >
              All
            </button>
            <button
              className={`filter ${filterType === "LOST" ? "active" : ""}`}
              onClick={() => setFilterType("LOST")}
            >
              Lost
            </button>
            <button
              className={`filter ${filterType === "FOUND" ? "active" : ""}`}
              onClick={() => setFilterType("FOUND")}
            >
              Found
            </button>
          </div>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MATCHED">Matched</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading your items...</p>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <span>📦</span>
          <h3>No Items Found</h3>
          <p>You have not reported any items matching these criteria.</p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onSelect={(selected) => setSelectedItem(selected)}
              onFindMatches={(it) => void handleFindMatches(it)}
              onEdit={(it) => {
                setEditingItem(it);
                setFormOpen(true);
              }}
              onDelete={(id) => void handleDelete(id)}
              onStatusChange={(it, st) => void handleStatusChange(it, st)}
            />
          ))}
        </div>
      )}

      {/* Item Form Modal */}
      {formOpen && (
        <ItemForm
          initialItem={editingItem}
          defaultType={filterType === "FOUND" ? "FOUND" : "LOST"}
          onClose={() => {
            setFormOpen(false);
            setEditingItem(null);
          }}
          onSuccess={() => void loadMyItems()}
        />
      )}

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFindMatches={(it) => void handleFindMatches(it)}
          onEdit={(it) => {
            setEditingItem(it);
            setFormOpen(true);
          }}
          onDelete={(id) => void handleDelete(id)}
          onStatusChange={(it, st) => void handleStatusChange(it, st)}
        />
      )}

      {/* Smart Match Modal */}
      {matchingItem && (
        <SmartMatchModal
          item={matchingItem}
          matches={matches}
          loading={matchingLoading}
          error={matchingError}
          currentUserId={currentUser?.userId}
          onClose={() => setMatchingItem(null)}
        />
      )}
    </div>
  );
};

export default MyItemsPage;
