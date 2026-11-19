
import type {
  CurrentUser,
  Item,
  User,
  Claim,
  MatchResult,
  Notification,
  ItemFormData,
} from "../types";

// Backend API URL
export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL ||
  "http://localhost:5000/api";

// Authentication headers
const authHeaders = (token?: string) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

export const api = {
  // ================= AUTH =================
  auth: {
    async register(data: {
      name: string;
      email: string;
      password: string;
    }) {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }

      return result;
    },

    async login(data: {
      email: string;
      password: string;
    }): Promise<{
      success: boolean;
      message: string;
      data: CurrentUser;
    }> {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }

      return result;
    },
  },

  // ================= ITEMS =================
  items: {
    async getAll(): Promise<Item[]> {
      const response = await fetch(`${API_BASE_URL}/items`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load items");
      }

      return result.data || [];
    },

    async getById(id: string): Promise<Item> {
      const response = await fetch(`${API_BASE_URL}/items/${id}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load item");
      }

      return result.data;
    },

    async create(
      data: ItemFormData,
      token: string
    ): Promise<Item> {
      const response = await fetch(`${API_BASE_URL}/items`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create item");
      }

      return result.data;
    },

    async update(
      id: string,
      data: Partial<ItemFormData>,
      token: string
    ): Promise<Item> {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update item");
      }

      return result.data;
    },

    async delete(
      id: string,
      token: string
    ): Promise<{ success: boolean; message: string }> {
      const response = await fetch(`${API_BASE_URL}/items/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete item");
      }

      return result;
    },

    async getMatches(id: string): Promise<MatchResult[]> {
      const response = await fetch(
        `${API_BASE_URL}/items/${id}/matches`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load matches");
      }

      return result.data || [];
    },
  },

  // ================= CLAIMS =================
  claims: {
    async getAll(token: string): Promise<Claim[]> {
      const response = await fetch(`${API_BASE_URL}/claims`, {
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load claims");
      }

      return result.data || [];
    },

    async getMyReceived(token: string): Promise<Claim[]> {
      const response = await fetch(`${API_BASE_URL}/claims/my`, {
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load received claims");
      }

      return result.data || [];
    },

    async getMySubmitted(token: string): Promise<Claim[]> {
      const response = await fetch(`${API_BASE_URL}/claims/submitted`, {
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load submitted claims");
      }

      return result.data || [];
    },

    async create(
      itemId: string,
      proofDescription: string,
      token: string
    ): Promise<Claim> {
      const response = await fetch(`${API_BASE_URL}/claims`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ itemId, proofDescription }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to submit claim");
      }

      return result.data;
    },

    async updateStatus(
      id: string,
      status: "APPROVED" | "REJECTED",
      token: string
    ): Promise<Claim> {
      const response = await fetch(`${API_BASE_URL}/claims/${id}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify({ status }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to update claim");
      }

      return result.data;
    },
  },

  // ================= NOTIFICATIONS =================
  notifications: {
    async getAll(token: string): Promise<Notification[]> {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load notifications");
      }

      return result.data || [];
    },

    async delete(
      id: string,
      token: string
    ): Promise<{ success: boolean; message: string }> {
      const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete notification");
      }

      return result;
    },
  },

  // ================= USERS (ADMIN) =================
  users: {
    async getAll(token: string): Promise<User[]> {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load users");
      }

      return result.data || [];
    },

    async delete(
      id: string,
      token: string
    ): Promise<{ success: boolean; message: string }> {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to delete user");
      }

      return result;
    },
  },

  // ================= AI CHATBOT =================
  chatbot: {
    async sendMessage(message: string): Promise<string> {
      const response = await fetch(`${API_BASE_URL}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Chatbot is unavailable");
      }

      return result.reply || "No response received.";
    },
  },

  // ================= AI IMAGE RECOGNITION =================
  imageRecognition: {
    async recognize(imageData: string): Promise<string> {
      const response = await fetch(`${API_BASE_URL}/image-recognition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Image recognition failed");
      }

      return result.result || "";
    },
  },
};
