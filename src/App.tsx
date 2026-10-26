
import { useEffect, useState } from "react";
import "./App.css";

interface Item {
  _id: string;
  title: string;
  description: string;
  category: string;
  itemType: "LOST" | "FOUND";
  location: string;
  date: string;
  image?: string;
  status: string;
}


const emptyForm = {
  title: "",
  description: "",
  category: "",
  itemType: "LOST" as "LOST" | "FOUND",
  location: "",
  date: new Date().toISOString().slice(0, 10),
  userId: "",
  image: "",
};


function App() {
  const [items, setItems] = useState<Item[]>([]);
  
const [authMode, setAuthMode] = useState<"login" | "register" | null>(null);

const [authForm, setAuthForm] = useState({
  name: "",
  email: "",
  password: "",
});

const [authMessage, setAuthMessage] = useState("");
const [authLoading, setAuthLoading] = useState(false);

const [currentUser, setCurrentUser] = useState<{
  userId: string;
  name: string;
  email: string;
  token: string;
} | null>(null);

  const [filter, setFilter] = useState<"ALL" | "LOST" | "FOUND">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState(emptyForm);

  const loadItems = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/items");
      if (!response.ok) throw new Error("Could not load items");

      const result = await response.json();
      setItems(result.data);
      setError("");
    } catch {
      setError("Could not connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  
const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  setNotice("");

  if (!currentUser) {
    setNotice("Please login before reporting an item.");
    setShowForm(false);
    setAuthMode("login");
    return;
  }

  setSaving(true);


    try {
      const response = await fetch("http://localhost:5000/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to report item.");
      }

      setNotice("Item reported successfully!");
      setForm(emptyForm);
      setShowForm(false);
      setLoading(true);
      await loadItems();
    } catch (err) {
      setNotice(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  };

  
const filteredItems = items.filter((item) => {
  const matchesFilter =
    filter === "ALL" || item.itemType === filter;

  const query = searchTerm.trim().toLowerCase();

  const matchesSearch =
    item.title.toLowerCase().includes(query) ||
    item.location.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query);

  const matchesCategory =
  categoryFilter === "ALL" || item.category === categoryFilter;

return matchesFilter && matchesSearch && matchesCategory;
});


  return (
    <main className="app">
      
<header className="navbar">
  <a className="brand" href="/">
    <span className="brand-icon">🔎</span>
    FindIt
  </a>

  <div className="nav-label">Smart Lost & Found</div>

  <div className="auth-buttons">
    {currentUser ? (
      <>
        <span>Hi, {currentUser.name}</span>
        <button
          type="button"
          onClick={() => setCurrentUser(null)}
        >
          Logout
        </button>
      </>
    ) : (
      <>
        <button
          type="button"
          onClick={() => {
            setAuthMode("login");
            setAuthMessage("");
          }}
        >
          Login
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode("register");
            setAuthMessage("");
          }}
        >
          Register
        </button>
      </>
    )}
  </div>
</header>


      <section className="hero">
        <span className="eyebrow">LOST SOMETHING? FOUND SOMETHING?</span>
        <h1>
          Lost it? <span>Let's find it.</span>
        </h1>
        <p>
          Help bring someone's precious belongings back home.
          Report lost or found items and explore community reports.
        </p>
        <div className="hero-actions">
          <button
            className="hero-button"
            onClick={() => {
              setForm({ ...emptyForm, itemType: "LOST" });
              setShowForm(true);
              setNotice("");
            }}
          >
            + Report Lost Item
          </button>
          <button
            className="hero-button secondary"
            onClick={() => {
              setForm({ ...emptyForm, itemType: "FOUND" });
              setShowForm(true);
              setNotice("");
            }}
          >
            + Report Found Item
          </button>
        </div>
      </section>
      
{authMode && (
  <section className="form-section">
    <div className="form-heading">
      <div>
        <span className="eyebrow">WELCOME TO FINDIT</span>
        <h2>{authMode === "register" ? "Create Account" : "Login"}</h2>
      </div>

      <button
        type="button"
        className="close-button"
        onClick={() => setAuthMode(null)}
      >
        ✕
      </button>
    </div>

    <form
      className="item-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setAuthLoading(true);
        setAuthMessage("");

        try {
          const response = await fetch(
            `http://localhost:5000/api/auth/${authMode}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(authForm),
            }
          );

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || "Authentication failed.");
          }

          let data = result.data;

          if (authMode === "register") {
            const loginResponse = await fetch(
              "http://localhost:5000/api/auth/login",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  email: authForm.email,
                  password: authForm.password,
                }),
              }
            );

            const loginResult = await loginResponse.json();

            if (!loginResponse.ok) {
              throw new Error(loginResult.message || "Please login.");
            }

            data = loginResult.data;
          }

          setCurrentUser({
            userId: data.userId,
            name: data.name,
            email: data.email,
            token: data.token,
          });

          setForm((previous) => ({
            ...previous,
            userId: data.userId,
          }));

          setAuthMode(null);
          setAuthForm({ name: "", email: "", password: "" });
          setNotice(`Welcome, ${data.name}!`);
        } catch (err) {
          setAuthMessage(
            err instanceof Error ? err.message : "Something went wrong."
          );
        } finally {
          setAuthLoading(false);
        }
      }}
    >
      {authMode === "register" && (
        <label>
          Full Name
          <input
            required
            value={authForm.name}
            onChange={(e) =>
              setAuthForm({ ...authForm, name: e.target.value })
            }
            placeholder="Enter your name"
          />
        </label>
      )}

      <label>
        Email
        <input
          required
          type="email"
          value={authForm.email}
          onChange={(e) =>
            setAuthForm({ ...authForm, email: e.target.value })
          }
          placeholder="Enter your email"
        />
      </label>

      <label>
        Password
        <input
          required
          type="password"
          minLength={6}
          value={authForm.password}
          onChange={(e) =>
            setAuthForm({ ...authForm, password: e.target.value })
          }
          placeholder="At least 6 characters"
        />
      </label>

      {authMessage && (
        <p className="message error">{authMessage}</p>
      )}

      <div className="form-actions">
        <button
          type="button"
          className="cancel-button"
          onClick={() => setAuthMode(null)}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="submit-button"
          disabled={authLoading}
        >
          {authLoading
            ? "Please wait..."
            : authMode === "register"
              ? "Create Account"
              : "Login"}
        </button>
      </div>
    </form>
  </section>
)}


      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}

      {showForm && (
        <section className="form-section">
          <div className="form-heading">
            <div>
              <span className="eyebrow">COMMUNITY REPORT</span>
              <h2>Report an Item</h2>
            </div>
            <button
              className="close-button"
              onClick={() => setShowForm(false)}
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="item-form">
            <label>
              Report type
              <select
                value={form.itemType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    itemType: e.target.value as "LOST" | "FOUND",
                  })
                }
              >
                <option value="LOST">Lost item</option>
                <option value="FOUND">Found item</option>
              </select>
            </label>

            <label>
              Item name
              <input
                required
                value={form.title}
                onChange={(e) =>
                  setForm({ ...form, title: e.target.value })
                }
                placeholder="e.g. Black wallet"
              />
            </label>

            <label>
              Category
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value })
                }
              >
                <option value="">Choose category</option>
                <option value="Electronics">Electronics</option>
                <option value="Bags">Bags</option>
                <option value="Documents">Documents</option>
                <option value="Keys">Keys</option>
                <option value="Clothing">Clothing</option>
                <option value="Jewelry">Jewelry</option>
                <option value="Pets">Pets</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label>
              Description
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Describe the item..."
              />
            </label>

            
<label>
  Item Photo
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        const reader = new FileReader();

        reader.onloadend = () => {
          setForm((previous) => ({
            ...previous,
            image: reader.result as string,
          }));
        };

        reader.readAsDataURL(file);
      }
    }}
  />
  
{form.image && (
  <div className="photo-preview">
    <img
      src={form.image}
      alt="Selected item preview"
      style={{
        width: "180px",
        height: "150px",
        objectFit: "cover",
        borderRadius: "10px",
        marginTop: "10px",
      }}
    />
  </div>
)}

  <small>Upload a photo of the lost or found item.</small>
</label>


            <label>
              Location
              <input
                required
                value={form.location}
                onChange={(e) =>
                  setForm({ ...form, location: e.target.value })
                }
                placeholder="Where was it lost or found?"
              />
            </label>

            <label>
              Date
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm({ ...form, date: e.target.value })
                }
              />
            </label>

            
{!currentUser && (
  <p className="message">
    Please register or login before reporting an item.
  </p>
)}

{currentUser && (
  <p className="message">
    Reporting as: {currentUser.name}
  </p>
)}


            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="submit-button" disabled={saving}>
                {saving ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="items-section" id="items">
        <div className="section-heading">
          <div>
            <span className="eyebrow">COMMUNITY REPORTS</span>
            <h2>Lost & Found Items</h2>
            <p>Browse items reported by the community.</p>
          </div>
          <span className="item-count">{items.length} items</span>
        </div>
         
<div className="search-box">
  <span>🔎</span>
  <input
    type="text"
    placeholder="Search by item name, location, or category..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
  />
  {searchTerm && (
    <button
      type="button"
      onClick={() => setSearchTerm("")}
      aria-label="Clear search"
    >
      ✕
    </button>
  )}
</div>

<div className="category-filter">
  <label htmlFor="categoryFilter">Category:</label>
  <select
    id="categoryFilter"
    value={categoryFilter}
    onChange={(e) => setCategoryFilter(e.target.value)}
  >
    <option value="ALL">All Categories</option>
    <option value="Electronics">Electronics</option>
    <option value="Bags">Bags</option>
    <option value="Documents">Documents</option>
    <option value="Keys">Keys</option>
    <option value="Clothing">Clothing</option>
    <option value="Jewelry">Jewelry</option>
    <option value="Pets">Pets</option>
    <option value="Other">Other</option>
  </select>
</div>


        <div className="filters">
          {(["ALL", "LOST", "FOUND"] as const).map((value) => (
            <button
              key={value}
              className={filter === value ? "filter active" : "filter"}
              onClick={() => setFilter(value)}
            >
              {value === "ALL"
                ? "All items"
                : value === "LOST"
                  ? "🔴 Lost items"
                  : "🟢 Found items"}
            </button>
          ))}
        </div>

        {loading && <p className="message">Loading items...</p>}
        {!loading && error && <p className="message error">{error}</p>}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="empty-state">
            <span>🔍</span>
            <h3>No items reported yet</h3>
            <p>Reported items will appear here.</p>
          </div>
        )}

        <div className="items-grid">
          {filteredItems.map((item) => (
            <article className="item-card" key={item._id}>
              {item.image ? (
                <img className="item-image" src={item.image} alt={item.title} />
              ) : (
                <div className="item-placeholder">📦</div>
              )}

              <div className="item-content">
                <span className={item.itemType === "LOST" ? "badge lost" : "badge found"}>
                  {item.itemType}
                </span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <div className="item-meta">
                  <span>📍 {item.location}</span>
                  <span>🏷️ {item.category}</span>
                  <span>📅 {new Date(item.date).toLocaleDateString()}</span>
                </div>
                <span className="status">{item.status}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>FindIt — Helping lost belongings find their way home.</p>
      </footer>
    </main>
  );
}

export default App;
