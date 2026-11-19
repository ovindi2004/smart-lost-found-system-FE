import { useState, type FormEvent } from "react";
import type { Item } from "../types";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface ClaimModalProps {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal = ({ item, onClose, onSuccess }: ClaimModalProps) => {
  const { currentUser, showToast } = useAuth();
  const [proofDescription, setProofDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please login before submitting a claim.");
      return;
    }

    if (!proofDescription.trim()) {
      setError("Please describe proof of ownership.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await api.claims.create(item._id, proofDescription.trim(), currentUser.token);
      showToast("Claim submitted successfully! The item founder will review it.");
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit claim.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="form-section" onClick={(e) => e.stopPropagation()}>
        <div className="form-heading">
          <div>
            <span className="eyebrow">OWNERSHIP VERIFICATION</span>
            <h2>Claim Item: {item.title}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            alignItems: "center",
            padding: "12px",
            borderRadius: "14px",
            background: "rgba(2, 6, 23, 0.6)",
            marginBottom: "16px",
            border: "1px solid var(--line-strong)",
          }}
        >
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "10px" }}
            />
          ) : (
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "10px",
                background: "#1e293b",
                display: "grid",
                placeItems: "center",
                fontSize: "24px",
              }}
            >
              📦
            </div>
          )}
          <div>
            <h4 style={{ fontSize: "14px", fontWeight: 700, color: "#fff" }}>{item.title}</h4>
            <p style={{ fontSize: "12px", color: "var(--muted)" }}>
              Found at 📍 {item.location} on {item.date.slice(0, 10)}
            </p>
          </div>
        </div>

        {error && <div className="message error">{error}</div>}

        <form onSubmit={handleSubmit} className="item-form">
          <label>
            Proof of Ownership Description *
            <textarea
              rows={4}
              placeholder="Provide specific details proving this belongs to you (e.g., serial number, unique marks/stickers, wallpaper, bag contents, lock combination)..."
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              required
            />
          </label>

          <p style={{ fontSize: "11px", color: "var(--muted)", margin: "4px 0" }}>
            🔒 The finder or campus administrator will review your description before approving the claim.
          </p>

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? "Submitting..." : "Submit Claim Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClaimModal;
