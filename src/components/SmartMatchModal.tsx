import type { Item, MatchResult } from "../types";

interface SmartMatchModalProps {
  item: Item;
  matches: MatchResult[];
  loading: boolean;
  error: string;
  onClose: () => void;
  onClaimItem?: (item: Item) => void;
  currentUserId?: string;
}

export const SmartMatchModal = ({
  item,
  matches,
  loading,
  error,
  onClose,
  onClaimItem,
  currentUserId,
}: SmartMatchModalProps) => {
  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="form-section matches-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "880px" }}
      >
        <div className="form-heading">
          <div>
            <span className="eyebrow">✨ AI SMART MATCHING</span>
            <h2>Matches for "{item.title}"</h2>
            <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "4px" }}>
              Looking for possible {item.itemType === "LOST" ? "FOUND" : "LOST"} matches on campus using category, title, description, location, and dates.
            </p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close matches">
            ✕
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px", animation: "pulse 1.5s infinite" }}>🤖</div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--cyan)" }}>Analyzing campus items with AI...</p>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>Calculating similarity scores and matching criteria.</p>
          </div>
        )}

        {error && (
          <div className="message error" style={{ margin: "16px 0" }}>
            {error}
          </div>
        )}

        {!loading && !error && matches.length === 0 && (
          <div className="empty-state" style={{ margin: "20px 0" }}>
            <span style={{ fontSize: "38px" }}>🔍</span>
            <h3>No Matches Found Yet</h3>
            <p>
              We couldn't find any {item.itemType === "LOST" ? "found" : "lost"} items matching this criteria.
              Check back later as new items are reported daily!
            </p>
          </div>
        )}

        {!loading && !error && matches.length > 0 && (
          <div
            className="modal-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "16px",
              marginTop: "16px",
            }}
          >
            {matches.map((match) => {
              const matchedItem = match.item;
              const ownerId =
                typeof matchedItem.userId === "string"
                  ? matchedItem.userId
                  : matchedItem.userId?._id;
              const isOwnItem = currentUserId && ownerId === currentUserId;

              return (
                <div key={matchedItem._id} className="item-card" style={{ background: "#0a0f1d" }}>
                  <div className="card-image-wrap" style={{ height: "150px" }}>
                    {matchedItem.image ? (
                      <img
                        src={matchedItem.image}
                        alt={matchedItem.title}
                        className="item-image"
                      />
                    ) : (
                      <div className="item-placeholder">📦</div>
                    )}
                    <span className="match-score-badge">
                      {match.matchScore}% Match
                    </span>
                  </div>

                  <div className="item-content" style={{ padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                      <h3 style={{ fontSize: "15px" }}>{matchedItem.title}</h3>
                      <span className={`badge ${matchedItem.itemType.toLowerCase()}`} style={{ position: "static" }}>
                        {matchedItem.itemType}
                      </span>
                    </div>

                    <p style={{ fontSize: "11px", margin: "4px 0" }}>{matchedItem.description}</p>

                    <div className="match-reasons">
                      <strong>Matched on:</strong>
                      <ul>
                        {match.matchedReasons.map((reason, i) => (
                          <li key={i}>✓ {reason}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="item-meta" style={{ marginTop: "8px", fontSize: "11px" }}>
                      <div>
                        <strong>Category:</strong>
                        <span>{matchedItem.category}</span>
                      </div>
                      <div>
                        <strong>Location:</strong>
                        <span>{matchedItem.location}</span>
                      </div>
                      <div>
                        <strong>Date:</strong>
                        <span>{matchedItem.date.slice(0, 10)}</span>
                      </div>
                    </div>

                    {matchedItem.itemType === "FOUND" &&
                      matchedItem.status === "OPEN" &&
                      !isOwnItem &&
                      onClaimItem && (
                        <button
                          className="hero-button secondary"
                          style={{
                            marginTop: "10px",
                            padding: "8px 12px",
                            fontSize: "12px",
                            justifyContent: "center",
                            width: "100%",
                          }}
                          onClick={() => {
                            onClose();
                            onClaimItem(matchedItem);
                          }}
                        >
                          Submit Claim
                        </button>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button className="cancel-button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartMatchModal;
