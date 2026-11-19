import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { CurrentUser, Notification } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  currentUser: CurrentUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (userData: CurrentUser) => void;
  logout: () => void;
  notifications: Notification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  toastNotice: string;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("currentUser");
      return null;
    }
  });

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastNotice, setToastNotice] = useState("");

  const showToast = useCallback((msg: string) => {
    setToastNotice(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastNotice("");
  }, []);

  // Auto clear toast after 4 seconds
  useEffect(() => {
    if (!toastNotice) return;
    const timer = setTimeout(() => {
      setToastNotice("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastNotice]);

  const login = (userData: CurrentUser) => {
    setCurrentUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    showToast(`Welcome back, ${userData.name}!`);
  };

  const logout = () => {
    setCurrentUser(null);
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem("currentUser");
    showToast("You have been logged out.");
  };

  const refreshNotifications = useCallback(async () => {
    if (!currentUser?.token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    try {
      const list = await api.notifications.getAll(currentUser.token);
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Error refreshing notifications:", err);
    }
  }, [currentUser?.token]);

  const deleteNotification = async (id: string) => {
    if (!currentUser?.token) return;
    try {
      await api.notifications.delete(id, currentUser.token);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  useEffect(() => {
    void refreshNotifications();
  }, [refreshNotifications]);

  const value: AuthContextType = {
    currentUser,
    token: currentUser?.token || null,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === "ADMIN",
    login,
    logout,
    notifications,
    unreadCount,
    refreshNotifications,
    deleteNotification,
    toastNotice,
    showToast,
    clearToast,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
