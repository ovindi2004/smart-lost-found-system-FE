import type { Item } from "../types";
import { useAuth } from "../context/AuthContext";

interface ItemCardProps {
  item: Item;
  onSelect?: (item: Item) => void;
  onFindMatches?: (item: Item) => void;
  onClaim?: (item: Item) => void;
  onEdit?: (item: Item) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (item: Item, status: string) => void;
}

export const ItemCard = ({
  item,
  onSelect,
  onFindMatches,
  onClaim,
  onEdit,
  onDelete,
  onStatusChange,
}: ItemCardProps) => {
  const { currentUser, isAdmin } = useAuth();
  const ownerId =
    typeof item.userId === "string" ? item.userId : item.userId?._id;
  const isOwner = currentUser && ownerId === currentUser.userId;
  const canManage = isOwner || isAdmin;

  const handleCardClick = (e: React.MouseEvent) => {
    // If the click is inside a button or select, don't trigger card selection
    if ((e.target as HTMLElement).closest("button, select, a")) return;
    if (onSelect) onSelect(item);
  };

  return (
    <article
      className="item-card"
      onClick={handleCardClick}
      style={{ cursor: onSelect ? "pointer" : "default" }}
    >
      <div className="card-image-wrap">
        {item.image ? (
          <img src={item.image} alt={item.title} className="item-image" loading="lazy" />
        ) : (
          <div className="item-placeholder">📦</div>
        )}

        <span className={`badge ${item.itemType.toLowerCase()}`}>
          {item.itemType}
        </span>

        {item.status && (
          <span
            className="role-badge"
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              fontSize: "10px",
              background:
                item.status === "RETURNED"
                  ? "rgba(6, 78, 59, 0.85)"
                  : item.status === "MATCHED"
                  ? "rgba(120, 53, 15, 0.85)"
                  : "rgba(15, 23, 42, 0.85)",
              color:
                item.status === "RETURNED"
                  ? "#6ee7b7"
                  : item.status === "MATCHED"
                  ? "#fcd34d"
                  : "#93c5fd",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {item.status}
          </span>
        )}
      </div>

      <div className="item-content">
        <h3>{item.title}</h3>
        <p>{item.description}</p>

        <div className="item-meta">
          <div>
            <strong>Category:</strong>
            <span>{item.category}</span>
          </div>
          <div>
            <strong>Location:</strong>
            <span>📍 {item.location}</span>
          </div>
          <div>
            <strong>Date:</strong>
            <span>📅 {item.date.slice(0, 10)}</span>
          </div>
        </div>

        {canManage && onStatusChange && (
          <div className="status-control">
            <span>Status:</span>
            <select
              value={item.status}
              onChange={(e) => onStatusChange(item, e.target.value)}
              onClick={(e) => e.stopPropagation()}
            >
              <option value="OPEN">OPEN</option>
              <option value="MATCHED">MATCHED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "auto", paddingTop: "8px" }}>
          {onFindMatches && (
            <button
              className="match-button"
              onClick={(e) => {
                e.stopPropagation();
                onFindMatches(item);
              }}
            >
              ✨ Find Smart Matches
            </button>
          )}

          {item.itemType === "FOUND" &&
            item.status === "OPEN" &&
            !isOwner &&
            onClaim && (
              <button
                className="hero-button secondary"
                style={{
                  padding: "8px 12px",
                  fontSize: "12px",
                  justifyContent: "center",
                  width: "100%",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onClaim(item);
                }}
              >
                Claim This Item
              </button>
            )}

          {canManage && (onEdit || onDelete) && (
            <div className="item-actions">
              {onEdit && (
                <button
                  className="btn-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(item);
                  }}
                >
                  Edit
                </button>
              )}
              {onDelete && (
                <button
                  className="btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item._id);
                  }}
                >
                  Delete
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
};

export default ItemCard;
