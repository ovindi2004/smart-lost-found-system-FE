import { useEffect, useState, type FormEvent } from "react";
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
  status: "OPEN" | "MATCHED" | "RETURNED" | string;
  userId:
    | string
    | {
        _id: string;
        name: string;
        email: string;
      };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
}

interface MatchResult {
  item: Item;
  matchScore: number;
  matchedReasons: string[];
}

interface Claim {
  _id: string;
  itemId: Item | string;
  claimantId: {
    _id: string;
    name: string;
    email: string;
  };
  ownerId: {
    _id: string;
    name: string;
    email: string;
  };
  proofDescription: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
}

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}
interface Notification {
  _id: string;
  message: string;
  type: "CLAIM_REQUEST" | "CLAIM_APPROVED" | "CLAIM_REJECTED";
  isRead: boolean;
  relatedItemId?: string;
  createdAt?: string;
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
  const [users, setUsers] = useState<User[]>([]);

  // DASHBOARD COUNTS
  const totalItems = items.length;
  const lostItems = items.filter((item) => item.itemType === "LOST").length;
  const foundItems = items.filter((item) => item.itemType === "FOUND").length;
  const matchedItems = items.filter((item) => item.status === "MATCHED").length;
  const returnedItems = items.filter((item) => item.status === "RETURNED").length;

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
  role: "USER" | "ADMIN";
  token: string;
} | null>(() => {
  const savedUser = localStorage.getItem("currentUser");

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("currentUser");
    return null;
  }
});
  const [filter, setFilter] = useState<"ALL" | "LOST" | "FOUND" | "MY">("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Smart Matching states
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [matchingItem, setMatchingItem] = useState<Item | null>(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingError, setMatchingError] = useState("");

 // Claim System states
const [claims, setClaims] = useState<Claim[]>([]);
const [submittedClaims, setSubmittedClaims] = useState<Claim[]>([]);
const [claimItem, setClaimItem] = useState<Item | null>(null);
const [proofDescription, setProofDescription] = useState("");
const [claimLoading, setClaimLoading] = useState(false);
const [claimMessage, setClaimMessage] = useState("");


// NOTIFICATION STATES
const [notifications, setNotifications] = useState<Notification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);
const [showNotifications, setShowNotifications] = useState(false);

// CHATBOT STATES
const [chatOpen, setChatOpen] = useState(false);
const [chatInput, setChatInput] = useState("");
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
  {
    role: "bot",
    text: "Hello! 👋 Welcome to UniFind. How can I help you today?",
  },
]);
const [chatLoading, setChatLoading] = useState(false);


// IMAGE RECOGNITION STATES
const [imageRecognitionLoading, setImageRecognitionLoading] = useState(false);
const [imageRecognitionResult, setImageRecognitionResult] = useState("");
const [imageRecognitionError, setImageRecognitionError] = useState("");
// SEND CHATBOT MESSAGE
const handleSendChatMessage = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const message = chatInput.trim();

  if (!message || chatLoading) return;

  setChatMessages((prev) => [
    ...prev,
    { role: "user", text: message },
  ]);

  setChatInput("");
  setChatLoading(true);

  try {
    const response = await fetch("http://localhost:5000/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Chatbot is unavailable.");
    }

    setChatMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text: result.reply || "Sorry, I couldn't answer that.",
      },
    ]);
  } catch (error) {
    setChatMessages((prev) => [
      ...prev,
      {
        role: "bot",
        text:
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      },
    ]);
  } finally {
    setChatLoading(false);
  }
};

// AI IMAGE RECOGNITION
const handleRecognizeImage = async (file: File) => {
  setImageRecognitionLoading(true);
  setImageRecognitionResult("");
  setImageRecognitionError("");

  const reader = new FileReader();

  reader.onloadend = async () => {
    const imageData = reader.result as string;

    setForm((prev) => ({
      ...prev,
      image: imageData,
    }));

    try {
      const response = await fetch(
        "http://localhost:5000/api/image-recognition",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Image recognition failed."
        );
      }

      const aiResult = result.result || "";

try {
  const parsedResult = JSON.parse(aiResult);

  setForm((prev) => ({
    ...prev,
    title: parsedResult.title || prev.title,
    category: parsedResult.category || prev.category,
    description: parsedResult.description || prev.description,
  }));

  setImageRecognitionResult(aiResult);
} catch {
  setImageRecognitionResult(aiResult);
}
    } catch (error) {
      setImageRecognitionError(
        error instanceof Error
          ? error.message
          : "Image recognition failed."
      );
    } finally {
      setImageRecognitionLoading(false);
    }
  };

  reader.onerror = () => {
    setImageRecognitionError("Could not read the selected image.");
    setImageRecognitionLoading(false);
  };

  reader.readAsDataURL(file);
};

  // Load all items
  const loadItems = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/items");
      if (!response.ok) {
        throw new Error("Could not load items");
      }
      const result = await response.json();
      setItems(result.data || []);
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

  useEffect(() => {
    const fetchUsers = async () => {
      if (currentUser?.role !== "ADMIN") return;

      try {
        const response = await fetch("http://localhost:5000/api/users", {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        });

        const data = await response.json();

        if (response.ok) {
          setUsers(data.data || []);
        } else {
          console.error(data.message);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [currentUser]);


// LOAD CLAIMS
useEffect(() => {
  const fetchClaims = async () => {
    if (!currentUser) {
      setClaims([]);
      setSubmittedClaims([]);
      return;
    }

    try {
      const endpoint =
        currentUser.role === "ADMIN"
          ? "http://localhost:5000/api/claims"
          : "http://localhost:5000/api/claims/my";

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setClaims(result.data || []);
      } else {
        console.error("Failed to load claims:", result.message);
      }

      // LOAD CLAIMS SUBMITTED BY USER
      if (currentUser.role === "USER") {
        const submittedResponse = await fetch(
          "http://localhost:5000/api/claims/submitted",
          {
            headers: {
              Authorization: `Bearer ${currentUser.token}`,
            },
          }
        );

        const submittedResult = await submittedResponse.json();

        if (submittedResponse.ok) {
          setSubmittedClaims(submittedResult.data || []);
        } else {
          console.error(
            "Failed to load submitted claims:",
            submittedResult.message
          );
        }
      }
    } catch (error) {
      console.error("Error loading claims:", error);
    }
  };

  void fetchClaims();
}, [currentUser]);


// LOAD USER NOTIFICATIONS
useEffect(() => {
  const fetchNotifications = async () => {
    if (!currentUser?.token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications",
        {
          headers: {
            Authorization: `Bearer ${currentUser.token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load notifications."
        );
      }

      const notificationList: Notification[] = result.data || [];

      setNotifications(notificationList);

      setUnreadCount(
        notificationList.filter(
          (notification) => !notification.isRead
        ).length
      );
    } catch (error) {
      console.error("Notification loading error:", error);
    }
  };

  void fetchNotifications();
}, [currentUser?.token]);

 // DELETE NOTIFICATION AFTER SEEN
const handleDeleteNotification = async (notificationId: string) => {
  if (!currentUser?.token) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/notifications/${notificationId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to delete notification.");
    }

    setNotifications((prev) =>
      prev.filter((notification) => notification._id !== notificationId)
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));
  } catch (error) {
    console.error("Delete notification error:", error);
  }
};

  // FIND SMART MATCHES
  const handleFindMatches = async (item: Item) => {
    setMatchingItem(item);
    setMatches([]);
    setMatchingError("");
    setMatchingLoading(true);

    try {
      const response = await fetch(
        `http://localhost:5000/api/items/${item._id}/matches`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to find matches.");
      }

      setMatches(result.data || []);
    } catch (err) {
      setMatchingError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setMatchingLoading(false);
    }
  };
   
// SUBMIT CLAIM REQUEST
const handleSubmitClaim = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!currentUser) {
    setClaimMessage("Please login before submitting a claim.");
    return;
  }

  if (!claimItem || !proofDescription.trim()) {
    setClaimMessage("Please provide ownership proof.");
    return;
  }

  setClaimLoading(true);
  setClaimMessage("");

  try {
    const response = await fetch("http://localhost:5000/api/claims", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${currentUser.token}`,
      },
      body: JSON.stringify({
        itemId: claimItem._id,
        proofDescription: proofDescription.trim(),
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to submit claim.");
    }

    setClaimMessage("Claim submitted successfully!");

    setProofDescription("");
    setClaimItem(null);

    setNotice("Your claim request has been submitted!");

    const submittedResponse = await fetch(
  "http://localhost:5000/api/claims/submitted",
  {
    headers: {
      Authorization: `Bearer ${currentUser.token}`,
    },
  }
);

const submittedResult = await submittedResponse.json();

if (submittedResponse.ok) {
  console.log("MY SUBMITTED CLAIMS RESPONSE:", submittedResult);
  setSubmittedClaims(submittedResult.data || []);
}
  } catch (err) {
    setClaimMessage(
      err instanceof Error ? err.message : "Something went wrong."
    );
  } finally {
    setClaimLoading(false);
  }
};
// APPROVE OR REJECT CLAIM
const handleUpdateClaim = async (
  claimId: string,
  status: "APPROVED" | "REJECTED"
) => {
  if (!currentUser) return;

  const confirmed = window.confirm(
    `Are you sure you want to ${status.toLowerCase()} this claim?`
  );

  if (!confirmed) return;

  try {
    const response = await fetch(
      `http://localhost:5000/api/claims/${claimId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Failed to update claim.");
    }

    setNotice(result.message);

    // Reload claims
    const endpoint =
      currentUser.role === "ADMIN"
        ? "http://localhost:5000/api/claims"
        : "http://localhost:5000/api/claims/my";

    const claimsResponse = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${currentUser.token}`,
      },
    });

    const claimsResult = await claimsResponse.json();

    if (claimsResponse.ok) {
      setClaims(claimsResult.data || []);
    }

    await loadItems();
  } catch (err) {
    setNotice(
      err instanceof Error ? err.message : "Something went wrong."
    );
  }
};
  // Edit item
  const handleEdit = (item: Item) => {
    setForm({
      title: item.title,
      description: item.description,
      category: item.category,
      itemType: item.itemType,
      location: item.location,
      date: item.date.slice(0, 10),
      userId: currentUser?.userId || "",
      image: item.image || "",
    });

    setEditingId(item._id);
    setShowForm(true);
    setNotice("");
  };

  // Delete item
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this item?");
    if (!confirmed) return;

    try {
      const response = await fetch(`http://localhost:5000/api/items/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete item.");
      }

      setNotice("Item deleted successfully!");
      await loadItems();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  // UPDATE ITEM STATUS
  const handleStatusChange = async (item: Item, newStatus: string) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/items/${item._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update status.");
      }

      setNotice("Item status updated successfully!");
      await loadItems();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  // Create or update item
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
      const itemData = {
        ...form,
        userId: currentUser.userId,
      };

      const url = editingId
        ? `http://localhost:5000/api/items/${editingId}`
        : "http://localhost:5000/api/items";

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(itemData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save item.");
      }

      setNotice(
        editingId
          ? "Item updated successfully!"
          : "Item reported successfully!"
      );

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);

      await loadItems();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Search and filter
  const filteredItems = items.filter((item) => {
    const ownerId =
      typeof item.userId === "string" ? item.userId : item.userId?._id;

    const matchesFilter =
      filter === "ALL" ||
      item.itemType === filter ||
      (filter === "MY" && currentUser?.userId === ownerId);

    const query = searchTerm.trim().toLowerCase();

    const matchesSearch =
      item.title.toLowerCase().includes(query) ||
      item.location.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query);

    const matchesCategory =
      categoryFilter === "ALL" || item.category === categoryFilter;

    return matchesFilter && matchesSearch && matchesCategory;
  });

  const handleDeleteUser = async (userId: string) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirmDelete) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${currentUser?.token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUsers((prevUsers) =>
          prevUsers.filter((user) => user._id !== userId)
        );
        alert("User deleted successfully!");
      } else {
        alert(data.message || "Failed to delete user");
      }
    } catch (error) {
      console.error("Delete user error:", error);
    }
  };

  return (
    <main className="app">
      {/* Navigation */}
      <header className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">🎓</span>
          <span className="brand-title">UniFind</span>
        </a>

        <div className="nav-label">Smart Lost & Found Portal</div>

        <div className="auth-buttons">
          {currentUser ? (
           <div className="user-profile-badge">
  <button
    type="button"
    className="notification-bell"
    onClick={() => setShowNotifications(!showNotifications)}
  >
    🔔
    {unreadCount > 0 && (
      <span className="notification-count">
        {unreadCount}
      </span>
    )}
  </button>

  <span className="user-name">Hi, {currentUser.name}</span>
  <span className="role-tag">{currentUser.role}</span>

  <button
    type="button"
    className="btn-logout"
    onClick={() => {
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
      setNotice("Logged out successfully!");
    }}
  >
    Logout
  </button>
  {showNotifications && (
  <div className="notification-panel">
    <div className="notification-panel-header">
      <strong>Notifications</strong>
      <span>{unreadCount} unread</span>
    </div>

    {notifications.length === 0 ? (
      <p>No notifications yet.</p>
    ) : (
      notifications.map((notification) => (
        <div
         key={notification._id}
  className="notification-item"
  onClick={() => handleDeleteNotification(notification._id)}
  style={{ cursor: "pointer" }}
        >
          <p>{notification.message}</p>

          <small>
            
            {notification.createdAt
              ? new Date(notification.createdAt).toLocaleString()
              : ""}
              
          </small>

        
          
        </div>
      ))
    )}
  </div>
)}
</div>
          ) : (
            <div className="auth-action-btns">
              <button
                type="button"
                className="btn-login"
                onClick={() => {
                  setAuthMode("login");
                  setAuthMessage("");
                }}
              >
                Login
              </button>
              <button
                type="button"
                className="btn-register"
                onClick={() => {
                  setAuthMode("register");
                  setAuthMessage("");
                }}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <span className="eyebrow">UNIVERSITY CAMPUS RECOVERY NETWORK</span>
        <h1>
          Lost it on Campus? <span>Let's find it fast.</span>
        </h1>
        <p>
          Connect with students and staff to return lost items quickly using smart matching filters.
        </p>

        <div className="hero-actions">
          <button
            className="hero-button primary"
            onClick={() => {
              setEditingId(null);
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
              setEditingId(null);
              setForm({ ...emptyForm, itemType: "FOUND" });
              setShowForm(true);
              setNotice("");
            }}
          >
            + Report Found Item
          </button>
        </div>
      </section>

      {/* USER & ADMIN DASHBOARDS */}
      {currentUser && (
        <section className="dashboard">
          <h2>
            {currentUser.role === "ADMIN"
              ? "🛡️ Admin Operations Center"
              : "📊 Campus Dashboard"}
          </h2>

          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Total Reports</h3>
              <p>{totalItems}</p>
            </div>
            <div className="dashboard-card lost">
              <h3>Lost Items</h3>
              <p>{lostItems}</p>
            </div>
            <div className="dashboard-card found">
              <h3>Found Items</h3>
              <p>{foundItems}</p>
            </div>
            <div className="dashboard-card matched">
              <h3>Matched Items</h3>
              <p>{matchedItems}</p>
            </div>
            <div className="dashboard-card returned">
              <h3>Returned Items</h3>
              <p>{returnedItems}</p>
            </div>
          </div>


          {/* CLAIMS MANAGEMENT */}
<div className="user-management">
  <div className="um-header">
    <div>
      <span className="um-eyebrow">
        📩 CLAIM MANAGEMENT
      </span>
      <h3>
        {currentUser.role === "ADMIN"
          ? "All Claim Requests"
          : "Received Claim Requests"}
      </h3>
    </div>

    <span className="badge-count">
      Total Claims: {claims.length}
    </span>
  </div>

  {claims.length === 0 ? (
    <div className="empty-state">
      <h3>No Claim Requests Yet</h3>
      <p>Claim requests will appear here.</p>
    </div>
  ) : (
    <div className="users-table-wrap">
      <table className="users-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Claimant</th>
            <th>Ownership Proof</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {claims.map((claim) => {
            const item =
              typeof claim.itemId === "string"
                ? null
                : claim.itemId;

            return (
              <tr key={claim._id}>
                <td className="cell-name">
                  {item?.title || "Item"}
                </td>

                <td>
                  {claim.claimantId?.name || "Unknown"}
                  <br />
                  <small>
                    {claim.claimantId?.email || ""}
                  </small>
                </td>

                <td>{claim.proofDescription}</td>

                <td>
                  <span
                    className={`role-badge ${claim.status.toLowerCase()}`}
                  >
                    {claim.status}
                  </span>
                </td>

                <td>
                  {currentUser.role === "USER" &&
                    claim.status === "PENDING" && (
                      <div className="item-actions">
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() =>
                            handleUpdateClaim(claim._id, "APPROVED")
                          }
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() =>
                            handleUpdateClaim(claim._id, "REJECTED")
                          }
                        >
                          Reject
                        </button>
                      </div>
                    )}

                  {currentUser.role === "ADMIN" && (
                    <span>Monitor Only</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  )}
</div>

{/* MY SUBMITTED CLAIMS */}
{currentUser.role === "USER" && (
  <div className="user-management">
    <div className="um-header">
      <div>
        <span className="um-eyebrow">
          📤 MY CLAIM REQUESTS
        </span>
        <h3>My Submitted Claims</h3>
      </div>

      <span className="badge-count">
        Total: {submittedClaims.length}
      </span>
    </div>

    {submittedClaims.length === 0 ? (
      <div className="empty-state">
        <h3>No Submitted Claims Yet</h3>
        <p>Your submitted claim requests will appear here.</p>
      </div>
    ) : (
      <div className="users-table-wrap">
        <table className="users-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Item Owner</th>
              <th>Ownership Proof</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {submittedClaims.map((claim) => {
              const item =
                typeof claim.itemId === "string"
                  ? null
                  : claim.itemId;

              return (
                <tr key={claim._id}>
                  <td className="cell-name">
                    {item?.title || "Item"}
                  </td>

                  <td>
                    {claim.ownerId?.name || "Unknown"}
                    <br />
                    <small>
                      {claim.ownerId?.email || ""}
                    </small>
                  </td>

                  <td>{claim.proofDescription}</td>

                  <td>
                    <span
                      className={`role-badge ${claim.status.toLowerCase()}`}
                    >
                      {claim.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

          {/* ADMIN USER MANAGEMENT */}
          {currentUser.role === "ADMIN" && (
            <div className="user-management">
              <div className="um-header">
                <div>
                  <span className="um-eyebrow">
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Administrative Management Center
                  </span>
                  <h3>Campus Registered Users</h3>
                </div>
                <span className="badge-count">
                  Total Registered Accounts: {users.length}
                </span>
              </div>

              <div className="users-table-wrap">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Joined Date</th>
                      <th className="th-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id}>
                        <td className="cell-name">{u.name}</td>
                        <td className="cell-email">{u.email}</td>
                        <td>
                          <span className={`role-badge ${u.role.toLowerCase()}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="cell-email">
                          {u.createdAt ? u.createdAt.slice(0, 10) : "—"}
                        </td>
                        <td className="th-right">
                          {u.role === "USER" && (
                            <button
                              type="button"
                              className="delete-user-button"
                              onClick={() => handleDeleteUser(u._id)}
                            >
                              Revoke User
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Auth Modal */}
      {authMode && (
        <div className="modal-overlay">
          <section className="form-section modal-card">
            <div className="form-heading">
              <div>
                <span className="eyebrow">UNIFIND ACCESS</span>
                <h2>{authMode === "register" ? "Create Account" : "User Login"}</h2>
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
                    if (!loginResponse.ok) throw new Error(loginResult.message);
                    data = loginResult.data;
                  }
                  const loggedInUser: {
                  userId: string;
                  name: string;
                  email: string;
                  role: "USER" | "ADMIN";
                  token: string;
                } = {
                   userId: data.userId,
                   name: data.name,
                   email: data.email,
                   role: data.role,
                   token: data.token,
                  };

localStorage.setItem("currentUser", JSON.stringify(loggedInUser));
setCurrentUser(loggedInUser);
                  

                  setAuthMode(null);
                  setAuthForm({ name: "", email: "", password: "" });
                  setNotice(`Welcome back, ${data.name}!`);
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
                    placeholder="e.g. Ovindi Jayawardena"
                  />
                </label>
              )}

              <label>
                Email Address
                <input
                  required
                  type="email"
                  value={authForm.email}
                  onChange={(e) =>
                    setAuthForm({ ...authForm, email: e.target.value })
                  }
                  placeholder="student@university.ac.lk"
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
                  placeholder="••••••••"
                />
              </label>

              {authMessage && <p className="message error">{authMessage}</p>}

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
                    ? "Processing..."
                    : authMode === "register"
                    ? "Create Account"
                    : "Login"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Notice Banner */}
      {notice && (
        <div className="notice" role="status">
          <span>🔔</span> {notice}
        </div>
      )}

      {/* Report / Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <section className="form-section modal-card">
            <div className="form-heading">
              <div>
                <span className="eyebrow">CAMPUS DIRECTORY REPORT</span>
                <h2>{editingId ? "Edit Report Details" : "New Item Report"}</h2>
              </div>
              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="item-form">
              <div className="form-grid">
                <label>
                  Report Type
                  <select
                    value={form.itemType}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        itemType: e.target.value as "LOST" | "FOUND",
                      })
                    }
                  >
                    <option value="LOST">🔴 Lost Item</option>
                    <option value="FOUND">🟢 Found Item</option>
                  </select>
                </label>

                <label>
                  Item Title
                  <input
                    required
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    placeholder="e.g. Silver Dell Laptop"
                  />
                </label>
              </div>

              <div className="form-grid">
                <label>
                  Category
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">Choose Category</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Bags">Bags & Backpacks</option>
                    <option value="Documents">ID & Documents</option>
                    <option value="Keys">Keys</option>
                    <option value="Clothing">Clothing</option>
                    <option value="Jewelry">Jewelry & Accessories</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label>
                  Location
                  <input
                    required
                    value={form.location}
                    onChange={(e) =>
                      setForm({ ...form, location: e.target.value })
                    }
                    placeholder="e.g. Main Library 2nd Floor"
                  />
                </label>
              </div>

              <label>
                Date Occurred
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </label>

              <label>
                Item Description
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Provide distinct marks, color details, or features..."
                />
              </label>

              <label>
  Item Photograph

  <input
    type="file"
    accept="image/jpeg,image/png,image/webp"
    onChange={(e) => {
      const file = e.target.files?.[0];

      if (file) {
        setForm((prev) => ({
          ...prev,
          image: "",
        }));

        setImageRecognitionResult("");
        setImageRecognitionError("");
        handleRecognizeImage(file);
      }
    }}
  />

  {form.image && (
    <div className="photo-preview">
      <img src={form.image} alt="Selected preview" />
    </div>
  )}

  <button
    type="button"
    className="match-button"
    disabled={!form.image || imageRecognitionLoading}
    onClick={() => {
      setImageRecognitionResult("");
      setImageRecognitionError("");
      // Image is already analyzed after upload.
      // This button displays the completed result.
    }}
  >
    {imageRecognitionLoading
      ? "🤖 Analyzing Image..."
      : "🤖 Recognize Image"}
  </button>

  {imageRecognitionLoading && (
    <p className="message">
      🤖 AI is analyzing your image...
    </p>
  )}

  {imageRecognitionResult && (
    <div className="ai-recognition-result">
      <h4>🤖 AI Image Recognition Result</h4>
      <p>{imageRecognitionResult}</p>
    </div>
  )}

  {imageRecognitionError && (
    <p className="message error">
      {imageRecognitionError}
    </p>
  )}
</label>

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setForm(emptyForm);
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-button"
                  disabled={saving}
                >
                  {saving
                    ? "Submitting..."
                    : editingId
                    ? "Update Record"
                    : "Post Report"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Items Section */}
      <section className="items-section" id="items">
        <div className="section-heading">
          <div>
            <span className="eyebrow">CAMPUS RECORDS</span>
            <h2>Lost & Found Feed</h2>
          </div>

          <span className="item-count">{filteredItems.length} Records</span>
        </div>

        {/* Filter Toolbar */}
        <div className="toolbar">
          <div className="search-box">
            <span>🔎</span>
            <input
              type="text"
              placeholder="Search by title, location, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearchTerm("")}
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-group">
            <select
              className="category-select"
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
              <option value="Other">Other</option>
            </select>

            <div className="filters">
              {currentUser && (
                <button
                  className={filter === "MY" ? "filter active" : "filter"}
                  onClick={() => setFilter("MY")}
                >
                  👤 My Posts
                </button>
              )}
              {(["ALL", "LOST", "FOUND"] as const).map((value) => (
                <button
                  key={value}
                  className={filter === value ? "filter active" : "filter"}
                  onClick={() => setFilter(value)}
                >
                  {value === "ALL"
                    ? "All"
                    : value === "LOST"
                    ? "🔴 Lost"
                    : "🟢 Found"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading && <p className="message">Loading records...</p>}
        {!loading && error && <p className="message error">{error}</p>}

        {!loading && !error && filteredItems.length === 0 && (
          <div className="empty-state">
            <span>🔍</span>
            <h3>No Records Match Your Search</h3>
            <p>Try adjusting your search filters or check back later.</p>
          </div>
        )}

        {/* Item Grid */}
        <div className="items-grid">
          {filteredItems.map((item) => {
            const ownerId =
              typeof item.userId === "string"
                ? item.userId
                : item.userId?._id;

            const isOwner = currentUser?.userId === ownerId;

            return (
              <article className="item-card" key={item._id}>
                <div className="card-image-wrap">
                  {item.image ? (
                    <img
                      className="item-image"
                      src={item.image}
                      alt={item.title}
                    />
                  ) : (
                    <div className="item-placeholder">📦</div>
                  )}
                  <span
                    className={`badge ${item.itemType.toLowerCase()}`}
                  >
                    {item.itemType}
                  </span>
                </div>

                <div className="item-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <div className="item-meta">
                    <div>
                      <strong>Location</strong>
                      <span>{item.location}</span>
                    </div>
                    <div>
                      <strong>Category</strong>
                      <span>{item.category}</span>
                    </div>
                    <div>
                      <strong>Date</strong>
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="status-control">
                    <label htmlFor={`status-${item._id}`}>Status:</label>
                    <select
                      id={`status-${item._id}`}
                      value={item.status}
                      disabled={!isOwner && currentUser?.role !== "ADMIN"}
                      onChange={(e) =>
                        handleStatusChange(item, e.target.value)
                      }
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="MATCHED">MATCHED</option>
                      <option value="RETURNED">RETURNED</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className="match-button"
                    onClick={() => handleFindMatches(item)}
                  >
                    ⚡ Smart AI Match
                  </button>
{/* CLAIM THIS ITEM BUTTON */}
{currentUser?.role === "USER" &&
  item.itemType === "FOUND" &&
  item.status === "OPEN" &&
  !isOwner && (
    <button
      type="button"
      className="match-button"
      onClick={() => {
        setClaimItem(item);
        setProofDescription("");
        setClaimMessage("");
      }}
    >
      📩 Claim This Item
    </button>
  )}

                  {(isOwner || currentUser?.role === "ADMIN") && (
                    <div className="item-actions">
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => handleEdit(item)}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDelete(item._id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* SMART MATCHING RESULTS MODAL */}
      {matchingItem && (
        <div className="modal-overlay">
          <section className="form-section modal-card matches-modal">
            <div className="form-heading">
              <div>
                <span className="eyebrow">AI MATCH ENGINE</span>
                <h2>Matches for: {matchingItem.title}</h2>
              </div>

              <button
                type="button"
                className="close-button"
                onClick={() => {
                  setMatchingItem(null);
                  setMatches([]);
                  setMatchingError("");
                }}
              >
                ✖
              </button>
            </div>

            {matchingLoading && (
              <p className="message">Analysing database for similarity matches...</p>
            )}

            {matchingError && (
              <p className="message error">{matchingError}</p>
            )}

            {!matchingLoading && !matchingError && matches.length === 0 && (
              <div className="empty-state">
                <h3>No High Similarity Matches Found</h3>
                <p>No item records currently meet score criteria.</p>
              </div>
            )}

            {!matchingLoading && matches.length > 0 && (
              <div className="items-grid modal-grid">
                {matches.map((match) => (
                  <article className="item-card" key={match.item._id}>
                    <div className="card-image-wrap">
                      {match.item.image ? (
                        <img
                          className="item-image"
                          src={match.item.image}
                          alt={match.item.title}
                        />
                      ) : (
                        <div className="item-placeholder">📦</div>
                      )}
                      <span className="match-score-badge">
                        {match.matchScore}% Match
                      </span>
                    </div>

                    <div className="item-content">
                      <h3>{match.item.title}</h3>
                      <p>{match.item.description}</p>

                      <div className="match-reasons">
                        <strong>Match Reasons:</strong>
                        <ul>
                          {match.matchedReasons.map((reason, idx) => (
                            <li key={idx}>✓ {reason}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* CLAIM REQUEST MODAL */}
{claimItem && (
  <div className="modal-overlay">
    <section className="form-section modal-card">
      <div className="form-heading">
        <div>
          <span className="eyebrow">ITEM OWNERSHIP VERIFICATION</span>
          <h2>Submit Claim Request</h2>
        </div>

        <button
          type="button"
          className="close-button"
          onClick={() => {
            setClaimItem(null);
            setProofDescription("");
            setClaimMessage("");
          }}
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmitClaim} className="item-form">
        <label>
          Item Name
          <input value={claimItem.title} readOnly />
        </label>

        <label>
          Ownership Proof
          <textarea
            required
            rows={4}
            value={proofDescription}
            onChange={(e) => setProofDescription(e.target.value)}
            placeholder="Describe unique details to prove this item belongs to you..."
          />
        </label>

        {claimMessage && (
          <p className="message error">{claimMessage}</p>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={() => {
              setClaimItem(null);
              setProofDescription("");
              setClaimMessage("");
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-button"
            disabled={claimLoading}
          >
            {claimLoading ? "Submitting..." : "Submit Claim"}
          </button>
        </div>
      </form>
    </section>
  </div>
)}
      {/* UNIFIND AI CHATBOT */}
      <div className="chatbot-container">
        {!chatOpen && (
          <button
            type="button"
            className="chatbot-toggle"
            onClick={() => setChatOpen(true)}
          >
            
            <span>Chat with AI</span>
          </button>
        )}

        {chatOpen && (
          <div className="chatbot-window">
            <div className="chatbot-header">
              <div>
                <h3> UniFind AI Assistant</h3>
                <p>How can I help you?</p>
              </div>

              <button
                type="button"
                className="chatbot-close"
                onClick={() => setChatOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="chatbot-messages">
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`chat-message ${
                    message.role === "user" ? "chat-user" : "chat-bot"
                  }`}
                >
                  {message.text}
                </div>
              ))}

              {chatLoading && (
                <div className="chat-message chat-bot">
                  Typing...
                </div>
              )}
            </div>

            <form
              className="chatbot-form"
              onSubmit={handleSendChatMessage}
            >
              <input
                type="text"
                className="chatbot-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ask me anything..."
                disabled={chatLoading}
              />

              <button
                type="submit"
                className="chatbot-send"
                disabled={chatLoading || !chatInput.trim()}
              >
                ➤
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>© UniFind Smart Lost & Found Network — University Portal</p>
      </footer>
    </main>
  );
}

export default App;