import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { CATEGORIES, type Item, type MatchResult } from "../../types";
import { api } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import ItemCard from "../../components/ItemCard";
import ItemForm from "../../components/ItemForm";
import SmartMatchModal from "../../components/SmartMatchModal";
import ClaimModal from "../../components/ClaimModal";
import ItemDetailModal from "../../components/ItemDetailModal";
import "./ItemsPage.css";

export const ItemsPage = () => {
  const { id: routeItemId } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, showToast } = useAuth();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters initialized from search params or defaults
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "LOST" | "FOUND">(
    (searchParams.get("type") as any) || "ALL"
  );
  const [categoryFilter, setCategoryFilter] = useState(
    searchParams.get("category") || "ALL"
  );
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showReportForm, setShowReportForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Smart Matching state
  const [matchingItem, setMatchingItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");

  // Claim modal state
  const [claimItem, setClaimItem] = useState<Item | null>(null);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await api.items.getAll();
      setItems(data);
      setError("");
    } catch (err) {
      setError("Could not load campus items. Please verify the server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  // Sync route /items/:id to open ItemDetailModal
  useEffect(() => {
    if (routeItemId && items.length > 0) {
      const found = items.find((it) => it._id === routeItemId);
      if (found) {
        setSelectedItem(found);
      } else {
        // Fetch individually if not in list
        api.items
          .getById(routeItemId)
          .then((it) => setSelectedItem(it))
          .catch(() => {});
      }
    }
  }, [routeItemId, items]);

  // Keep searchParams synced when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("search", searchTerm.trim());
    if (typeFilter !== "ALL") params.set("type", typeFilter);
    if (categoryFilter !== "ALL") params.set("category", categoryFilter);
    setSearchParams(params, { replace: true });
  }, [searchTerm, typeFilter, categoryFilter, setSearchParams]);

  // Filtered Items computation
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

  // Find Smart Matches handler
  const handleFindMatches = async (item: Item) => {
    setMatchingItem(item);
    setMatches([]);
    setMatchingError("");
    setMatchingLoading(true);

    try {
      const matchResults = await api.items.getMatches(item._id);
      setMatches(matchResults);
    } catch (err) {
      setMatchingError(
        err instanceof Error ? err.message : "Failed to find matching items."
      );
    } finally {
      setMatchingLoading(false);
    }
  };

  // Status Change handler
  const handleStatusChange = async (item: Item, newStatus: string) => {
    if (!currentUser?.token) {
      showToast("Please log in first.");
      return;
    }
    try {
      await api.items.update(item._id, { status: newStatus }, currentUser.token);
      showToast("Item status updated successfully!");
      await loadItems();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to update item status.");
    }
  };

  // Delete Item handler
  const handleDeleteItem = async (id: string) => {
    if (!currentUser?.token) {
      showToast("Please log in first.");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this item report?")) return;

    try {
      await api.items.delete(id, currentUser.token);
      showToast("Item deleted successfully!");
      await loadItems();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to delete item.");
    }
  };

  return (
    <div className="items-page">
      <div className="items-header">
        <div>
          <span className="eyebrow">CAMPUS LOST & FOUND INVENTORY</span>
          <h1>Browse Reported Items</h1>
          <p>Search and filter all lost and found belongings across university grounds.</p>
        </div>

        <button
          className="btn-report-item"
          onClick={() => {
            if (!currentUser) {
              navigate("/login", { state: { from: { pathname: "/items" } } });
            } else {
              setShowReportForm(true);
            }
          }}
        >
          + Report an Item
        </button>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="items-filter-bar">
        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search by keywords, title, location, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-btn"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-selects">
          {/* Type Filter Buttons */}
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

          {/* Category Filter */}
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

          {/* Status Filter */}
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

      {/* Items Section Heading */}
      <div className="section-heading" style={{ marginBottom: "20px" }}>
        <div>
          <span className="eyebrow">
            SHOWING {filteredItems.length} OF {items.length} ITEMS
          </span>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "36px", animation: "pulse 1.5s infinite" }}>🔍</div>
          <p style={{ marginTop: "12px", color: "var(--cyan)", fontWeight: 700 }}>
            Loading items from database...
          </p>
        </div>
      )}

      {error && <div className="message error">{error}</div>}

      {!loading && !error && filteredItems.length === 0 && (
        <div className="empty-state">
          <span>📦</span>
          <h3>No Items Match Your Filter</h3>
          <p>Try clearing your search terms or selecting a different category.</p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="items-grid">
          {filteredItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              onSelect={(selected) => setSelectedItem(selected)}
              onFindMatches={(itemToMatch) => void handleFindMatches(itemToMatch)}
              onClaim={(itemToClaim) => setClaimItem(itemToClaim)}
              onEdit={(itemToEdit) => setEditingItem(itemToEdit)}
              onDelete={(idToDelete) => void handleDeleteItem(idToDelete)}
              onStatusChange={(itemToUpdate, newStat) =>
                void handleStatusChange(itemToUpdate, newStat)
              }
            />
          ))}
        </div>
      )}

      {/* Report / Edit Item Modal */}
      {(showReportForm || editingItem) && (
        <ItemForm
          initialItem={editingItem}
          defaultType={typeFilter === "FOUND" ? "FOUND" : "LOST"}
          onClose={() => {
            setShowReportForm(false);
            setEditingItem(null);
          }}
          onSuccess={() => void loadItems()}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => {
            setSelectedItem(null);
            if (routeItemId) navigate("/items", { replace: true });
          }}
          onFindMatches={(itemToMatch) => void handleFindMatches(itemToMatch)}
          onClaim={(itemToClaim) => setClaimItem(itemToClaim)}
          onEdit={(itemToEdit) => setEditingItem(itemToEdit)}
          onDelete={(idToDelete) => void handleDeleteItem(idToDelete)}
          onStatusChange={(itemToUpdate, newStat) =>
            void handleStatusChange(itemToUpdate, newStat)
          }
        />
      )}

      {/* AI Smart Matches Modal */}
      {matchingItem && (
        <SmartMatchModal
          item={matchingItem}
          matches={matches}
          loading={matchingLoading}
          error={matchingError}
          currentUserId={currentUser?.userId}
          onClose={() => setMatchingItem(null)}
          onClaimItem={(itemToClaim) => setClaimItem(itemToClaim)}
        />
      )}

      {/* Submit Claim Modal */}
      {claimItem && (
        <ClaimModal
          item={claimItem}
          onClose={() => setClaimItem(null)}
          onSuccess={() => void loadItems()}
        />
      )}
    </div>
  );
};

export default ItemsPage;
