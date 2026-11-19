import { useState, useEffect, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import { CATEGORIES, type Item, type MatchResult } from "../../types";
import ItemCard from "../../components/ItemCard";
import ItemForm from "../../components/ItemForm";
import SmartMatchModal from "../../components/SmartMatchModal";
import ItemDetailModal from "../../components/ItemDetailModal";
import "./AdminPages.css";

export const ManageItemsPage = () => {
  const { currentUser, showToast } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [matchingItem, setMatchingItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const loadAllItems = async () => {
    try {
      setLoading(true);
      const data = await api.items.getAll();
      setItems(data);
      setError("");
    } catch {
      setError("Failed to load inventory items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAllItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        `${item.title} ${item.description || ""} ${item.category || ""} ${item.location || ""}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === "ALL" || item.itemType === typeFilter;
      const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    });
  }, [items, searchTerm, typeFilter, categoryFilter, statusFilter]);

  const handleStatusChange = async (item: Item, newStatus: string) => {
    if (!currentUser?.token) return;
    try {
      await api.items.update(item._id, { status: newStatus }, currentUser.token);
      showToast("Item status updated successfully!");
      await loadAllItems();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update item status.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!currentUser?.token) return;
    if (!window.confirm("Are you sure you want to delete this item? This action is permanent.")) return;

    try {
      await api.items.delete(id, currentUser.token);
      showToast("Item deleted from campus database.");
      await loadAllItems();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete item.");
    }
  };

  const handleFindMatches = async (item: Item) => {
    setMatchingItem(item);
    setMatches([]);
    setMatchingLoading(true);

    try {
      const results = await api.items.getMatches(item._id);
      setMatches(results);
    } catch {
      showToast("Could not retrieve AI matches.");
    } finally {
      setMatchingLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <span className="eyebrow" style={{ color: "#c084fc" }}>
            CAMPUS INVENTORY CONTROL
          </span>
          <h1>Manage Reported Items ({items.length})</h1>
          <p>Inspect, update status, edit, or remove any reported items in the university system.</p>
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
          📦 Manage Items ({items.length})
        </NavLink>
        <NavLink to="/admin/claims" className={({ isActive }) => `admin-nav-link ${isActive ? "active" : ""}`}>
          📋 Manage Claims
        </NavLink>
      </div>

      {/* Toolbar */}
      <div className="items-filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search all items by title, category, location..."
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
              className={`filter ${typeFilter === "ALL" ? "active" : ""}`}
              onClick={() => setTypeFilter("ALL")}
            >
              All
            </button>
            <button
              className={`filter ${typeFilter === "LOST" ? "active" : ""}`}
              onClick={() => setTypeFilter("LOST")}
            >
              Lost
            </button>
            <button
              className={`filter ${typeFilter === "FOUND" ? "active" : ""}`}
              onClick={() => setTypeFilter("FOUND")}
            >
              Found
            </button>
          </div>

          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="MATCHED">Matched</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {loading && <p style={{ color: "var(--muted)" }}>Loading inventory items...</p>}
      {error && <div className="message error">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <span>📦</span>
          <h3>No Items Match Your Filters</h3>
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
              onEdit={(it) => setEditingItem(it)}
              onDelete={(id) => void handleDeleteItem(id)}
              onStatusChange={(it, st) => void handleStatusChange(it, st)}
            />
          ))}
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <ItemForm
          initialItem={editingItem}
          onClose={() => setEditingItem(null)}
          onSuccess={() => void loadAllItems()}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFindMatches={(it) => void handleFindMatches(it)}
          onEdit={(it) => setEditingItem(it)}
          onDelete={(id) => void handleDeleteItem(id)}
          onStatusChange={(it, st) => void handleStatusChange(it, st)}
        />
      )}

      {/* Smart Match Modal */}
      {matchingItem && (
        <SmartMatchModal
          item={matchingItem}
          matches={matches}
          loading={matchingLoading}
          error=""
          onClose={() => setMatchingItem(null)}
        />
      )}
    </div>
  );
};

export default ManageItemsPage;
