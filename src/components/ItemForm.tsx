import { useState, type FormEvent, type ChangeEvent } from "react";
import { CATEGORIES, type Item, type ItemFormData } from "../types";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";

interface ItemFormProps {
  initialItem?: Item | null;
  defaultType?: "LOST" | "FOUND";
  onClose: () => void;
  onSuccess: () => void;
}

export const ItemForm = ({
  initialItem,
  defaultType = "LOST",
  onClose,
  onSuccess,
}: ItemFormProps) => {
  const { currentUser, showToast } = useAuth();

  const [form, setForm] = useState<ItemFormData>({
    title: initialItem?.title || "",
    description: initialItem?.description || "",
    category: initialItem?.category || "",
    itemType: initialItem?.itemType || defaultType,
    location: initialItem?.location || "",
    date: initialItem?.date ? initialItem.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    image: initialItem?.image || "",
    status: initialItem?.status || "OPEN",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiNotice, setAiNotice] = useState("");
  const [aiError, setAiError] = useState("");

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setAiError("Please select a valid image file (JPG, PNG, or WEBP).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setAiError("Image file is too large. Please select an image under 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      setForm((prev) => ({ ...prev, image: base64Image }));
      setAiError("");
      setAiNotice("");
    };

    reader.onerror = () => {
      setAiError("Failed to read image file.");
    };

    reader.readAsDataURL(file);
  };

  const handleIdentifyImage = async () => {
    if (!form.image || aiLoading) return;

    setAiLoading(true);
    setAiNotice("");
    setAiError("");

    try {
      const rawResult = await api.imageRecognition.recognize(form.image);
      const cleanJson = rawResult.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      const jsonString = match ? match[0] : cleanJson;
      const parsed = JSON.parse(jsonString);

      let matchedCategory = form.category;
      if (parsed.category) {
        const found = CATEGORIES.find(
          (c) => c.toLowerCase() === parsed.category.toLowerCase()
        );
        matchedCategory = found || parsed.category;
      }

      setForm((prev) => ({
        ...prev,
        title: parsed.title ? parsed.title.trim() : prev.title,
        category: matchedCategory || prev.category,
        description: parsed.description ? parsed.description.trim() : prev.description,
      }));

      setAiNotice("✨ AI successfully identified the item! Title, category, and description have been filled.");
    } catch (err) {
      console.error("AI image recognition error:", err);
      setAiError(
        err instanceof Error
          ? err.message
          : "Image recognition failed. Please fill the details manually."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image: "" }));
    setAiNotice("");
    setAiError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError("Please log in before saving items.");
      return;
    }

    if (!form.title.trim()) {
      setError("Please provide an item title.");
      return;
    }
    if (!form.category) {
      setError("Please select an item category.");
      return;
    }
    if (!form.location.trim()) {
      setError("Please enter where the item was lost or found.");
      return;
    }
    if (!form.description.trim()) {
      setError("Please enter a short description.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (initialItem) {
        await api.items.update(initialItem._id, form, currentUser.token);
        showToast("Item updated successfully!");
      } else {
        await api.items.create(form, currentUser.token);
        showToast(`${form.itemType === "LOST" ? "Lost" : "Found"} item reported successfully!`);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="form-section" onClick={(e) => e.stopPropagation()}>
        <div className="form-heading">
          <div>
            <span className="eyebrow">
              {initialItem ? "UPDATE REPORT" : "NEW CAMPUS REPORT"}
            </span>
            <h2>{initialItem ? "Edit Item Details" : `Report ${form.itemType} Item`}</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close form">
            ✕
          </button>
        </div>

        {error && <div className="message error">{error}</div>}

        <form onSubmit={handleSubmit} className="item-form">
          {/* Item Type Switcher */}
          {!initialItem && (
            <div>
              <label style={{ marginBottom: "6px" }}>Report Type *</label>
              <div className="report-type-toggle">
                <button
                  type="button"
                  className={`filter ${form.itemType === "LOST" ? "active" : ""}`}
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    borderRadius: "10px",
                    fontWeight: 800,
                    border: "1px solid var(--line-strong)",
                    background: form.itemType === "LOST" ? "rgba(244, 63, 94, 0.25)" : "var(--field)",
                    color: form.itemType === "LOST" ? "#fda4af" : "var(--muted)",
                    borderColor: form.itemType === "LOST" ? "#fb7185" : "var(--line-strong)",
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, itemType: "LOST" }))}
                >
                  📍 I Lost Something
                </button>
                <button
                  type="button"
                  className={`filter ${form.itemType === "FOUND" ? "active" : ""}`}
                  style={{
                    padding: "10px",
                    textAlign: "center",
                    borderRadius: "10px",
                    fontWeight: 800,
                    border: "1px solid var(--line-strong)",
                    background: form.itemType === "FOUND" ? "rgba(16, 185, 129, 0.25)" : "var(--field)",
                    color: form.itemType === "FOUND" ? "#6ee7b7" : "var(--muted)",
                    borderColor: form.itemType === "FOUND" ? "#34d399" : "var(--line-strong)",
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, itemType: "FOUND" }))}
                >
                  🤝 I Found Something
                </button>
              </div>
            </div>
          )}

          {/* Image Upload with Gemini AI Recognition */}
          <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(2, 6, 23, 0.6)", border: "1px solid var(--line-strong)" }}>
            <label>
              <span>Item Photo</span>
              <span style={{ fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>
                Upload photo and click "AI Identify Image" to auto-fill details
              </span>
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFileChange}
              disabled={aiLoading}
              style={{ marginTop: "6px" }}
            />

            {aiLoading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(8, 145, 178, 0.15)",
                  border: "1px solid rgba(34, 211, 238, 0.3)",
                  color: "var(--cyan)",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                <span style={{ fontSize: "18px", animation: "pulse 1.2s infinite" }}>🤖</span>
                <span>Analyzing image with Gemini AI... Extracting title, category, and visual features.</span>
              </div>
            )}

            {aiNotice && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(16, 185, 129, 0.15)",
                  border: "1px solid rgba(16, 185, 129, 0.4)",
                  color: "#6ee7b7",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                {aiNotice}
              </div>
            )}

            {aiError && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "rgba(244, 63, 94, 0.15)",
                  border: "1px solid rgba(244, 63, 94, 0.4)",
                  color: "#fda4af",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                ⚠️ {aiError}
              </div>
            )}

            {form.image && (
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "14px", marginTop: "12px" }}>
                <img
                  src={form.image}
                  alt="Item Preview"
                  style={{ width: "88px", height: "88px", objectFit: "cover", borderRadius: "12px", border: "1px solid var(--line-strong)" }}
                />

                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="btn-ai-identify"
                    onClick={() => void handleIdentifyImage()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? "🤖 Analyzing..." : "✨ AI Identify Image"}
                  </button>

                  <button
                    type="button"
                    className="btn-delete"
                    style={{ padding: "9px 16px", fontSize: "12px" }}
                    onClick={handleRemoveImage}
                    disabled={aiLoading}
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="form-grid">
            <label>
              Item Title *
              <input
                type="text"
                placeholder="e.g., Blue Lenovo ThinkPad Laptop"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>

            <label>
              Category *
              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                required
              >
                <option value="">Select Category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label>
              Location on Campus *
              <input
                type="text"
                placeholder="e.g., Main Library 2nd Floor, Cafeteria"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                required
              />
            </label>

            <label>
              Date {form.itemType === "LOST" ? "Lost" : "Found"} *
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </label>
          </div>

          <label>
            Description *
            <textarea
              rows={3}
              placeholder="Describe color, brand, distinct marks, stickers, accessories..."
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              required
            />
          </label>

          {initialItem && (
            <label>
              Item Status
              <select
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="OPEN">OPEN</option>
                <option value="MATCHED">MATCHED</option>
                <option value="RETURNED">RETURNED</option>
              </select>
            </label>
          )}

          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="submit-button" disabled={saving || aiLoading}>
              {saving ? "Saving..." : initialItem ? "Update Item" : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
