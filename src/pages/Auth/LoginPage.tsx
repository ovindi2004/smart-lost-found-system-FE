import { useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import "./Auth.css";

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.login({
        email: email.trim().toLowerCase(),
        password,
      });

      const user = response.data;
      login(user);

      // Determine redirect location
      const from = (location.state as any)?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-icon">🔍</div>
          <h1>Welcome to UniFind</h1>
          <p>Log in with your university account to continue.</p>
        </div>

        {error && <div className="message error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email Address
            <input
              type="email"
              placeholder="e.g., student@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Signing in..." : "Sign In to UniFind"}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
