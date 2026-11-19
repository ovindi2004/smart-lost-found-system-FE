import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api";
import "./Auth.css";

export const RegisterPage = () => {
  const { login, showToast } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      // Automatically log the new user in
      const loginRes = await api.auth.login({
        email: email.trim().toLowerCase(),
        password,
      });

      login(loginRes.data);
      showToast("Account created successfully! Welcome to UniFind.");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-icon">🔍</div>
          <h1>Join UniFind</h1>
          <p>Create an account to report and track items on campus.</p>
        </div>

        {error && <div className="message error" style={{ marginBottom: "16px" }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Full Name *
            <input
              type="text"
              placeholder="e.g., Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>

          <label>
            University Email Address *
            <input
              type="email"
              placeholder="e.g., alex@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label>
            Password (at least 6 characters) *
            <input
              type="password"
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </label>

          <label>
            Confirm Password *
            <input
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </label>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? "Creating Account..." : "Create UniFind Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
