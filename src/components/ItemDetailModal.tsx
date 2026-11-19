import type { Item } from "../types";
import { useAuth } from "../context/AuthContext";

interface ItemDetailModalProps {
  item: Item;
  onClose: () => void;
  onFindMatches?: (item: Item) => void;
  onClaim?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (item: Item, status: string) => void;
}

export const ItemDetailModal = ({
  item,
  onClose,
  onFindMatches,
  onClaim,
  onEdit,
  onDelete,
  onStatusChange,
}: ItemDetailModalProps) => {
  const { currentUser, isAdmin } = useAuth();
  const ownerId =
    typeof item.userId === "string" ? item.userId : item.userId?._id;
  const isOwner = currentUser && ownerId === currentUser.userId;
  const canManage = isOwner || isAdmin;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="form-section"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "680px" }}
      >
        <div className="form-heading">
          <div>
            <span className="eyebrow">ITEM DETAILS</span>
            <h2>{item.title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        {item.image ? (
          <div style={{ maxHeight: "320px", overflow: "hidden", borderRadius: "14px", marginBottom: "16px", background: "#020617" }}>
            <img
              src={item.image}
              alt={item.title}
              style={{ width: "100%", maxHeight: "320px", objectFit: "contain", display: "block" }}
            />
          </div>
        ) : (
          <div
            style={{
              height: "160px",
              borderRadius: "14px",
              background: "#1e293b",
              display: "grid",
              placeItems: "center",
              fontSize: "50px",
              marginBottom: "16px",
            }}
          >
            📦
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
          <span className={`badge ${item.itemType.toLowerCase()}`} style={{ position: "static" }}>
            {item.itemType}
          </span>
          <span
            className="role-badge"
            style={{
              background:
                item.status === "RETURNED"
                  ? "rgba(6, 78, 59, 0.6)"
                  : item.status === "MATCHED"
                  ? "rgba(120, 53, 15, 0.6)"
                  : "rgba(30, 41, 59, 0.8)",
              color:
                item.status === "RETURNED"
                  ? "#6ee7b7"
                  : item.status === "MATCHED"
                  ? "#fcd34d"
                  : "#93c5fd",
            }}
          >
            Status: {item.status}
          </span>
        </div>

        <p style={{ fontSize: "14px", lineHeight: "1.7", color: "#e2e8f0", marginBottom: "16px" }}>
          {item.description}
        </p>

        <div className="item-meta" style={{ borderTop: "1px solid var(--line-strong)", paddingTop: "14px" }}>
          <div>
            <strong>Category:</strong>
            <span>{item.category}</span>
          </div>
          <div>
            <strong>Location:</strong>
            <span>📍 {item.location}</span>
          </div>
          <div>
            <strong>Date Reported:</strong>
            <span>📅 {item.date.slice(0, 10)}</span>
          </div>
          {typeof item.userId === "object" && item.userId?.name && (
            <div>
              <strong>Reported By:</strong>
              <span>{item.userId.name}</span>
            </div>
          )}
        </div>

        {canManage && onStatusChange && (
          <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
              Update Status:
            </span>
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item, e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                background: "#0f172a",
                border: "1px solid #334155",
                color: "var(--cyan)",
                fontSize: "12px",
              }}
            >
              <option value="OPEN">OPEN</option>
              <option value="MATCHED">MATCHED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "24px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
          {onFindMatches && (
            <button
              className="match-button"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                onFindMatches(item);
              }}
            >
              ✨ Find Smart Matches
            </button>
          )}

          {item.itemType === "FOUND" && item.status === "OPEN" && !isOwner && onClaim && (
            <button
              className="submit-button"
              style={{ flex: 1 }}
              onClick={() => {
                onClose();
                onClaim(item);
              }}
            >
              Claim This Item
            </button>
          )}

          {canManage && onEdit && (
            <button
              className="btn-edit"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              style={{ padding: "10px 16px" }}
            >
              Edit
            </button>
          )}

          {canManage && onDelete && (
            <button
              className="btn-delete"
              onClick={() => {
                onClose();
                onDelete(item._id);
              }}
              style={{ padding: "10px 16px" }}
            >
              Delete
            </button>
          )}

          <button className="cancel-button" onClick={onClose} style={{ marginLeft: "auto" }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
