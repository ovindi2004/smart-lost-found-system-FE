import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import HomePage from "./pages/Home/HomePage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ItemsPage from "./pages/Items/ItemsPage";
import UserDashboard from "./pages/User/UserDashboard";
import MyItemsPage from "./pages/User/MyItemsPage";
import MyClaimsPage from "./pages/User/MyClaimsPage";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import ManageUsersPage from "./pages/Admin/ManageUsersPage";
import ManageItemsPage from "./pages/Admin/ManageItemsPage";
import ManageClaimsPage from "./pages/Admin/ManageClaimsPage";

import "./App.css";

const ToastNotice = () => {
  const { toastNotice, clearToast } = useAuth();
  if (!toastNotice) return null;

  return (
    <div className="notice" role="alert">
      <span>🔔</span>
      <span>{toastNotice}</span>
      <button
        onClick={clearToast}
        style={{
          marginLeft: "8px",
          color: "var(--muted)",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        ✕
      </button>
    </div>
  );
};

function AppContent() {
  return (
    <div className="app">
      <Navbar />

      <main style={{ flex: 1 }}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/items/:id" element={<ItemsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected User Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-items"
            element={
              <ProtectedRoute>
                <MyItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-claims"
            element={
              <ProtectedRoute>
                <MyClaimsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageUsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/items"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageItemsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/claims"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ManageClaimsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
      <Chatbot />
      <ToastNotice />
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;