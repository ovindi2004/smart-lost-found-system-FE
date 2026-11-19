export interface User {
  _id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
}

export interface CurrentUser {
  userId: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  token: string;
}

export interface ItemUser {
  _id: string;
  name: string;
  email: string;
}

export interface Item {
  _id: string;
  title: string;
  description: string;
  category: string;
  itemType: "LOST" | "FOUND";
  location: string;
  date: string;
  image?: string;
  status: "OPEN" | "MATCHED" | "RETURNED" | string;
  userId: string | ItemUser;
  createdAt?: string;
  updatedAt?: string;
}

export interface MatchResult {
  item: Item;
  matchScore: number;
  matchedReasons: string[];
}

export interface ClaimUser {
  _id: string;
  name: string;
  email: string;
}

export interface Claim {
  _id: string;
  itemId: Item | string;
  claimantId: ClaimUser;
  ownerId: ClaimUser;
  proofDescription: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

export interface Notification {
  _id: string;
  userId?: string;
  message: string;
  type: "CLAIM_REQUEST" | "CLAIM_APPROVED" | "CLAIM_REJECTED";
  isRead: boolean;
  relatedItemId?: string;
  createdAt?: string;
}

export interface ItemFormData {
  title: string;
  description: string;
  category: string;
  itemType: "LOST" | "FOUND";
  location: string;
  date: string;
  image?: string;
  status?: string;
}

export const CATEGORIES = [
  "Electronics",
  "Bags",
  "Documents",
  "Keys",
  "Clothing",
  "Jewelry",
  "Pets",
  "Other",
] as const;
