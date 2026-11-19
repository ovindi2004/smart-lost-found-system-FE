import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import type { Item } from "../../types";
import ItemForm from "../../components/ItemForm";
import ItemDetailModal from "../../components/ItemDetailModal";
import "./HomePage.css";

export const HomePage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [heroSearchTerm, setHeroSearchTerm] = useState("");
  const [itemFilter, setItemFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");

  // Modals
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDefaultType, setReportDefaultType] = useState<"LOST" | "FOUND">("LOST");

  const loadLatestItems = async () => {
    try {
      setLoading(true);
      const data = await api.items.getAll();
      setItems(data);
      setError("");
    } catch {
      setError("Could not load recently reported items. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLatestItems();
  }, []);

  const handleHeroSearch = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (heroSearchTerm.trim()) {
      navigate(`/items?search=${encodeURIComponent(heroSearchTerm.trim())}`);
    } else {
      navigate("/items");
    }
  };

  const handleOpenReport = (type: "LOST" | "FOUND") => {
    if (!currentUser) {
      navigate("/login", { state: { from: { pathname: "/my-items" } } });
    } else {
      setReportDefaultType(type);
      setReportModalOpen(true);
    }
  };

  const filteredItems = items.filter((item) => {
    if (itemFilter === "ALL") return true;
    return item.itemType === itemFilter;
  });

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-label">
            UNIVERSITY CAMPUS RECOVERY NETWORK
          </span>

          <h1>
            Lost Something?
            <br />
            <span>Let's Find It Together.</span>
          </h1>

          <p>
            Lost it on Campus? Let's find it fast. UniFind combines campus community reports with smart AI matching to help reunite you with your belongings quickly.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleHeroSearch} className="hero-search">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search for lost laptops, keys, student IDs, backpacks..."
              value={heroSearchTerm}
              onChange={(e) => setHeroSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {/* Quick Action Buttons */}
          <div className="hero-buttons">
            <button
              type="button"
              className="report-lost"
              onClick={() => handleOpenReport("LOST")}
            >
              + Report Lost Item
            </button>
            <button
              type="button"
              className="report-found"
              onClick={() => handleOpenReport("FOUND")}
            >
              + Report Found Item
            </button>
            <Link to="/items" className="btn-login" style={{ padding: "14px 23px", borderRadius: "9px", fontSize: "13px" }}>
              Explore All Items
            </Link>
          </div>

          <div className="hero-note">
            ✨ Smart AI Matching · Faster Recovery · Campus Community
          </div>
        </div>
      </section>

      {/* Recently Reported Items Section */}
      <section className="home-latest" id="latest-items">
        <div className="section-heading">
          <span>EXPLORE CAMPUS ITEMS</span>
          <h2>Recently Reported Items</h2>
          <p>Discover recently lost and found belongings on university grounds.</p>
        </div>

        <div className="item-filter-buttons">
          <button
            className={itemFilter === "ALL" ? "active" : ""}
            onClick={() => setItemFilter("ALL")}
          >
            All Items ({items.length})
          </button>
          <button
            className={itemFilter === "LOST" ? "active" : ""}
            onClick={() => setItemFilter("LOST")}
          >
            Lost Items ({items.filter((i) => i.itemType === "LOST").length})
          </button>
          <button
            className={itemFilter === "FOUND" ? "active" : ""}
            onClick={() => setItemFilter("FOUND")}
          >
            Found Items ({items.filter((i) => i.itemType === "FOUND").length})
          </button>
        </div>

        {loading && <p style={{ textAlign: "center", color: "var(--muted)" }}>Loading recent items...</p>}
        {error && <p style={{ textAlign: "center", color: "#fda4af" }}>{error}</p>}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="latest-placeholder">
            <span>📦</span>
            <h3>No Items Yet</h3>
            <p>Recently reported items will appear here as students report them.</p>
          </div>
        )}

        {!loading && !error && filteredItems.length > 0 && (
          <div className="latest-items-grid">
            {filteredItems.slice(0, 6).map((item) => (
              <div
                className="latest-item-card"
                key={item._id}
                onClick={() => setSelectedItem(item)}
                style={{ cursor: "pointer" }}
              >
                {item.image ? (
                  <img src={item.image} alt={item.title} loading="lazy" />
                ) : (
                  <div className="item-no-image">📦</div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                  <span className={item.itemType === "LOST" ? "lost-label" : "found-label"} style={{ margin: 0 }}>
                    {item.itemType}
                  </span>
                  <span style={{ fontSize: "11px", color: "var(--muted)" }}>
                    {item.status}
                  </span>
                </div>

                <h3>{item.title}</h3>
                <p>📂 {item.category || "Other"}</p>
                <p>📍 {item.location || "Campus"}</p>
                <p style={{ fontSize: "11px", color: "#64748b" }}>
                  📅 {item.date?.slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: "36px" }}>
          <Link to="/items" className="btn-register" style={{ display: "inline-block", padding: "12px 28px" }}>
            View All Campus Items →
          </Link>
        </div>
      </section>

      {/* How UniFind Works Section */}
      <section className="home-how" id="how-it-works">
        <div className="section-heading">
          <span>SIMPLE & SMART</span>
          <h2>How UniFind Works</h2>
          <p>Four simple steps to recover your missing belongings.</p>
        </div>

        <div className="how-grid">
          <div className="how-card">
            <span>📝</span>
            <h3>01. Report</h3>
            <p>Report a lost or found item with details and optional photo upload.</p>
          </div>

          <div className="how-card">
            <span>🤖</span>
            <h3>02. AI Matching</h3>
            <p>Gemini AI and smart matching algorithms analyze details to identify likely matches.</p>
          </div>

          <div className="how-card">
            <span>🤝</span>
            <h3>03. Claim</h3>
            <p>Submit proof of ownership description for the founder or admin to verify.</p>
          </div>

          <div className="how-card">
            <span>🎉</span>
            <h3>04. Recover</h3>
            <p>Once verified, the item is marked returned and reunited with its owner.</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="home-about" id="about">
        <h2>Making Campus Recovery Smarter</h2>
        <p>
          UniFind is the central lost and found management platform designed for university campuses.
          Leveraging AI image recognition and intelligent multi-field matching, UniFind minimizes recovery time and reconnects students, faculty, and campus security.
        </p>
      </section>

      {/* Report Modal */}
      {reportModalOpen && (
        <ItemForm
          defaultType={reportDefaultType}
          onClose={() => setReportModalOpen(false)}
          onSuccess={() => void loadLatestItems()}
        />
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onFindMatches={() => {
            setSelectedItem(null);
            navigate(`/items?search=${encodeURIComponent(selectedItem.title)}`);
          }}
          onClaim={() => {
            setSelectedItem(null);
            navigate(`/items?search=${encodeURIComponent(selectedItem.title)}`);
          }}
        />
      )}
    </div>
  );
};

export default HomePage;
